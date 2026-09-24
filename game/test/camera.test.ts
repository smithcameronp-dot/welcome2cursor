import { describe, expect, it } from "vitest";
import { CAMERA, FIELD } from "../src/config";
import { firstBase, gameplayRig, secondBase, thirdBase, wallRadius } from "../src/render/camera";

describe("gameplay camera", () => {
  it("sits about 10 ft behind the rubber and 6.5 ft up, looking at the plate", () => {
    const rig = gameplayRig();
    expect(rig.fov).toBe(30);
    expect(rig.pos.z).toBeCloseTo(FIELD.moundToPlate + CAMERA.gameplayBack);
    expect(rig.pos.y).toBeCloseTo(1.98);
    expect(rig.pos.x).toBeGreaterThan(0);
    expect(rig.look.z).toBeLessThan(1);
    expect(rig.look.y).toBeGreaterThan(0.3);
    expect(rig.pos.z).toBeGreaterThan(FIELD.moundToPlate);
  });
});

describe("field scale", () => {
  it("places 90-ft bases and 330/400/330 walls", () => {
    const first = firstBase();
    const third = thirdBase();
    const second = secondBase();
    expect(Math.hypot(first.x, first.z)).toBeCloseTo(FIELD.basePath, 3);
    expect(Math.hypot(third.x, third.z)).toBeCloseTo(FIELD.basePath, 3);
    expect(second.z).toBeCloseTo(FIELD.basePath * Math.SQRT2, 3);
    expect(wallRadius(0)).toBeCloseTo(FIELD.outfieldCenter);
    expect(wallRadius(Math.PI / 4)).toBeCloseTo(FIELD.outfieldLeft);
  });
});
