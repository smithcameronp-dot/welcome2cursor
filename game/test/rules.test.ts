import { describe, expect, it } from "vitest";
import {
  applyBaserunners,
  applyOutcome,
  blankState,
  formatInnings,
  inningOf,
  statusOf,
} from "../src/game/rules";

describe("count and innings", () => {
  it("walks on ball four and strikeouts on strike three", () => {
    let state = applyOutcome(blankState({ balls: 3 }), "ball");
    expect(state.walks).toBe(1);
    expect(state.balls).toBe(0);
    expect(state.runners).toBe(1);
    expect(state.status).toBe("no-hitter");

    state = applyOutcome(blankState({ strikes: 2 }), "called-strike");
    expect(state.outs).toBe(1);
    expect(state.strikeouts).toBe(1);
    expect(state.strikes).toBe(0);
  });

  it("does not add a strike on a two-strike foul", () => {
    expect(applyOutcome(blankState({ strikes: 2 }), "foul").strikes).toBe(2);
    expect(applyOutcome(blankState({ strikes: 1 }), "foul").strikes).toBe(2);
  });

  it("scores runners without a fielding minigame", () => {
    expect(applyBaserunners(0, "single")).toEqual({ runners: 1, runs: 0 });
    expect(applyBaserunners(3, "single")).toEqual({ runners: 3, runs: 1 });
    expect(applyBaserunners(2, "hard")).toEqual({ runners: 1, runs: 2 });
    expect(applyBaserunners(2, "hr")).toEqual({ runners: 0, runs: 3 });
  });

  it("clears the bases after the third out", () => {
    const state = applyOutcome(blankState({ outs: 2, runners: 2 }), "groundout");
    expect(state.outs).toBe(3);
    expect(state.runners).toBe(0);
    expect(inningOf(state.outs)).toBe(2);
    expect(formatInnings(state.outs)).toBe("1.0");
  });

  it("keeps pitching through 11 hits — there is no hook", () => {
    const state = applyOutcome(blankState({ hits: 10, runs: 6, outs: 5 }), "single");
    expect(state.hits).toBe(11);
    expect(state.finished).toBe(false);
    expect(state.status).toBe("game");
  });

  it("a walk spoils a perfect game but can still be a no-hitter", () => {
    let state = applyOutcome(blankState({ outs: 24, hits: 0, walks: 0 }), "walk");
    expect(statusOf(state)).toBe("no-hitter");
    state = applyOutcome(state, "strikeout");
    state = applyOutcome(state, "strikeout");
    state = applyOutcome(state, "strikeout");
    expect(state.outs).toBe(27);
    expect(state.finished).toBe(true);
    expect(state.result).toBe("no-hitter");
  });

  it("twenty-seven outs with a clean sheet is a perfect game", () => {
    const state = applyOutcome(blankState({ outs: 26, hits: 0, walks: 0, hbp: 0 }), "strikeout");
    expect(state.finished).toBe(true);
    expect(state.result).toBe("perfect");
    expect(state.status).toBe("perfect");
  });

  it("a hit in the 9th does not end the game; the 27th out does", () => {
    let state = applyOutcome(blankState({ outs: 26, hits: 0, walks: 1 }), "single");
    expect(state.finished).toBe(false);
    expect(state.status).toBe("game");
    state = applyOutcome(state, "flyout");
    expect(state.finished).toBe(true);
    expect(state.result).toBe("complete");
  });
});
