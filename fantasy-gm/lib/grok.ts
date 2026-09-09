import OpenAI from "openai";

import { LIVE_SEARCH_PROMPT, SYSTEM_PROMPT } from "./prompt";
import type { ChatMessage, SearchSource, StreamEvent } from "./protocol";

export const XAI_BASE_URL = "https://api.x.ai/v1";
export const DEFAULT_MODEL = "grok-4.6";

export type AnswerRequest = {
  messages: ChatMessage[];
  liveSearch: boolean;
  model?: string;
};

export function resolveModel(model?: string): string {
  return model || process.env.GROK_MODEL || DEFAULT_MODEL;
}

export function systemPrompt(liveSearch: boolean): string {
  return liveSearch ? `${SYSTEM_PROMPT}\n\n${LIVE_SEARCH_PROMPT}` : SYSTEM_PROMPT;
}

/**
 * xAI retired Live Search's `search_parameters` on Chat Completions, so
 * real-time answers come from the Responses API's agentic search tools.
 *
 * The system prompt rides in `input` as a message rather than the Responses
 * API's top-level `instructions` field, which xAI does not document.
 */
export function buildRequest({ messages, liveSearch, model }: AnswerRequest) {
  return {
    model: resolveModel(model),
    input: [
      { role: "system" as const, content: systemPrompt(liveSearch) },
      ...messages.map(({ role, content }) => ({ role, content })),
    ],
    stream: true as const,
    store: false,
    ...(liveSearch
      ? { tools: [{ type: "web_search" }, { type: "x_search" }] }
      : {}),
  };
}

type RawAnnotation = {
  type?: string;
  url?: string;
  title?: string;
};

type RawContentPart = {
  annotations?: RawAnnotation[];
};

type RawStreamEvent = {
  type?: string;
  delta?: unknown;
  annotation?: RawAnnotation;
  item?: { type?: string };
  message?: string;
  response?: {
    error?: { message?: string } | null;
    incomplete_details?: { reason?: string } | null;
    output?: { content?: RawContentPart[] }[];
  };
};

function searchSource(itemType: string): SearchSource | null {
  if (itemType.startsWith("x_search")) return "x";
  if (itemType.startsWith("web_search")) return "web";
  return null;
}

function toCitation(annotation: RawAnnotation | undefined): StreamEvent | null {
  if (!annotation || annotation.type !== "url_citation" || !annotation.url) {
    return null;
  }
  return { type: "citation", url: annotation.url, title: annotation.title };
}

/**
 * Translates one xAI stream event into zero or more UI events. Unrecognized
 * event types map to nothing, so new xAI event kinds are ignored rather than
 * breaking the stream.
 */
export function toStreamEvents(raw: RawStreamEvent): StreamEvent[] {
  switch (raw.type) {
    case "response.output_text.delta":
      return typeof raw.delta === "string" && raw.delta.length > 0
        ? [{ type: "text", text: raw.delta }]
        : [];

    case "response.output_text.annotation.added": {
      const citation = toCitation(raw.annotation);
      return citation ? [citation] : [];
    }

    case "response.output_item.added": {
      const source = searchSource(raw.item?.type ?? "");
      return source ? [{ type: "searching", source }] : [];
    }

    case "response.web_search_call.in_progress":
    case "response.web_search_call.searching":
      return [{ type: "searching", source: "web" }];

    case "response.completed": {
      // Some responses only carry citations on the final payload, so harvest
      // them here too; the UI dedupes by URL.
      const citations = (raw.response?.output ?? [])
        .flatMap((item) => item.content ?? [])
        .flatMap((part) => part.annotations ?? [])
        .map(toCitation)
        .filter((event): event is StreamEvent => event !== null);
      return [...citations, { type: "done" }];
    }

    case "response.failed":
    case "response.incomplete":
      return [
        {
          type: "error",
          message:
            raw.response?.error?.message ||
            raw.response?.incomplete_details?.reason ||
            "Grok stopped before finishing the answer.",
        },
      ];

    case "error":
    case "response.error":
      return [
        { type: "error", message: raw.message || "Grok returned an error." },
      ];

    default:
      return [];
  }
}

export function isConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY);
}

export function createClient(): OpenAI {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "XAI_API_KEY is not set. Copy .env.example to .env.local and add your xAI API key from https://console.x.ai.",
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.XAI_BASE_URL || XAI_BASE_URL,
    maxRetries: 2,
  });
}

export async function* streamAnswer(
  request: AnswerRequest,
  client: OpenAI = createClient(),
): AsyncGenerator<StreamEvent> {
  // `x_search` is xAI-only and absent from the OpenAI SDK's tool union.
  const params = buildRequest(request) as Parameters<
    typeof client.responses.create
  >[0];
  const stream = (await client.responses.create(
    params,
  )) as unknown as AsyncIterable<RawStreamEvent>;

  for await (const raw of stream) {
    for (const event of toStreamEvents(raw)) {
      yield event;
    }
  }
}

export function describeError(error: unknown): string {
  if (error instanceof OpenAI.APIConnectionError) {
    return "Could not reach api.x.ai. Check your network connection and any egress restrictions.";
  }
  if (error instanceof OpenAI.APIError) {
    switch (error.status) {
      case 401:
      case 403:
        return "xAI rejected the API key. Confirm XAI_API_KEY is valid and has credits.";
      case 404:
      case 410:
        return `xAI does not recognize model "${resolveModel()}". Set GROK_MODEL to a current model ID from the xAI docs.`;
      case 429:
        return "xAI rate limited the request. Wait a moment and ask again.";
      default:
        return error.message || `xAI returned HTTP ${error.status}.`;
    }
  }
  return error instanceof Error
    ? error.message
    : "Something went wrong talking to Grok.";
}
