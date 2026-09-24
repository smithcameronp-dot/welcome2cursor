import { describe, expect, it } from "vitest";
import { teams } from "../src/data/teams";
import { decidePitch } from "../src/game/batter";
import { blankState } from "../src/game/rules";
import { mulberry32 } from "../src/game/rng";
import type { Trajectory } from "../src/game/types";

function traj(partial: Partial<Trajectory>): Trajectory {
  return {
    samples: [],
    plate: { x: 0, y: 0.78 },
    flightSeconds: 0.7,
    speedMps: 30,
    mph: 67,
    type: "fastball",
    ...partial,
  };
}

describe("batter AI", () => {
  const cleanup = teams[0].lineup[3];
  const nine = teams[0].lineup[8];

  it("does not treat a slow meatball as an automatic take", () => {
    const hanger = traj({ type: "knuckleball", mph: 48, speedMps: 21, plate: { x: 0, y: 0.78 } });
    let takes = 0;
    const n = 200;
    for (let i = 0; i < n; i += 1) {
      const d = decidePitch(blankState(), cleanup, hanger, mulberry32(400 + i));
      if (!d.swung && d.outcome === "called-strike") takes += 1;
      expect(d.hanger).toBe(true);
    }
    expect(takes / n).toBeLessThan(0.2);
  });

  it("lets cleanup punish hangers more than the 9-hole", () => {
    const hanger = traj({ type: "knuckleball", mph: 48, speedMps: 21, plate: { x: 0, y: 0.78 } });
    const n = 300;
    let cleanHits = 0;
    let nineHits = 0;
    for (let i = 0; i < n; i += 1) {
      const c = decidePitch(blankState(), cleanup, hanger, mulberry32(900 + i)).outcome;
      const last = decidePitch(blankState(), nine, hanger, mulberry32(900 + i)).outcome;
      if (c === "single" || c === "double" || c === "triple" || c === "homer") cleanHits += 1;
      if (last === "single" || last === "double" || last === "triple" || last === "homer") nineHits += 1;
    }
    expect(cleanHits).toBeGreaterThan(nineHits + 20);
  });

  it("fools more swings-and-misses on a changeup after a fastball", () => {
    const change = traj({ type: "changeup", mph: 58, speedMps: 26, plate: { x: 0.05, y: 0.72 } });
    const afterFb = blankState({ lastPitchId: "fastball", lastPitchMph: 92 });
    const afterCh = blankState({ lastPitchId: "changeup", lastPitchMph: 58 });
    const n = 250;
    let missAfterFb = 0;
    let missAfterCh = 0;
    for (let i = 0; i < n; i += 1) {
      if (decidePitch(afterFb, cleanup, change, mulberry32(70 + i)).outcome === "swinging-strike") {
        missAfterFb += 1;
      }
      if (decidePitch(afterCh, cleanup, change, mulberry32(70 + i)).outcome === "swinging-strike") {
        missAfterCh += 1;
      }
    }
    expect(missAfterFb).toBeGreaterThan(missAfterCh);
  });
});
