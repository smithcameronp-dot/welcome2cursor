import { describe, expect, it } from "vitest";

import {
  applyEvent,
  emptyAnswer,
  toHistory,
  type AssistantMessage,
  type Message,
} from "./messages";

function answer(overrides: Partial<AssistantMessage> = {}): AssistantMessage {
  return { ...emptyAnswer("a1"), ...overrides };
}

describe("applyEvent", () => {
  it("appends text deltas in order", () => {
    const streamed = [
      { type: "text", text: "Start " },
      { type: "text", text: "Gibbs." },
    ].reduce((message, event) => applyEvent(message, event as never), answer());

    expect(streamed.content).toBe("Start Gibbs.");
  });

  it("records each search source once", () => {
    let message = applyEvent(answer(), { type: "searching", source: "web" });
    message = applyEvent(message, { type: "searching", source: "x" });
    message = applyEvent(message, { type: "searching", source: "web" });

    expect(message.searched).toEqual(["web", "x"]);
  });

  it("dedupes citations by url and keeps the first title", () => {
    let message = applyEvent(answer(), {
      type: "citation",
      url: "https://example.com/a",
      title: "First",
    });
    message = applyEvent(message, {
      type: "citation",
      url: "https://example.com/a",
      title: "Second",
    });
    message = applyEvent(message, {
      type: "citation",
      url: "https://example.com/b",
    });

    expect(message.citations).toEqual([
      { url: "https://example.com/a", title: "First" },
      { url: "https://example.com/b", title: undefined },
    ]);
  });

  it("marks the answer done", () => {
    expect(applyEvent(answer(), { type: "done" }).status).toBe("done");
  });

  it("keeps an error visible when done arrives afterwards", () => {
    const failed = applyEvent(answer(), {
      type: "error",
      message: "xAI rate limited the request.",
    });

    expect(applyEvent(failed, { type: "done" })).toEqual(failed);
    expect(failed.status).toBe("error");
    expect(failed.error).toBe("xAI rate limited the request.");
  });

  it("preserves partial text alongside an error", () => {
    const partial = applyEvent(answer(), { type: "text", text: "Gibbs is " });
    const failed = applyEvent(partial, { type: "error", message: "dropped" });

    expect(failed.content).toBe("Gibbs is ");
    expect(failed.status).toBe("error");
  });
});

describe("toHistory", () => {
  const transcript: Message[] = [
    { id: "u1", role: "user", content: "Start Bijan or Gibbs?" },
    answer({ id: "a1", content: "Bijan.", status: "done" }),
    { id: "u2", role: "user", content: "What about in half PPR?" },
    answer({ id: "a2", content: "Partial", status: "error", error: "dropped" }),
    { id: "u3", role: "user", content: "Retry" },
    answer({ id: "a3", content: "", status: "streaming" }),
  ];

  it("keeps completed turns as role/content pairs", () => {
    expect(toHistory(transcript.slice(0, 3))).toEqual([
      { role: "user", content: "Start Bijan or Gibbs?" },
      { role: "assistant", content: "Bijan." },
      { role: "user", content: "What about in half PPR?" },
    ]);
  });

  it("drops failed answers and empty placeholders", () => {
    expect(toHistory(transcript)).toEqual([
      { role: "user", content: "Start Bijan or Gibbs?" },
      { role: "assistant", content: "Bijan." },
      { role: "user", content: "What about in half PPR?" },
      { role: "user", content: "Retry" },
    ]);
  });
});
