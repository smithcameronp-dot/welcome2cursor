import { describe, expect, it } from "vitest";

import { createEventParser, encodeEvent, type StreamEvent } from "./protocol";

describe("encodeEvent", () => {
  it("writes one newline-terminated JSON line", () => {
    expect(encodeEvent({ type: "text", text: "Start Bijan" })).toBe(
      '{"type":"text","text":"Start Bijan"}\n',
    );
  });

  it("round-trips through the parser", () => {
    const events: StreamEvent[] = [
      { type: "searching", source: "x" },
      { type: "text", text: "Gibbs is the flex play." },
      { type: "citation", url: "https://example.com/a", title: "Beat report" },
      { type: "done" },
    ];
    const parse = createEventParser();

    expect(parse(events.map(encodeEvent).join(""))).toEqual(events);
  });
});

describe("createEventParser", () => {
  it("buffers events split across chunk boundaries", () => {
    const parse = createEventParser();

    expect(parse('{"type":"text","te')).toEqual([]);
    expect(parse('xt":"Start "}\n{"type":"text","text":"Bijan"}')).toEqual([
      { type: "text", text: "Start " },
    ]);
    expect(parse("\n")).toEqual([{ type: "text", text: "Bijan" }]);
  });

  it("keeps separate parsers independent", () => {
    const first = createEventParser();
    const second = createEventParser();

    first('{"type":"text","text":"a');
    expect(second('{"type":"done"}\n')).toEqual([{ type: "done" }]);
    expect(first('"}\n')).toEqual([{ type: "text", text: "a" }]);
  });

  it("skips blank lines and malformed JSON without dropping later events", () => {
    const parse = createEventParser();

    expect(parse('\n\nnot json\n{"type":"done"}\n')).toEqual([{ type: "done" }]);
  });

  it("ignores a trailing partial line until it is terminated", () => {
    const parse = createEventParser();

    expect(parse('{"type":"done"}')).toEqual([]);
  });
});
