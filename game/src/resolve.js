// One hit rate cannot produce both a 2% perfect game and a 45% chance of
// 11 hits. Outings open rough (70%), ordinary (15%), or sharp (15%).
// The dial still moves the day: executed pitches are harder to hit, missed ones hang.
export const ROUGH_DAY_RATE = 0.7;
export const HOOK_HITS = 11;
export const HOOK_RUNS = 7;
export const OUTS_TO_FINISH = 27;

const PITCH_TYPES = ["fastball", "sinker", "slider", "curve", "changeup"];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function shouldHook(hits, runs) {
  return hits >= HOOK_HITS || runs >= HOOK_RUNS;
}

export function formatInnings(outs) {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

export function blankOuting(overrides = {}) {
  return {
    command: 0.55,
    outs: 0,
    hits: 0,
    runs: 0,
    walks: 0,
    hbp: 0,
    runners: 0,
    batterIndex: 0,
    balls: 0,
    strikes: 0,
    hooked: false,
    finished: false,
    perfect: false,
    ...overrides,
  };
}

export function createOuting(rng) {
  const roll = rng();
  const base = roll < ROUGH_DAY_RATE ? 0.14 : roll < 0.85 ? 0.5 : 0.82;
  const command = clamp(base + (rng() - 0.5) * 0.03, 0, 1);
  return blankOuting({ command });
}

export function currentBatter(team, state) {
  return team.lineup[state.batterIndex % team.lineup.length];
}

export function applyBaserunners(runners, kind) {
  if (kind === "hr") return { runners: 0, runs: runners + 1 };
  if (kind === "hard") return { runners: 1, runs: runners };
  if (runners >= 3) return { runners: 3, runs: 1 };
  return { runners: runners + 1, runs: 0 };
}

function finishIfNeeded(state) {
  if (state.hooked || state.finished) return state;
  if (shouldHook(state.hits, state.runs)) {
    return { ...state, hooked: true, finished: true, perfect: false };
  }
  if (state.outs >= OUTS_TO_FINISH) {
    const perfect = state.hits === 0 && state.walks === 0 && state.hbp === 0;
    return { ...state, finished: true, perfect };
  }
  return state;
}

function endPlateAppearance(state, patch) {
  return finishIfNeeded({
    ...state,
    ...patch,
    batterIndex: state.batterIndex + 1,
    balls: 0,
    strikes: 0,
  });
}

export function applyOutcome(state, outcome) {
  if (state.finished) return state;

  if (outcome === "ball") {
    const balls = state.balls + 1;
    if (balls >= 4) return applyOutcome({ ...state, balls: 3 }, "walk");
    return { ...state, balls };
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

  if (outcome === "strikeout" || outcome === "groundout" || outcome === "flyout") {
    const outs = state.outs + 1;
    const endOfInning = outs % 3 === 0;
    return endPlateAppearance(state, {
      outs,
      runners: endOfInning ? 0 : state.runners,
    });
  }

  if (outcome === "walk" || outcome === "hbp") {
    const advanced = applyBaserunners(state.runners, "single");
    return endPlateAppearance(state, {
      walks: state.walks + (outcome === "walk" ? 1 : 0),
      hbp: state.hbp + (outcome === "hbp" ? 1 : 0),
      runners: advanced.runners,
      runs: state.runs + advanced.runs,
    });
  }

  if (outcome === "single" || outcome === "double" || outcome === "homer") {
    const kind = outcome === "homer" ? "hr" : outcome === "double" ? "hard" : "single";
    const advanced = applyBaserunners(state.runners, kind);
    return endPlateAppearance(state, {
      hits: state.hits + 1,
      runners: advanced.runners,
      runs: state.runs + advanced.runs,
    });
  }

  return state;
}

function has(batter, tendency) {
  return batter.tendencies.includes(tendency);
}

function locate(pitch) {
  const error = clamp(pitch.error, 0, 1);
  // A late miss climbs through the zone (a hanger) before it sails. An early miss dives.
  const y = pitch.location.y + (pitch.late ? 0.72 : -0.9) * error;
  const x = pitch.location.x + (pitch.late ? 0.15 : -0.4) * error;
  return { x, y };
}

function inZone(loc) {
  return Math.abs(loc.x) <= 1.08 && Math.abs(loc.y) <= 1.08;
}

function veryInside(loc, bats) {
  return bats === "L" ? loc.x > 1.4 : loc.x < -1.4;
}

export function decidePitch(state, batter, pitch, rng) {
  const error = clamp(pitch.error, 0, 1);
  const loc = locate(pitch);
  const zone = inZone(loc);
  const middle = clamp(1 - Math.hypot(loc.x, loc.y) / 1.15, 0, 1);
  const command = clamp(state.command, 0, 1);

  if (veryInside(loc, batter.bats) && error > 0.7 && rng() < 0.5) {
    return "hbp";
  }

  let swing = zone ? 0.84 : 0.3;
  swing += (52 - batter.vis) / 220;
  if (!zone && has(batter, "free-swinger")) swing += 0.18;
  if (!zone && has(batter, "patient")) swing -= 0.1;
  if (has(batter, "first-pitch") && state.balls === 0 && state.strikes === 0) swing += 0.16;
  if (state.strikes === 2) swing += 0.14;
  if (zone && has(batter, "dead-red") && (pitch.type === "fastball" || pitch.type === "sinker")) {
    swing += 0.08;
  }
  if (has(batter, "breaking-ball") && (pitch.type === "curve" || pitch.type === "slider")) {
    swing += 0.06;
  }
  swing = clamp(swing, 0.03, 0.97);

  if (rng() > swing) {
    return zone ? "called-strike" : "ball";
  }

  let contact = batter.con / 230;
  contact += (1 - command) * 0.1;
  contact -= command * 0.05;
  contact += error * 0.26;
  contact += middle * 0.05;
  if (!zone) contact -= 0.22;
  if (has(batter, "dead-red") && (pitch.type === "fastball" || pitch.type === "sinker")) {
    contact += 0.1;
  }
  if (
    has(batter, "breaking-ball") &&
    (pitch.type === "curve" || pitch.type === "slider") &&
    error < 0.25
  ) {
    contact -= 0.06;
  }
  contact = clamp(contact, 0.04, 0.93);

  if (rng() > contact) return "swinging-strike";

  let fair = 0.58 + error * 0.12;
  if (has(batter, "fighter") && state.strikes === 2) fair -= 0.28;
  fair = clamp(fair, 0.18, 0.9);
  if (rng() > fair) return "foul";

  let hitP = batter.pow / 900 + batter.con / 1200 + batter.spd / 1800;
  hitP += error * 0.16;
  hitP += middle * 0.06;
  hitP += (1 - command) * 0.38;
  hitP -= command * 0.14;
  if (!zone) hitP -= 0.08;
  const onTheEdge = zone && Math.max(Math.abs(loc.x), Math.abs(loc.y)) > 0.62;
  if (onTheEdge && error < 0.22) hitP -= 0.08;
  hitP = clamp(hitP, 0.03, 0.78);

  if (rng() > hitP) {
    const onTheGround = loc.y < 0.15 || pitch.type === "sinker";
    return onTheGround ? "groundout" : "flyout";
  }

  let power = (batter.pow - 58) / 120 + error * 0.35 + middle * 0.15;
  if (batter.pow >= 78 && rng() < clamp(power, 0, 0.55)) return "homer";
  if (batter.pow >= 64 && rng() < 0.28 + error * 0.2) return "double";
  return "single";
}

export function resolvePitch(state, batter, pitch, rng) {
  if (state.finished) return { outcome: "done", state };
  const outcome = decidePitch(state, batter, pitch, rng);
  const error = clamp(pitch.error, 0, 1);
  const command =
    error < 0.25
      ? clamp(state.command + 0.004, 0, 1)
      : clamp(state.command - 0.004, 0, 1);
  const next = applyOutcome({ ...state, command }, outcome);
  return { outcome, state: next };
}

export function averagePolicy(rng) {
  const type = PITCH_TYPES[Math.floor(rng() * PITCH_TYPES.length)];
  const inWindow = rng() < 0.5;
  return {
    type,
    location: { x: rng() * 2.1 - 1.05, y: rng() * 2.1 - 1.05 },
    error: inWindow ? rng() * 0.2 : 0.48 + rng() * 0.52,
    late: inWindow ? false : rng() < 0.55,
  };
}

export function sharpPolicy(_rng, batter) {
  const deadRed = has(batter, "dead-red");
  const away = batter.bats === "L" ? -0.82 : 0.82;
  return {
    type: deadRed ? "slider" : "sinker",
    location: { x: away, y: -0.72 },
    error: 0,
    late: false,
  };
}

export function wildPolicy() {
  return {
    type: "fastball",
    location: { x: 0, y: 0.15 },
    error: 1,
    late: true,
  };
}

export function simulateOuting(team, rng, policy) {
  let state = createOuting(rng);
  let pitches = 0;
  while (!state.finished && pitches < 500) {
    const batter = currentBatter(team, state);
    const pitch = policy(rng, batter, state);
    state = resolvePitch(state, batter, pitch, rng).state;
    pitches += 1;
  }
  return state;
}

export function hitBucket(state) {
  if (state.perfect) return "perfect";
  if (state.hits <= 0) return "other";
  if (state.hits <= 5) return "1-5";
  if (state.hits <= 10) return "6-10";
  return "11+";
}

export function plateAppearance(batter, pitch, seed, command = 0.55) {
  const rng = mulberry32(seed);
  let state = blankOuting({ command });
  for (let i = 0; i < 40 && !state.finished && state.batterIndex === 0; i += 1) {
    const step = resolvePitch(state, batter, pitch, rng);
    state = step.state;
    if (state.batterIndex > 0 || state.finished) return { outcome: step.outcome, state };
  }
  return { outcome: "unfinished", state };
}
