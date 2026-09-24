import { describe, expect, it } from "vitest";
import { FLIGHT } from "../src/config";
import { evaluateGesture } from "../src/game/gesture";
import { mulberry32 } from "../src/game/rng";
import { inZone, simulatePitch } from "../src/game/physics";

function grade(powerT: number, loc = { x: 0, y: 0.78 }, drag = { x: 0, y: 0 }) {
  return evaluateGesture({ x: loc.x - drag.x, y: loc.y - drag.y, t: 0 }, { x: loc.x, y: loc.y, t: powerT });
}

function slopeNearEnd(
  traj: { samples: { t: number; x: number; y: number }[] },
  axis: "x" | "y",
) {
  const n = traj.samples.length;
  const a = traj.samples[n - 4];
  const b = traj.samples[n - 1];
  return (b[axis] - a[axis]) / (b.t - a.t);
}

describe("pitch physics", () => {
  it("keeps flight time between 0.5s and 0.9s", () => {
    const rng = mulberry32(1);
    const fast = simulatePitch("fastball", grade(1.2), "R", rng);
    const knuck = simulatePitch("knuckleball", grade(0.05), "R", rng);
    expect(fast.flightSeconds).toBeGreaterThanOrEqual(FLIGHT.minSeconds - 0.06);
    expect(fast.flightSeconds).toBeLessThanOrEqual(0.7);
    expect(knuck.flightSeconds).toBeGreaterThan(fast.flightSeconds);
    expect(knuck.flightSeconds).toBeLessThanOrEqual(FLIGHT.maxSeconds + 0.08);
  });

  it("drops a curve later and harder than a fastball", () => {
    const aimed = grade(1.2, { x: 0, y: 0.9 });
    const fb = simulatePitch("fastball", aimed, "R", mulberry32(2));
    const cu = simulatePitch("curveball", aimed, "R", mulberry32(3));
    expect(slopeNearEnd(cu, "y")).toBeLessThan(slopeNearEnd(fb, "y") - 1);
  });

  it("breaks a righty slider toward third at the end", () => {
    const aimed = grade(1.2, { x: 0, y: 0.8 });
    const fb = simulatePitch("fastball", aimed, "R", mulberry32(4));
    const sl = simulatePitch("slider", aimed, "R", mulberry32(4));
    expect(slopeNearEnd(sl, "x")).toBeLessThan(slopeNearEnd(fb, "x") - 0.4);
  });

  it("adds extra break in the drag direction", () => {
    const flat = simulatePitch("fastball", grade(1.2, { x: 0, y: 0.8 }), "R", mulberry32(5));
    const up = simulatePitch("fastball", grade(1.2, { x: 0, y: 0.8 }, { x: 0, y: 0.25 }), "R", mulberry32(5));
    expect(up.plate.y).toBeGreaterThan(flat.plate.y);
  });

  it("flutters a knuckleball so two seeds do not match", () => {
    const g = grade(1.0, { x: 0, y: 0.8 });
    const a = simulatePitch("knuckleball", g, "R", mulberry32(10));
    const b = simulatePitch("knuckleball", g, "R", mulberry32(11));
    expect(Math.abs(a.plate.x - b.plate.x) + Math.abs(a.plate.y - b.plate.y)).toBeGreaterThan(0.02);
  });

  it("lands a filled fastball in the zone when aimed there", () => {
    const traj = simulatePitch("fastball", grade(1.2, { x: 0, y: 0.78 }), "R", mulberry32(8));
    expect(inZone(traj.plate)).toBe(true);
  });
});
