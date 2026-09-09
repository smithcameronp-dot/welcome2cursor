import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StreamEvent } from "@/lib/protocol";

import { GET, POST } from "./route";

vi.mock("@/lib/grok", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/grok")>()),
  streamAnswer: vi.fn(),
}));

const { streamAnswer } = await import("@/lib/grok");

function mockStream(events: StreamEvent[]) {
  vi.mocked(streamAnswer).mockImplementation(async function* () {
    for (const event of events) yield event;
  });
}

function mockFailure(error: unknown) {
  vi.mocked(streamAnswer).mockImplementation(async function* () {
    throw error;
  });
}

function postRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as NextRequest;
}

async function readEvents(response: Response): Promise<StreamEvent[]> {
  const body = (await response.text()).trim();
  return body ? body.split("\n").map((line) => JSON.parse(line)) : [];
}

const VALID_BODY = {
  messages: [{ role: "user", content: "Start Bijan or Gibbs?" }],
  liveSearch: true,
};

beforeEach(() => {
  vi.stubEnv("XAI_API_KEY", "xai-test");
  mockStream([{ type: "text", text: "Bijan." }, { type: "done" }]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("GET /api/chat", () => {
  it("reports a configured key and the active model", async () => {
    vi.stubEnv("GROK_MODEL", "grok-4.5");

    await expect((await GET()).json()).resolves.toEqual({
      configured: true,
      model: "grok-4.5",
    });
  });

  it("reports a missing key so the UI can prompt for one", async () => {
    vi.stubEnv("XAI_API_KEY", "");

    await expect((await GET()).json()).resolves.toMatchObject({
      configured: false,
    });
  });
});

describe("POST /api/chat", () => {
  it("streams newline-delimited events with streaming-safe headers", async () => {
    const response = await POST(postRequest(VALID_BODY));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/x-ndjson; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Accel-Buffering")).toBe("no");
    await expect(readEvents(response)).resolves.toEqual([
      { type: "text", text: "Bijan." },
      { type: "done" },
    ]);
  });

  it("forwards the transcript and the live search flag", async () => {
    const messages = [
      { role: "user", content: "Start Bijan or Gibbs?" },
      { role: "assistant", content: "Bijan." },
      { role: "user", content: "Half PPR?" },
    ];

    await POST(postRequest({ messages, liveSearch: false }));

    expect(streamAnswer).toHaveBeenCalledWith({ messages, liveSearch: false });
  });

  it("returns 503 when no API key is configured", async () => {
    vi.stubEnv("XAI_API_KEY", "");

    const response = await POST(postRequest(VALID_BODY));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("XAI_API_KEY"),
    });
    expect(streamAnswer).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(postRequest("not json"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Request body must be JSON.",
    });
  });

  it.each([
    ["a missing messages array", { liveSearch: true }],
    ["a non-array messages value", { messages: "hi", liveSearch: true }],
    ["an empty transcript", { messages: [], liveSearch: true }],
    ["a null message", { messages: [null], liveSearch: true }],
    [
      "an unknown role",
      { messages: [{ role: "system", content: "leak" }], liveSearch: true },
    ],
    [
      "blank content",
      { messages: [{ role: "user", content: "   " }], liveSearch: true },
    ],
    [
      "non-string content",
      { messages: [{ role: "user", content: 12 }], liveSearch: true },
    ],
    [
      "content over the length cap",
      {
        messages: [{ role: "user", content: "x".repeat(8001) }],
        liveSearch: true,
      },
    ],
    [
      "too many messages",
      {
        messages: Array.from({ length: 41 }, () => ({
          role: "user",
          content: "hi",
        })),
        liveSearch: true,
      },
    ],
  ])("rejects %s", async (_label, body) => {
    const response = await POST(postRequest(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("messages must be"),
    });
    expect(streamAnswer).not.toHaveBeenCalled();
  });

  it("requires liveSearch to be a boolean", async () => {
    const response = await POST(
      postRequest({ messages: VALID_BODY.messages, liveSearch: "yes" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "liveSearch must be a boolean.",
    });
  });

  it("appends an explained error event when the upstream call fails", async () => {
    mockFailure(new Error("socket hang up"));

    const response = await POST(postRequest(VALID_BODY));

    expect(response.status).toBe(200);
    await expect(readEvents(response)).resolves.toEqual([
      { type: "error", message: "socket hang up" },
    ]);
  });

  it("keeps partial text when the stream fails mid-answer", async () => {
    vi.mocked(streamAnswer).mockImplementation(async function* () {
      yield { type: "text", text: "Bijan is " };
      throw new Error("connection reset");
    });

    await expect(readEvents(await POST(postRequest(VALID_BODY)))).resolves.toEqual([
      { type: "text", text: "Bijan is " },
      { type: "error", message: "connection reset" },
    ]);
  });
});
