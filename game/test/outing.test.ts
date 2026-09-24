import { describe, expect, it } from "vitest";
import { pitcher, teams } from "../src/data/teams";
import { evaluateGesture } from "../src/game/gesture";
import { mulberry32 } from "../src/game/rng";
import { createOuting, simulateOuting, throwPitch } from "../src/game/outing";
import type { GameState, GradedThrow, PitchId, Rng } from "../src/game/types";

function averagePolicy(rng: Rng, _state: GameState) {
  const types: PitchId[] = ["fastball", "sinker", "slider", "curveball", "changeup", "knuckleball"];
  const type = types[Math.floor(rng() * types.length)]!;
  const held = 0.7 + rng() * 0.5;
  const graded: GradedThrow = evaluateGesture(
    { x: (rng() - 0.5) * 0.3, y: 0.55 + rng() * 0.4, t: 0 },
    { x: (rng() - 0.5) * 0.35, y: 0.5 + rng() * 0.5, t: held },
  );
  return { type, graded };
}

describe("nine-inning outing", () => {
  it("always stops at 27 outs and never hooks", () => {
    const state = simulateOuting(teams[0], pitcher, mulberry32(21), averagePolicy);
    expect(state.outs).toBe(27);
    expect(state.finished).toBe(true);
    expect(state.result).toMatch(/perfect|no-hitter|complete/);
  });

  it("counts pitches and remembers the last offering", () => {
    const graded = evaluateGesture({ x: 0, y: 0.78, t: 0 }, { x: 0, y: 0.78, t: 1.2 });
    const step = throwPitch(createOuting(), teams[0], pitcher, "fastball", graded, mulberry32(3));
    expect(step.state.pitchCount).toBe(1);
    expect(step.state.lastPitchId).toBe("fastball");
    expect(step.trajectory.samples.length).toBeGreaterThan(10);
    expect(step.outcome).toBeTruthy();
  });
});
