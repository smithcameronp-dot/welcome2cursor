import { STATUS } from "../config";
import type { GameResult, GameState, GameStatus, Outcome } from "./types";

export function blankState(overrides: Partial<GameState> = {}): GameState {
  return {
    outs: 0,
    balls: 0,
    strikes: 0,
    hits: 0,
    walks: 0,
    hbp: 0,
    strikeouts: 0,
    runs: 0,
    pitchCount: 0,
    singles: 0,
    doubles: 0,
    triples: 0,
    homers: 0,
    runners: 0,
    batterIndex: 0,
    lastPitchId: null,
    lastPitchMph: 0,
    lastPitchLocation: null,
    status: "perfect",
    finished: false,
    result: null,
    ...overrides,
  };
}

export function formatInnings(outs: number) {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

export function inningOf(outs: number) {
  return Math.min(9, Math.floor(outs / 3) + 1);
}

export function statusOf(state: Pick<GameState, "hits" | "walks" | "hbp">): GameStatus {
  if (state.hits === 0 && state.walks === 0 && state.hbp === 0) return "perfect";
  if (state.hits === 0) return "no-hitter";
  return "game";
}

export function resultOf(state: GameState): GameResult | null {
  if (!state.finished) return null;
  if (state.hits === 0 && state.walks === 0 && state.hbp === 0) return "perfect";
  if (state.hits === 0) return "no-hitter";
  return "complete";
}

export function applyBaserunners(runners: number, kind: "single" | "hard" | "hr") {
  if (kind === "hr") return { runners: 0, runs: runners + 1 };
  if (kind === "hard") return { runners: 1, runs: runners };
  if (runners >= 3) return { runners: 3, runs: 1 };
  return { runners: runners + 1, runs: 0 };
}

function finishIfNeeded(state: GameState): GameState {
  if (state.finished) return state;
  if (state.outs < STATUS.outsToFinish) {
    return { ...state, status: statusOf(state), result: null, finished: false };
  }
  const finished = { ...state, finished: true, status: statusOf(state) };
  return { ...finished, result: resultOf(finished) };
}

function endPA(state: GameState, patch: Partial<GameState>): GameState {
  return finishIfNeeded({
    ...state,
    ...patch,
    batterIndex: state.batterIndex + 1,
    balls: 0,
    strikes: 0,
  });
}

export function applyOutcome(state: GameState, outcome: Outcome): GameState {
  if (state.finished) return state;

  if (outcome === "ball") {
    const balls = state.balls + 1;
    if (balls >= 4) return applyOutcome({ ...state, balls: 3 }, "walk");
    return { ...state, balls, status: statusOf(state) };
  }

  if (outcome === "called-strike" || outcome === "swinging-strike") {
    const strikes = state.strikes + 1;
    if (strikes >= 3) return applyOutcome({ ...state, strikes: 2 }, "strikeout");
    return { ...state, strikes };
  }

  if (outcome === "foul") {
    if (state.strikes >= 2) return state;
    return { ...state, strikes: state.strikes + 1 };
  }

  if (outcome === "strikeout" || outcome === "groundout" || outcome === "flyout" || outcome === "lineout") {
    const outs = state.outs + 1;
    const endOfInning = outs % 3 === 0;
    return endPA(state, {
      outs,
      strikeouts: state.strikeouts + (outcome === "strikeout" ? 1 : 0),
      runners: endOfInning ? 0 : state.runners,
    });
  }

  if (outcome === "walk" || outcome === "hbp") {
    const advanced = applyBaserunners(state.runners, "single");
    return endPA(state, {
      walks: state.walks + (outcome === "walk" ? 1 : 0),
      hbp: state.hbp + (outcome === "hbp" ? 1 : 0),
      runners: advanced.runners,
      runs: state.runs + advanced.runs,
    });
  }

  if (outcome === "single" || outcome === "double" || outcome === "triple" || outcome === "homer") {
    const kind = outcome === "homer" ? "hr" : outcome === "single" ? "single" : "hard";
    const advanced = applyBaserunners(state.runners, kind);
    return endPA(state, {
      hits: state.hits + 1,
      singles: state.singles + (outcome === "single" ? 1 : 0),
      doubles: state.doubles + (outcome === "double" ? 1 : 0),
      triples: state.triples + (outcome === "triple" ? 1 : 0),
      homers: state.homers + (outcome === "homer" ? 1 : 0),
      runners: advanced.runners,
      runs: state.runs + advanced.runs,
    });
  }

  return state;
}
