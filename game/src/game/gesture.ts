import { FIELD, GESTURE } from "../config";
import { clamp } from "./rng";
import type { GradedThrow, PlateXY } from "./types";

export type GesturePoint = PlateXY & { t: number };

function hypot(a: PlateXY) {
  return Math.hypot(a.x, a.y);
}

export function evaluateGesture(down: GesturePoint, up: GesturePoint): GradedThrow {
  const held = Math.max(0, up.t - down.t);
  const slot = GESTURE.fillSeconds / GESTURE.circles;
  const raw = held / slot;
  const circles = clamp(Math.floor(raw), 0, GESTURE.circles);
  const power = clamp(raw / GESTURE.circles, 0, 1);
  const overhold = Math.max(0, held - GESTURE.fillSeconds);
  const drag = { x: up.x - down.x, y: up.y - down.y };
  const excess = Math.max(0, hypot(drag) - GESTURE.dragDeadzone);
  const controlLoss = clamp(
    overhold / GESTURE.overholdSeconds + excess * GESTURE.excessDragScatter,
    0,
    1,
  );
  return {
    circles,
    power,
    overhold,
    drag,
    controlLoss,
    location: { x: up.x, y: up.y },
    held,
  };
}

export function inPlateArea(point: PlateXY) {
  const pad = FIELD.zoneHalfWidth * 3.2;
  return Math.abs(point.x) <= pad && point.y >= 0.05 && point.y <= FIELD.zoneTop + 0.55;
}
