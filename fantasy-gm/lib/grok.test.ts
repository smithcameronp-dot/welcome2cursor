import OpenAI from "openai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_MODEL,
  XAI_BASE_URL,
  buildRequest,
  describeError,
  isConfigured,
  resolveModel,
  streamAnswer,
  toStreamEvents,
} from "./grok";
import { LIVE_SEARCH_PROMPT, SYSTEM_PROMPT } from "./prompt";
import type { StreamEvent } from "./protocol";

const QUESTION = { role: "user" as const, content: "Start Bijan or Gibbs?" };

describe("buildRequest", () => {
  it("puts the system prompt first and keeps message order", () => {
    const request = buildRequest({
      messages: [
        QUESTION,
        { role: "assistant", content: "Bijan." },
        { role: "user", content: "Half PPR?" },
      ],
      liveSearch: false,
    });

    expect(request.input).toEqual([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: "Start Bijan or Gibbs?" },
      { role: "assistant", content: "Bijan." },
      { role: "user", content: "Half PPR?" },
    ]);
  });

  it("omits tools entirely when live search is off", () => {
    const request = buildRequest({ messages: [QUESTION], liveSearch: false });

    expect(request).not.toHaveProperty("tools");
    expect(request.input[0].content).not.toContain(LIVE_SEARCH_PROMPT);
  });

  it("requests web and X search when live search is on", () => {
    const request = buildRequest({ messages: [QUESTION], liveSearch: true });

    expect(request.tools).toEqual([{ type: "web_search" }, { type: "x_search" }]);
    expect(request.input[0].content).toContain(LIVE_SEARCH_PROMPT);
  });

  it("streams and opts out of server-side retention", () => {
    const request = buildRequest({ messages: [QUESTION], liveSearch: false });

    expect(request.stream).toBe(true);
    expect(request.store).toBe(false);
  });

  it("prefers an explicit model over the environment default", () => {
    expect(
      buildRequest({ messages: [QUESTION], liveSearch: false, model: "grok-4.5" })
        .model,
    ).toBe("grok-4.5");
  });
});

describe("resolveModel", () => {
  const original = process.env.GROK_MODEL;

  afterEach(() => {
    if (original === undefined) delete process.env.GROK_MODEL;
    else process.env.GROK_MODEL = original;
  });

  it("falls back to the default model", () => {
    delete process.env.GROK_MODEL;
    expect(resolveModel()).toBe(DEFAULT_MODEL);
  });

  it("reads GROK_MODEL from the environment", () => {
    process.env.GROK_MODEL = "grok-4.3";
    expect(resolveModel()).toBe("grok-4.3");
  });
});

describe("isConfigured", () => {
  const original = process.env.XAI_API_KEY;

  afterEach(() => {
    if (original === undefined) delete process.env.XAI_API_KEY;
    else process.env.XAI_API_KEY = original;
  });

  it("is false without a key and true with one", () => {
    delete process.env.XAI_API_KEY;
    expect(isConfigured()).toBe(false);

    process.env.XAI_API_KEY = "xai-test";
    expect(isConfigured()).toBe(true);
  });
});

