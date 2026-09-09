// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { encodeEvent, type StreamEvent } from "@/lib/protocol";
import { SUGGESTED_QUESTIONS } from "@/lib/prompt";

import { Chat } from "./chat";

const ANSWER: StreamEvent[] = [
  { type: "searching", source: "x" },
  { type: "text", text: "Start **Gibbs**." },
  { type: "citation", url: "https://www.example.com/snaps", title: "Snaps" },
  { type: "done" },
];

type FetchMock = ReturnType<typeof vi.fn>;

function ndjsonResponse(events: StreamEvent[], chunkSize = 1024): Response {
  const encoder = new TextEncoder();
  const payload = events.map(encodeEvent).join("");
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < payload.length; i += chunkSize) {
          controller.enqueue(encoder.encode(payload.slice(i, i + chunkSize)));
        }
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "application/x-ndjson" } },
  );
}

function stubFetch({
  configured = true,
  post = () => ndjsonResponse(ANSWER),
}: {
  configured?: boolean;
  post?: () => Response;
} = {}): FetchMock {
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
    init?.method === "POST"
      ? post()
      : Response.json({ configured, model: "grok-4.6" }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function postBody(fetchMock: FetchMock) {
  const call = fetchMock.mock.calls.find(
    ([, init]) => (init as RequestInit | undefined)?.method === "POST",
  );
  return JSON.parse(String((call?.[1] as RequestInit).body));
}

beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Chat", () => {
  it("offers suggested questions before the first ask", () => {
    stubFetch();
    render(<Chat />);

    for (const question of SUGGESTED_QUESTIONS) {
      expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
    }
  });

  it("asks a suggested question and renders the streamed answer", async () => {
    const fetchMock = stubFetch();
    render(<Chat />);

    await userEvent.click(
      screen.getByRole("button", { name: SUGGESTED_QUESTIONS[0] }),
    );

    expect(await screen.findByText("Gibbs", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(SUGGESTED_QUESTIONS[0])).toBeInTheDocument();
    // Markdown is rendered, not shown as literal asterisks.
    expect(screen.getByText("Gibbs").tagName).toBe("STRONG");
    expect(postBody(fetchMock).messages).toEqual([
      { role: "user", content: SUGGESTED_QUESTIONS[0] },
    ]);
  });

  it("links citations by hostname", async () => {
    stubFetch();
    render(<Chat />);

    await userEvent.click(
      screen.getByRole("button", { name: SUGGESTED_QUESTIONS[0] }),
    );

    const link = await screen.findByRole("link", { name: /example\.com/ });
    expect(link).toHaveAttribute("href", "https://www.example.com/snaps");
  });

  it("types a question and includes prior turns as history", async () => {
    const fetchMock = stubFetch();
    render(<Chat />);

    const input = screen.getByRole("textbox", {
      name: "Ask a fantasy football question",
    });

    await userEvent.type(input, "Start Bijan or Gibbs?{Enter}");
    await screen.findByText("Gibbs", { selector: "strong" });

    await userEvent.type(input, "What about half PPR?{Enter}");

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(
          ([, init]) => (init as RequestInit | undefined)?.method === "POST",
        ),
      ).toHaveLength(2),
    );
    const lastPost = fetchMock.mock.calls
      .filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")
      .at(-1);
    expect(JSON.parse(String((lastPost?.[1] as RequestInit).body)).messages).toEqual(
      [
        { role: "user", content: "Start Bijan or Gibbs?" },
        { role: "assistant", content: "Start **Gibbs**." },
        { role: "user", content: "What about half PPR?" },
      ],
    );
  });

  it("sends liveSearch on by default and off once toggled", async () => {
    const fetchMock = stubFetch();
    render(<Chat />);

    const toggle = screen.getByRole("switch", { name: "Live search" });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Model knowledge only")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: SUGGESTED_QUESTIONS[0] }),
    );

    await waitFor(() => expect(postBody(fetchMock).liveSearch).toBe(false));
  });

  it("shows which sources are being searched while streaming", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const encoder = new TextEncoder();

    stubFetch({
      post: () =>
        new Response(
          new ReadableStream<Uint8Array>({
            async start(controller) {
              controller.enqueue(
                encoder.encode(encodeEvent({ type: "searching", source: "x" })),
              );
              await gate;
              controller.enqueue(
                encoder.encode(encodeEvent({ type: "text", text: "Done." })),
              );
              controller.close();
            },
          }),
          { status: 200 },
        ),
    });
    render(<Chat />);

    await userEvent.click(
      screen.getByRole("button", { name: SUGGESTED_QUESTIONS[0] }),
    );

    expect(await screen.findByText(/Searching X for the latest/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();

    release();

    expect(await screen.findByText("Done.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Stop" })).toBeNull(),
    );
  });

  it("surfaces a rejected request as an error on the answer", async () => {
    stubFetch({
      post: () =>
        Response.json({ error: "xAI rejected the API key." }, { status: 401 }),
    });
    render(<Chat />);

    await userEvent.click(
      screen.getByRole("button", { name: SUGGESTED_QUESTIONS[0] }),
    );

    expect(
      await screen.findByText("xAI rejected the API key."),
    ).toBeInTheDocument();
  });

  it("warns when the server has no API key configured", async () => {
    stubFetch({ configured: false });
    render(<Chat />);

    expect(await screen.findByText(/No xAI API key found/)).toBeInTheDocument();
  });

  it("does not warn when a key is configured", async () => {
    stubFetch();
    render(<Chat />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText(/No xAI API key found/)).toBeNull();
  });
});
