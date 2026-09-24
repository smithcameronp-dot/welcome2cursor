import { AI, FIELD } from "../config";
import { inZone, zoneCellOf } from "./physics";
import { typicalMph } from "./pitches";
import { clamp } from "./rng";
import type { Batter, GameState, Outcome, PitchDecision, Rng, Trajectory } from "./types";

function sameCell(a: { x: number; y: number }, b: { x: number; y: number }) {
  return a.x === b.x && a.y === b.y;
}

function veryInside(loc: { x: number; y: number }, bats: "L" | "R") {
  return bats === "L" ? loc.x > FIELD.zoneHalfWidth * 1.7 : loc.x < -FIELD.zoneHalfWidth * 1.7;
}

export function decidePitch(
  state: GameState,
  batter: Batter,
  traj: Trajectory,
  rng: Rng,
): PitchDecision {
  const loc = traj.plate;
  const zone = inZone(loc);
  const cell = zoneCellOf(loc);
  const hot = sameCell(cell, batter.hotZone);
  const cold = sameCell(cell, batter.coldZone);
  const middle =
    Math.abs(loc.x) < FIELD.zoneHalfWidth * 0.45 &&
    loc.y > FIELD.zoneBottom + 0.12 &&
    loc.y < FIELD.zoneTop - 0.12;
  const expected = state.lastPitchMph || typicalMph("fastball");
  const surprise = expected - traj.mph;
  const fooled = surprise > AI.hangerSpeedGap && zone;
  const hanger = zone && middle && traj.mph < typicalMph("fastball") - AI.hangerSpeedGap;

  if (veryInside(loc, batter.bats) && traj.type !== "knuckleball" && rng() < AI.insideHbp * (0.4 + (100 - batter.discipline) / 200)) {
    return { outcome: "hbp", swung: false, inZone: false, hanger, fooled };
  }

  let swing: number = zone ? AI.zoneSwingBase : AI.chaseBase;
  swing += (52 - batter.discipline) / 260;
  if (state.strikes === 2) swing += AI.twoStrikeSwing;
  if (hot) swing += AI.hotZoneSwing;
  if (fooled) swing += 0.16;
  if (hanger) swing = Math.max(swing, 0.9);
  if (!zone) swing -= batter.discipline / 400;
  swing = clamp(swing, 0.04, 0.97);

  if (rng() > swing) {
    return {
      outcome: zone ? "called-strike" : "ball",
      swung: false,
      inZone: zone,
      hanger,
      fooled,
    };
  }

  let contact: number = batter.contact / 220;
  if (!zone) contact -= 0.24;
  if (hot) contact += AI.hotZoneContact;
  if (cold) contact += AI.coldZoneContact;
  if (hanger) contact += AI.hangerContactBoost * (batter.contact / 70);
  if (fooled && !hanger) contact -= AI.surpriseMiss;
  if (middle) contact += 0.04;
  contact = clamp(contact, 0.05, 0.95);

  if (rng() > contact) {
    return { outcome: "swinging-strike", swung: true, inZone: zone, hanger, fooled };
  }

  let fair: number = 0.7;
  if (state.strikes === 2) fair -= 0.1;
  if (hanger) fair += 0.1;
  fair = clamp(fair, 0.22, 0.94);
  if (rng() > fair) {
    return { outcome: "foul", swung: true, inZone: zone, hanger, fooled };
  }

  let hitP: number = batter.power / 380 + batter.contact / 1800;
  if (hanger) hitP += AI.hangerPowerBoost * (batter.power / 90);
  if (!zone) hitP -= 0.1;
  if (middle) hitP += 0.05;
  if (cold) hitP -= 0.06;
  hitP = clamp(hitP, 0.04, 0.82);

  if (rng() > hitP) {
    if (loc.y < FIELD.zoneBottom + 0.08 || traj.type === "sinker") {
      return { outcome: "groundout", swung: true, inZone: zone, hanger, fooled };
    }
    return {
      outcome: rng() < 0.35 ? "lineout" : "flyout",
      swung: true,
      inZone: zone,
      hanger,
      fooled,
    };
  }

  let extra = (batter.power - 60) / 110 + (hanger ? 0.25 : 0);
  extra = clamp(extra, 0, 0.85);
  let outcome: Outcome = "single";
  if (batter.power >= 80 && rng() < extra * 0.55) outcome = "homer";
  else if (batter.power >= 70 && rng() < 0.12 + extra * 0.2) outcome = "triple";
  else if (batter.power >= 62 && rng() < 0.28 + extra * 0.22) outcome = "double";

  return { outcome, swung: true, inZone: zone, hanger, fooled };
}
