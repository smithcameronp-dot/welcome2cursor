import { CAMERA, FIELD } from "../config";

export function gameplayRig() {
  return {
    pos: {
      x: CAMERA.gameplayOffCenter,
      y: CAMERA.gameplayHeight,
      z: FIELD.moundToPlate + CAMERA.gameplayBack,
    },
    look: {
      x: 0,
      y: CAMERA.lookHeight,
      z: 0.12,
    },
    fov: CAMERA.gameplayFov,
  };
}

export function firstBase() {
  const h = FIELD.basePath / Math.SQRT2;
  return { x: h, z: h };
}

export function thirdBase() {
  const h = FIELD.basePath / Math.SQRT2;
  return { x: -h, z: h };
}

export function secondBase() {
  return { x: 0, z: FIELD.basePath * Math.SQRT2 };
}

/** θ = 0 is center field (+Z), ±π/4 are the foul poles. */
export function wallRadius(thetaFromCf: number) {
  const t = Math.min(1, Math.abs(thetaFromCf) / (Math.PI / 4));
  return FIELD.outfieldCenter + (FIELD.outfieldLeft - FIELD.outfieldCenter) * t * t;
}
