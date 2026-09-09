"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { AssistantMessage } from "@/lib/messages";

const SOURCE_LABEL = {
  web: "the web",
  x: "X",
} as const;

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function SearchIndicator({ sources }: { sources: AssistantMessage["searched"] }) {
  const label = sources.map((source) => SOURCE_LABEL[source]).join(" and ");
  return (
    <p className="flex items-center gap-2 text-xs text-chalk-dim">
      <span className="size-1.5 animate-pulse rounded-full bg-pigskin" />
      Searching {label} for the latest
    </p>
  );
}

export function Answer({ message }: { message: AssistantMessage }) {
  const showSearchIndicator =
    message.status === "streaming" && message.searched.length > 0;

  return (
    <div className="space-y-3">
      {showSearchIndicator ? <SearchIndicator sources={message.searched} /> : null}

      {message.content ? (
        <div className="answer-prose text-[15px] leading-relaxed text-chalk/90">
          <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
        </div>
      ) : null}

      {message.status === "streaming" && !message.content && !showSearchIndicator ? (
        <p className="flex items-center gap-2 text-sm text-chalk-dim">
          <span className="size-1.5 animate-pulse rounded-full bg-field" />
          Reading the matchup
        </p>
      ) : null}

      {message.status === "error" ? (
        <p className="rounded-lg border border-pigskin/40 bg-pigskin/10 px-3 py-2 text-sm text-pigskin">
          {message.error}
        </p>
      ) : null}

      {message.citations.length > 0 ? (
        <ul className="flex flex-wrap gap-2 pt-1">
          {message.citations.map((citation, index) => (
            <li key={citation.url}>
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer noopener"
                title={citation.title ?? citation.url}
                className="flex items-center gap-1.5 rounded-full border border-turf-600 bg-turf-800 px-2.5 py-1 text-xs text-chalk-dim transition-colors hover:border-field hover:text-chalk"
              >
                <span className="font-mono text-[10px] text-field">
                  {index + 1}
                </span>
                {hostname(citation.url)}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
