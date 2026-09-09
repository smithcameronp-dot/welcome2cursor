import type { ChatMessage, SearchSource, StreamEvent } from "./protocol";

export type Citation = {
  url: string;
  title?: string;
};

export type UserMessage = {
  id: string;
  role: "user";
  content: string;
};

export type AssistantMessage = {
  id: string;
  role: "assistant";
  content: string;
  citations: Citation[];
  searched: SearchSource[];
  status: "streaming" | "done" | "error";
  error?: string;
};

export type Message = UserMessage | AssistantMessage;

export function emptyAnswer(id: string): AssistantMessage {
  return {
    id,
    role: "assistant",
    content: "",
    citations: [],
    searched: [],
    status: "streaming",
  };
}

export function applyEvent(
  message: AssistantMessage,
  event: StreamEvent,
): AssistantMessage {
  switch (event.type) {
    case "text":
      return { ...message, content: message.content + event.text };

    case "searching":
      return message.searched.includes(event.source)
        ? message
        : { ...message, searched: [...message.searched, event.source] };

    case "citation":
      return message.citations.some((citation) => citation.url === event.url)
        ? message
        : {
            ...message,
            citations: [
              ...message.citations,
              { url: event.url, title: event.title },
            ],
          };

    case "error":
      return { ...message, status: "error", error: event.message };

    case "done":
      // A mid-stream error is the more useful thing to keep showing.
      return message.status === "error" ? message : { ...message, status: "done" };
  }
}

/**
 * Turns rendered messages back into request history, dropping placeholders and
 * failed answers so a retry is not poisoned by an error turn.
 */
export function toHistory(messages: Message[]): ChatMessage[] {
  return messages
    .filter(
      (message) =>
        message.content.trim().length > 0 &&
        (message.role === "user" || message.status !== "error"),
    )
    .map(({ role, content }) => ({ role, content }));
}
