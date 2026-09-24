import { FIELD, FLIGHT, GESTURE, SIM_DT } from "../config";
import { pitchDef } from "./pitches";
import { clamp, lerp } from "./rng";
import type { GradedThrow, PitchId, PlateXY, Rng, Sample, Trajectory, Vec3 } from "./types";

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function releasePoint(throws: "L" | "R"): Vec3 {
  const side = throws === "R" ? -FIELD.releaseOffCenter : FIELD.releaseOffCenter;
  return {
    x: side,
    y: FIELD.releaseHeight,
    z: FIELD.moundToPlate - FIELD.releaseTowardPlate,
  };
}

export function aimPoint(location: PlateXY): Vec3 {
  return { x: location.x, y: location.y, z: 0 };
}

function scatterLocation(loc: PlateXY, loss: number, rng: Rng): PlateXY {
  const mag = clamp(loss * GESTURE.overholdScatter, 0, GESTURE.maxScatter);
  const angle = rng() * Math.PI * 2;
  return {
    x: loc.x + Math.cos(angle) * mag * (0.4 + rng()),
    y: loc.y + Math.sin(angle) * mag * (0.4 + rng()),
  };
}

export function simulatePitch(
  type: PitchId,
  graded: GradedThrow,
  throws: "L" | "R",
  rng: Rng,
): Trajectory {
  const def = pitchDef(type);
  const sliderSign = throws === "R" ? -1 : 1;
  const loc = scatterLocation(graded.location, graded.controlLoss, rng);
  const start = releasePoint(throws);
  const aim = aimPoint(loc);
  const flight = lerp(def.maxSeconds, def.minSeconds, graded.power);
  const ax0 = def.breakAccel.x * sliderSign;
  const ay0 = FLIGHT.gravity + def.breakAccel.y;
  let v = {
    x: (aim.x - start.x) / flight - 0.5 * ax0 * flight,
    y: (aim.y - start.y) / flight - 0.5 * ay0 * flight,
    z: (aim.z - start.z) / flight,
  };
  let p = { ...start };
  const samples: Sample[] = [{ ...p, t: 0 }];
  let flutter = { x: 0, y: 0 };
  const maxSteps = Math.ceil(1.4 / SIM_DT);

  for (let i = 1; i <= maxSteps; i += 1) {
    const t = i * SIM_DT;
    let ax = ax0 + graded.drag.x * GESTURE.dragBreakPerMeter;
    let ay = ay0 + graded.drag.y * GESTURE.dragBreakPerMeter;
    if (type === "knuckleball") {
      flutter.x += (rng() - 0.5) * FLIGHT.knuckleJerk;
      flutter.y += (rng() - 0.5) * FLIGHT.knuckleJerk;
      flutter.x *= FLIGHT.knuckleDamp;
      flutter.y *= FLIGHT.knuckleDamp;
      ax += flutter.x;
      ay += flutter.y;
    }
    v = add(v, scale({ x: ax, y: ay, z: 0 }, SIM_DT));
    p = add(p, scale(v, SIM_DT));
    samples.push({ ...p, t });
    if (p.z <= 0) break;
  }

  const plate = plateCrossing(samples);
  const last = samples[samples.length - 1];
  const speed = Math.hypot(
    (aim.x - start.x) / flight,
    (aim.y - start.y) / flight,
    (aim.z - start.z) / flight,
  );
  return {
    samples,
    plate: { x: plate.x, y: Math.max(0.02, plate.y) },
    flightSeconds: last.t,
    speedMps: speed,
    mph: speed * 2.236936,
    type,
  };
}

export function plateCrossing(samples: Sample[]): Vec3 {
  if (samples.length < 2) return samples[0] ?? { x: 0, y: 0.8, z: 0 };
  for (let i = 1; i < samples.length; i += 1) {
    const a = samples[i - 1];
    const b = samples[i];
    if (b.z <= 0) {
      const span = a.z - b.z || 1;
      const u = clamp(a.z / span, 0, 1);
      return {
        x: lerp(a.x, b.x, u),
        y: lerp(a.y, b.y, u),
        z: 0,
      };
    }
  }
  return samples[samples.length - 1];
}

export function inZone(loc: PlateXY) {
  return (
    Math.abs(loc.x) <= FIELD.zoneHalfWidth && loc.y >= FIELD.zoneBottom && loc.y <= FIELD.zoneTop
  );
}

export function zoneCellOf(loc: PlateXY) {
  const x = loc.x < -FIELD.zoneHalfWidth / 3 ? -1 : loc.x > FIELD.zoneHalfWidth / 3 ? 1 : 0;
  const mid = (FIELD.zoneBottom + FIELD.zoneTop) / 2;
  const third = (FIELD.zoneTop - FIELD.zoneBottom) / 3;
  const y = loc.y < mid - third / 2 ? -1 : loc.y > mid + third / 2 ? 1 : 0;
  return { x, y } as const;
}
