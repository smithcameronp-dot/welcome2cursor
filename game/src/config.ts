/** All gameplay, camera, cutscene, and mix numbers. Render reads this; it does not write it. */

export const SIM_HZ = 120;
export const SIM_DT = 1 / SIM_HZ;

export const FIELD = {
  moundToPlate: 18.4404,
  basePath: 27.432,
  moundHeight: 0.254,
  plateWidth: 0.4318,
  zoneHalfWidth: 0.2159,
  zoneBottom: 0.5,
  zoneTop: 1.05,
  releaseHeight: 1.85,
  releaseTowardPlate: 0.55,
  releaseOffCenter: 0.18,
  outfieldLeft: 100.584,
  outfieldCenter: 121.92,
  outfieldRight: 100.584,
} as const;

export const GESTURE = {
  fillSeconds: 1.2,
  circles: 5,
  overholdSeconds: 0.45,
  dragDeadzone: 0.08,
  dragBreakPerMeter: 14,
  excessDragScatter: 0.55,
  overholdScatter: 0.7,
  maxScatter: 0.45,
} as const;

export const FLIGHT = {
  minSeconds: 0.5,
  maxSeconds: 0.9,
  gravity: -9.81,
  knuckleJerk: 38,
  knuckleDamp: 0.9,
} as const;

export const PITCHES = {
  fastball: {
    id: "fastball",
    label: "Fastball",
    abbr: "FB",
    minSeconds: 0.5,
    maxSeconds: 0.62,
    breakAccel: { x: 0, y: 7.2, z: 0 },
    spinRpm: 2300,
    seam: "four-seam",
  },
  sinker: {
    id: "sinker",
    label: "Sinker",
    abbr: "SI",
    minSeconds: 0.54,
    maxSeconds: 0.68,
    breakAccel: { x: 0.8, y: -3.4, z: 0 },
    spinRpm: 2100,
    seam: "two-seam",
  },
  slider: {
    id: "slider",
    label: "Slider",
    abbr: "SL",
    minSeconds: 0.62,
    maxSeconds: 0.76,
    breakAccel: { x: 6.4, y: -1.8, z: 0 },
    spinRpm: 2400,
    seam: "gyro",
  },
  curveball: {
    id: "curveball",
    label: "Curveball",
    abbr: "CU",
    minSeconds: 0.7,
    maxSeconds: 0.84,
    breakAccel: { x: 3.2, y: -8.5, z: 0 },
    spinRpm: 2500,
    seam: "topspin",
  },
  changeup: {
    id: "changeup",
    label: "Changeup",
    abbr: "CH",
    minSeconds: 0.66,
    maxSeconds: 0.8,
    breakAccel: { x: 1.1, y: -4.2, z: 0 },
    spinRpm: 1700,
    seam: "fade",
  },
  knuckleball: {
    id: "knuckleball",
    label: "Knuckleball",
    abbr: "KN",
    minSeconds: 0.76,
    maxSeconds: 0.9,
    breakAccel: { x: 0, y: -1.2, z: 0 },
    spinRpm: 80,
    seam: "knuckle",
  },
} as const;

export const AI = {
  hangerSpeedGap: 8,
  hangerContactBoost: 0.28,
  hangerPowerBoost: 0.34,
  surpriseMiss: 0.18,
  chaseBase: 0.28,
  zoneSwingBase: 0.82,
  twoStrikeSwing: 0.12,
  hotZoneSwing: 0.08,
  hotZoneContact: 0.1,
  coldZoneContact: -0.12,
  insideHbp: 0.42,
} as const;

export const CAMERA = {
  gameplayFov: 30,
  gameplayBack: 3.05,
  gameplayHeight: 1.98,
  handheldPx: 0.8,
  releaseWhipDeg: 2.5,
  releaseWhipMs: 150,
  ballFollowSeconds: 1.5,
  kFov: 18,
} as const;

export const CUTSCENE = {
  skipAfterMs: 700,
  heroTotal: 10,
  dugoutExit: 3,
  walk: 4.5,
  rubber: 2.5,
  kHoldMs: 400,
  kStandard: 2.5,
  kInningEnding: 4,
  walkLook: 2,
  inningWide: 2,
  crossfadeMs: 250,
  uiFadeIn: 0.8,
} as const;

export const AUDIO = {
  master: 0.85,
  mitt: 0.7,
  crack: 0.8,
  crowd: 0.45,
  pa: 0.6,
} as const;

export const STATUS = {
  outsToFinish: 27,
} as const;
