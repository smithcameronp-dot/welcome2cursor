"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  applyEvent,
  emptyAnswer,
  toHistory,
  type AssistantMessage,
  type Message,
} from "@/lib/messages";
import { SUGGESTED_QUESTIONS } from "@/lib/prompt";
import { createEventParser } from "@/lib/protocol";

import { Answer } from "./answer";
import { LiveSearchToggle } from "./live-search-toggle";

const MAX_TEXTAREA_HEIGHT = 200;

function nextId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // Fall through to the status-only message.
  }
  return `The server returned HTTP ${response.status}.`;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [liveSearch, setLiveSearch] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/chat")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { configured?: boolean } | null) => {
        if (active && body) setNeedsKey(body.configured === false);
      })
      .catch(() => {
        // A failed status probe should not block the UI.
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [draft]);

  const updateAnswer = useCallback(
    (id: string, update: (message: AssistantMessage) => AssistantMessage) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === id && message.role === "assistant"
            ? update(message)
            : message,
        ),
      );
    },
    [],
  );

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isStreaming) return;

      const answerId = nextId();
      const history = [
        ...toHistory(messages),
        { role: "user" as const, content: trimmed },
      ];

      setDraft("");
      setIsStreaming(true);
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "user", content: trimmed },
        emptyAnswer(answerId),
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, liveSearch }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const message = response.ok
            ? "The server sent an empty response."
            : await readError(response);
          updateAnswer(answerId, (answer) =>
            applyEvent(answer, { type: "error", message }),
          );
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const parse = createEventParser();

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const event of parse(decoder.decode(value, { stream: true }))) {
            updateAnswer(answerId, (answer) => applyEvent(answer, event));
          }
        }

        updateAnswer(answerId, (answer) => applyEvent(answer, { type: "done" }));
      } catch (error) {
        const aborted = error instanceof DOMException && error.name === "AbortError";
        updateAnswer(answerId, (answer) =>
          aborted
            ? applyEvent(answer, { type: "done" })
            : applyEvent(answer, {
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "The connection dropped mid-answer.",
              }),
        );
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [isStreaming, liveSearch, messages, updateAnswer],
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
      <header className="flex items-center justify-between gap-4 border-b border-turf-700 py-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-full bg-gradient-to-b from-pigskin to-[#8a4b06] text-lg shadow-lg shadow-black/40"
          >
            <span className="block h-4 w-0.5 rounded bg-chalk" />
          </span>
          <div>
            <h1 className="text-lg leading-tight font-semibold tracking-tight">
              Fantasy GM
            </h1>
            <p className="text-xs text-chalk-dim">
              Grok-powered start/sit, waivers, and trades
            </p>
          </div>
        </div>
        <LiveSearchToggle
          enabled={liveSearch}
          onChange={setLiveSearch}
          disabled={isStreaming}
        />
      </header>

      {needsKey ? (
        <p className="mt-4 rounded-lg border border-pigskin/40 bg-pigskin/10 px-3 py-2 text-sm text-pigskin">
          No xAI API key found. Add <code className="font-mono">XAI_API_KEY</code>{" "}
          to <code className="font-mono">.env.local</code> and restart the dev
          server.
        </p>
      ) : null}

      <div className="scrollbar-turf flex-1 overflow-y-auto py-6">
        {isEmpty ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                What are we deciding this week?
              </h2>
              <p className="mt-1 text-sm text-chalk-dim">
                Ask anything about your lineup. Live search pulls injury news and
                beat reports straight from X and the web.
              </p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => ask(question)}
                    className="h-full w-full rounded-xl border border-turf-700 bg-turf-800/70 p-3 text-left text-sm text-chalk/85 transition-colors hover:border-field hover:bg-turf-700 hover:text-chalk"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="space-y-6">
            {messages.map((message) => (
              <li key={message.id}>
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-field-deep px-4 py-2.5 text-[15px] whitespace-pre-wrap text-chalk">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  <Answer message={message} />
                )}
              </li>
            ))}
          </ol>
        )}
        <div ref={transcriptEndRef} />
      </div>

      <form
        className="sticky bottom-0 border-t border-turf-700 bg-turf-900/90 py-4 backdrop-blur"
        onSubmit={(event) => {
          event.preventDefault();
          ask(draft);
        }}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-turf-700 bg-turf-800 p-2 focus-within:border-field">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                ask(draft);
              }
            }}
            rows={1}
            placeholder="Start Bijan or Gibbs in a flex spot?"
            aria-label="Ask a fantasy football question"
            className="scrollbar-turf max-h-50 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] placeholder:text-chalk-dim/70 focus:outline-none"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="rounded-xl border border-turf-600 px-3 py-2 text-sm font-medium text-chalk-dim transition-colors hover:border-pigskin hover:text-pigskin"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-xl bg-field px-4 py-2 text-sm font-semibold text-turf-900 transition-colors hover:bg-field/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ask
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-chalk-dim/70">
          Grok can be wrong about snap counts and injury tags. Check the official
          report before kickoff.
        </p>
      </form>
    </div>
  );
}
