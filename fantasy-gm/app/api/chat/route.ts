import type { NextRequest } from "next/server";

import {
  describeError,
  isConfigured,
  resolveModel,
  streamAnswer,
} from "@/lib/grok";
import { type ChatMessage, encodeEvent } from "@/lib/protocol";

const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 8000;

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return null;
  }

  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (
      typeof content !== "string" ||
      content.trim().length === 0 ||
      content.length > MAX_MESSAGE_CHARS
    ) {
      return null;
    }
    messages.push({ role, content });
  }
  return messages;
}

export async function GET() {
  return Response.json({ configured: isConfigured(), model: resolveModel() });
}

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return Response.json(
      {
        error:
          "XAI_API_KEY is not set. Copy .env.example to .env.local and add your xAI API key.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be JSON.");
  }

  const { messages: rawMessages, liveSearch } = (body ?? {}) as Record<
    string,
    unknown
  >;

  const messages = parseMessages(rawMessages);
  if (!messages) {
    return badRequest(
      `messages must be 1-${MAX_MESSAGES} objects with role "user" or "assistant" and non-empty content under ${MAX_MESSAGE_CHARS} characters.`,
    );
  }
  if (typeof liveSearch !== "boolean") {
    return badRequest("liveSearch must be a boolean.");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of streamAnswer({ messages, liveSearch })) {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            encodeEvent({ type: "error", message: describeError(error) }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Long-lived streams get buffered by some reverse proxies without this.
      "X-Accel-Buffering": "no",
    },
  });
}
