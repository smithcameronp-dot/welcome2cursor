/**
 * Wire types shared by the route handler and the browser. Deliberately free of
 * any xAI SDK import so the client bundle does not pull the SDK in.
 */

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type SearchSource = "web" | "x";

/**
 * Kept small on purpose so the UI never has to know xAI's event vocabulary.
 */
export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "searching"; source: SearchSource }
  | { type: "citation"; url: string; title?: string }
  | { type: "error"; message: string }
  | { type: "done" };

export function encodeEvent(event: StreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

/**
 * Newline-delimited JSON reader that tolerates events split across chunk
 * boundaries. Returns the events completed by this chunk.
 */
export function createEventParser(): (chunk: string) => StreamEvent[] {
  let buffer = "";

  return (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    const events: StreamEvent[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        events.push(JSON.parse(trimmed) as StreamEvent);
      } catch {
        // A malformed line should not kill an in-flight answer.
      }
    }
    return events;
  };
}
