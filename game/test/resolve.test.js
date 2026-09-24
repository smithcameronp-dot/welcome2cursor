import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { teams } from "../data/teams.js";
import {
  applyBaserunners,
  applyOutcome,
  averagePolicy,
  blankOuting,
  hitBucket,
  mulberry32,
  plateAppearance,
  sharpPolicy,
  shouldHook,
  simulateOuting,
  wildPolicy,
} from "../src/resolve.js";

describe("count and baserunners", () => {
  it("walks on ball four and strikeouts on strike three", () => {
    let state = blankOuting({ balls: 3 });
    state = applyOutcome(state, "ball");
    assert.equal(state.walks, 1);
    assert.equal(state.balls, 0);
    assert.equal(state.runners, 1);

    state = blankOuting({ strikes: 2 });
    state = applyOutcome(state, "called-strike");
    assert.equal(state.outs, 1);
    assert.equal(state.strikes, 0);
  });

  it("does not add a strike on a two-strike foul", () => {
    const held = applyOutcome(blankOuting({ strikes: 2 }), "foul");
    assert.equal(held.strikes, 2);
    const moved = applyOutcome(blankOuting({ strikes: 1 }), "foul");
    assert.equal(moved.strikes, 2);
  });

  it("scores runners without a baserunning minigame", () => {
    assert.deepEqual(applyBaserunners(0, "single"), { runners: 1, runs: 0 });
    assert.deepEqual(applyBaserunners(3, "single"), { runners: 3, runs: 1 });
    assert.deepEqual(applyBaserunners(2, "hard"), { runners: 1, runs: 2 });
    assert.deepEqual(applyBaserunners(2, "hr"), { runners: 0, runs: 3 });
  });

  it("clears the bases after the third out", () => {
    const state = applyOutcome(blankOuting({ outs: 2, runners: 2 }), "groundout");
    assert.equal(state.outs, 3);
    assert.equal(state.runners, 0);
  });
});

describe("perfect game and the hook", () => {
  it("a walk spoils a game that never allowed a hit", () => {
    let state = blankOuting({ outs: 25, hits: 0, walks: 0, hbp: 0 });
    state = applyOutcome(state, "walk");
    state = applyOutcome(state, "strikeout");
    state = applyOutcome(state, "flyout");
    assert.equal(state.outs, 27);
    assert.equal(state.hits, 0);
    assert.equal(state.finished, true);
    assert.equal(state.perfect, false);
  });

  it("twenty-seven outs with a clean sheet is a perfect game", () => {
    const state = applyOutcome(blankOuting({ outs: 26, hits: 0, walks: 0, hbp: 0 }), "strikeout");
    assert.equal(state.perfect, true);
    assert.equal(state.hooked, false);
  });

  it("ten hits and six runs do not bring the manager out", () => {
    assert.equal(shouldHook(10, 6), false);
    const state = applyOutcome(blankOuting({ hits: 10, runs: 6, outs: 5 }), "groundout");
    assert.equal(state.hooked, false);
    assert.equal(state.outs, 6);
    assert.equal(state.finished, false);
  });

  it("the eleventh hit or the seventh run ends the outing", () => {
    assert.equal(shouldHook(11, 6), true);
    assert.equal(shouldHook(8, 7), true);

    const onHits = applyOutcome(blankOuting({ hits: 10, runs: 2, runners: 0 }), "single");
    assert.equal(onHits.hits, 11);
    assert.equal(onHits.hooked, true);

    const onRuns = applyOutcome(blankOuting({ hits: 4, runs: 6, runners: 3, outs: 3 }), "single");
    assert.equal(onRuns.runs, 7);
    assert.equal(onRuns.hits, 5);
    assert.equal(onRuns.hooked, true);
  });
});

describe("who hits the ball", () => {
  const hanger = { type: "fastball", location: { x: 0, y: 0.1 }, error: 0.9, late: true };

  it("the cleanup hitter punishes a hanger more often than the 9-hole", () => {
    const lineup = teams[0].lineup;
    let cleanup = 0;
    let last = 0;
    const n = 400;
    for (let i = 0; i < n; i += 1) {
      if (plateAppearance(lineup[3], hanger, 3000 + i).state.hits) cleanup += 1;
      if (plateAppearance(lineup[8], hanger, 3000 + i).state.hits) last += 1;
    }
    assert.ok(cleanup > last + 40, `cleanup ${cleanup} vs 9-hole ${last}`);
  });

  it("missing the dial raises the chance of a hit", () => {
    const batter = teams[0].lineup[3];
    const aimed = { type: "fastball", location: { x: 0.7, y: -0.4 } };
    let executed = 0;
    let missed = 0;
    const n = 400;
    for (let i = 0; i < n; i += 1) {
      if (plateAppearance(batter, { ...aimed, error: 0, late: false }, 9000 + i).state.hits) {
        executed += 1;
      }
      if (plateAppearance(batter, { ...aimed, error: 1, late: true }, 9000 + i).state.hits) {
        missed += 1;
      }
    }
    assert.ok(missed > executed + 40, `missed ${missed} vs executed ${executed}`);
  });
});

describe("published odds at average execution", () => {
  it("lands near 2 / 20 / 33 / 45, and execution moves the outing", () => {
    const n = 3000;
    const tally = (policy, games) => {
      const counts = { perfect: 0, "1-5": 0, "6-10": 0, "11+": 0, other: 0, hooked: 0 };
      for (let i = 0; i < games; i += 1) {
        const state = simulateOuting(teams[i % teams.length], mulberry32(100 + i * 17), policy);
        counts[hitBucket(state)] += 1;
        if (state.hooked) counts.hooked += 1;
      }
      return counts;
    };

    const average = tally(averagePolicy, n);
    const pct = (count) => (100 * count) / n;
    assert.ok(Math.abs(pct(average.perfect) - 2) <= 4, `perfect ${pct(average.perfect)}`);
    assert.ok(Math.abs(pct(average["1-5"]) - 20) <= 4, `1-5 ${pct(average["1-5"])}`);
    assert.ok(Math.abs(pct(average["6-10"]) - 33) <= 4, `6-10 ${pct(average["6-10"])}`);
    assert.ok(Math.abs(pct(average["11+"]) - 45) <= 4, `11+ ${pct(average["11+"])}`);

    const sharp = tally(sharpPolicy, 800);
    const wild = tally(wildPolicy, 400);
    assert.ok(sharp.perfect / 800 > average.perfect / n);
    assert.ok(sharp.hooked / 800 < 0.05);
    assert.ok(wild.hooked / 400 > average.hooked / n);
  });
});
