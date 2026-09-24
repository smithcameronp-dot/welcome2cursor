import { decidePitch } from "./batter";
import { simulatePitch } from "./physics";
import { applyOutcome, blankState } from "./rules";
import type { Club, GameState, GradedThrow, PitchDecision, PitchId, Pitcher, Rng, Trajectory } from "./types";

export type ResolvedPitch = {
  outcome: PitchDecision["outcome"];
  decision: PitchDecision;
  trajectory: Trajectory;
  state: GameState;
};

export function createOuting(): GameState {
  return blankState();
}

export function currentBatter(team: Club, state: GameState) {
  return team.lineup[state.batterIndex % team.lineup.length];
}

export function throwPitch(
  state: GameState,
  team: Club,
  pitcher: Pitcher,
  type: PitchId,
  graded: GradedThrow,
  rng: Rng,
): ResolvedPitch {
  if (state.finished) {
    const dummy = simulatePitch(type, graded, pitcher.throws, rng);
    return {
      outcome: "ball",
      decision: { outcome: "ball", swung: false, inZone: false, hanger: false, fooled: false },
      trajectory: dummy,
      state,
    };
  }
  const batter = currentBatter(team, state);
  const trajectory = simulatePitch(type, graded, pitcher.throws, rng);
  const decision = decidePitch(state, batter, trajectory, rng);
  const next = applyOutcome(
    {
      ...state,
      pitchCount: state.pitchCount + 1,
      lastPitchId: type,
      lastPitchMph: trajectory.mph,
      lastPitchLocation: trajectory.plate,
    },
    decision.outcome,
  );
  return { outcome: decision.outcome, decision, trajectory, state: next };
}

export function simulateOuting(
  team: Club,
  pitcher: Pitcher,
  rng: Rng,
  policy: (rng: Rng, state: GameState) => { type: PitchId; graded: GradedThrow },
) {
  let state = createOuting();
  let pitches = 0;
  while (!state.finished && pitches < 2500) {
    const pick = policy(rng, state);
    state = throwPitch(state, team, pitcher, pick.type, pick.graded, rng).state;
    pitches += 1;
  }
  return state;
}