describe("toStreamEvents", () => {
  it("maps text deltas", () => {
    expect(
      toStreamEvents({ type: "response.output_text.delta", delta: "Start " }),
    ).toEqual([{ type: "text", text: "Start " }]);
  });

  it("ignores empty and non-string deltas", () => {
    expect(toStreamEvents({ type: "response.output_text.delta", delta: "" })).toEqual(
      [],
    );
    expect(
      toStreamEvents({ type: "response.output_text.delta", delta: { a: 1 } }),
    ).toEqual([]);
  });

  it("maps url citations and skips other annotation types", () => {
    expect(
      toStreamEvents({
        type: "response.output_text.annotation.added",
        annotation: {
          type: "url_citation",
          url: "https://example.com/report",
          title: "Beat report",
        },
      }),
    ).toEqual([
      {
        type: "citation",
        url: "https://example.com/report",
        title: "Beat report",
      },
    ]);

    expect(
      toStreamEvents({
        type: "response.output_text.annotation.added",
        annotation: { type: "file_citation" },
      }),
    ).toEqual([]);
  });

  it("distinguishes web and X search calls", () => {
    expect(
      toStreamEvents({
        type: "response.output_item.added",
        item: { type: "web_search_call" },
      }),
    ).toEqual([{ type: "searching", source: "web" }]);

    expect(
      toStreamEvents({
        type: "response.output_item.added",
        item: { type: "x_search_call" },
      }),
    ).toEqual([{ type: "searching", source: "x" }]);

    expect(
      toStreamEvents({
        type: "response.output_item.added",
        item: { type: "message" },
      }),
    ).toEqual([]);
  });

  it("maps the dedicated web search progress events", () => {
    expect(toStreamEvents({ type: "response.web_search_call.searching" })).toEqual([
      { type: "searching", source: "web" },
    ]);
  });

  it("harvests citations off the completed response before finishing", () => {
    expect(
      toStreamEvents({
        type: "response.completed",
        response: {
          output: [
            {
              content: [
                {
                  annotations: [
                    { type: "url_citation", url: "https://example.com/a" },
                    { type: "file_citation" },
                    {
                      type: "url_citation",
                      url: "https://example.com/b",
                      title: "B",
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    ).toEqual([
      { type: "citation", url: "https://example.com/a", title: undefined },
      { type: "citation", url: "https://example.com/b", title: "B" },
      { type: "done" },
    ]);
  });

  it("finishes cleanly when the completed response carries no output", () => {
    expect(toStreamEvents({ type: "response.completed" })).toEqual([
      { type: "done" },
    ]);
  });

  it("surfaces failure reasons, with a fallback message", () => {
    expect(
      toStreamEvents({
        type: "response.failed",
        response: { error: { message: "context length exceeded" } },
      }),
    ).toEqual([{ type: "error", message: "context length exceeded" }]);

    expect(
      toStreamEvents({
        type: "response.incomplete",
        response: { incomplete_details: { reason: "max_output_tokens" } },
      }),
    ).toEqual([{ type: "error", message: "max_output_tokens" }]);

    expect(toStreamEvents({ type: "response.failed" })).toEqual([
      { type: "error", message: "Grok stopped before finishing the answer." },
    ]);
  });

  it("surfaces standalone error events", () => {
    expect(toStreamEvents({ type: "error", message: "bad tool" })).toEqual([
      { type: "error", message: "bad tool" },
    ]);
  });

  it("ignores event types it does not recognize", () => {
    expect(toStreamEvents({ type: "response.reasoning_text.delta" })).toEqual([]);
    expect(toStreamEvents({})).toEqual([]);
  });
});

function sse(payload: Record<string, unknown>): string {
  return `event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "text/event-stream" } },
  );
}

describe("streamAnswer", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  function clientWith(response: () => Response) {
    fetchMock = vi.fn(async () => response());
    return new OpenAI({
      apiKey: "xai-test",
      baseURL: XAI_BASE_URL,
      maxRetries: 0,
      fetch: fetchMock as unknown as NonNullable<
        ConstructorParameters<typeof OpenAI>[0]
      >["fetch"],
    });
  }

  async function collect(
    client: OpenAI,
    liveSearch: boolean,
  ): Promise<StreamEvent[]> {
    const events: StreamEvent[] = [];
    for await (const event of streamAnswer(
      { messages: [QUESTION], liveSearch },
      client,
    )) {
      events.push(event);
    }
    return events;
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the built request to the xAI Responses endpoint", async () => {
    const client = clientWith(() =>
      streamResponse([sse({ type: "response.completed" }), "data: [DONE]\n\n"]),
    );

    await collect(client, true);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe(`${XAI_BASE_URL}/responses`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({
      stream: true,
      store: false,
      tools: [{ type: "web_search" }, { type: "x_search" }],
    });
  });

  it("decodes a live-search answer into UI events", async () => {
    const client = clientWith(() =>
      streamResponse([
        sse({ type: "response.created" }),
        sse({
          type: "response.output_item.added",
          item: { type: "x_search_call" },
        }),
        sse({ type: "response.output_text.delta", delta: "Start " }),
        sse({ type: "response.output_text.delta", delta: "Gibbs." }),
        sse({
          type: "response.output_text.annotation.added",
          annotation: {
            type: "url_citation",
            url: "https://example.com/snaps",
            title: "Snap counts",
          },
        }),
        sse({ type: "response.completed" }),
        "data: [DONE]\n\n",
      ]),
    );

    expect(await collect(client, true)).toEqual([
      { type: "searching", source: "x" },
      { type: "text", text: "Start " },
      { type: "text", text: "Gibbs." },
      {
        type: "citation",
        url: "https://example.com/snaps",
        title: "Snap counts",
      },
      { type: "done" },
    ]);
  });

  it("handles events delivered across split chunks", async () => {
    const full = sse({ type: "response.output_text.delta", delta: "Bijan" });
    const client = clientWith(() =>
      streamResponse([
        full.slice(0, 20),
        full.slice(20),
        sse({ type: "response.completed" }),
      ]),
    );

    expect(await collect(client, false)).toEqual([
      { type: "text", text: "Bijan" },
      { type: "done" },
    ]);
  });

  it("throws an APIError when xAI rejects the key", async () => {
    const client = clientWith(
      () =>
        new Response(JSON.stringify({ error: { message: "invalid api key" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
    );

    await expect(collect(client, false)).rejects.toBeInstanceOf(OpenAI.APIError);
  });
});

describe("describeError", () => {
  function apiError(status: number, message = "boom") {
    return new OpenAI.APIError(status, { message }, message, new Headers());
  }

  it("explains an unreachable endpoint", () => {
    expect(
      describeError(new OpenAI.APIConnectionError({ message: "fetch failed" })),
    ).toContain("Could not reach api.x.ai");
  });

  it("explains a rejected key", () => {
    expect(describeError(apiError(401))).toContain("rejected the API key");
    expect(describeError(apiError(403))).toContain("rejected the API key");
  });

  it("points a retired model at the model list", () => {
    expect(describeError(apiError(410))).toContain("GROK_MODEL");
    expect(describeError(apiError(404))).toContain("GROK_MODEL");
  });

  it("explains rate limiting", () => {
    expect(describeError(apiError(429))).toContain("rate limited");
  });

  it("passes through other API messages", () => {
    expect(describeError(apiError(500, "upstream exploded"))).toContain(
      "upstream exploded",
    );
  });

  it("handles plain errors and non-errors", () => {
    expect(describeError(new Error("socket hang up"))).toBe("socket hang up");
    expect(describeError("nope")).toBe("Something went wrong talking to Grok.");
  });
});
