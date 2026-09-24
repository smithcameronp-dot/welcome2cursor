import { describe, expect, it } from "vitest";
import { GESTURE } from "../src/config";
import { evaluateGesture, inPlateArea } from "../src/game/gesture";

describe("gesture", () => {
  it("fills five circles across 1.2 seconds and then overholds", () => {
    const down = { x: 0, y: 0.8, t: 0 };
    const at = (t: number) => evaluateGesture(down, { ...down, t });
    expect(at(0).circles).toBe(0);
    expect(at(GESTURE.fillSeconds / 5).circles).toBe(1);
    expect(at(GESTURE.fillSeconds).circles).toBe(5);
    expect(at(GESTURE.fillSeconds).power).toBe(1);
    const late = at(GESTURE.fillSeconds + 0.5);
    expect(late.circles).toBe(5);
    expect(late.power).toBe(1);
    expect(late.overhold).toBeGreaterThan(0.4);
    expect(late.controlLoss).toBeGreaterThan(0.8);
  });

  it("turns excess cursor travel into control loss, not extra power", () => {
    const clean = evaluateGesture({ x: 0, y: 0.8, t: 0 }, { x: 0.02, y: 0.81, t: 1.2 });
    const dragged = evaluateGesture({ x: 0, y: 0.8, t: 0 }, { x: 0.4, y: 0.4, t: 1.2 });
    expect(dragged.power).toBe(clean.power);
    expect(dragged.controlLoss).toBeGreaterThan(clean.controlLoss);
    expect(dragged.drag.x).toBeCloseTo(0.4);
  });

  it("accepts presses over the plate area and rejects far chases", () => {
    expect(inPlateArea({ x: 0, y: 0.8 })).toBe(true);
    expect(inPlateArea({ x: 3, y: 2 })).toBe(false);
  });
});
