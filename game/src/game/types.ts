export type PitchId = "fastball" | "sinker" | "slider" | "curveball" | "changeup" | "knuckleball";

export type Hand = "L" | "R";

export type ZoneCell = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

export type Vec3 = { x: number; y: number; z: number };

export type PlateXY = { x: number; y: number };

export type Rng = () => number;

export type Batter = {
  name: string;
  bats: Hand;
  contact: number;
  power: number;
  discipline: number;
  speed: number;
  hotZone: ZoneCell;
  coldZone: ZoneCell;
};

export type Club = {
  id: string;
  city: string;
  name: string;
  color: string;
  accent: string;
  lineup: Batter[];
};

export type Pitcher = {
  name: string;
  throws: Hand;
  city: string;
  club: string;
  number: number;
  pitches: PitchId[];
};

export type Outcome =
  | "ball"
  | "called-strike"
  | "swinging-strike"
  | "foul"
  | "strikeout"
  | "groundout"
  | "flyout"
  | "lineout"
  | "walk"
  | "hbp"
  | "single"
  | "double"
  | "triple"
  | "homer";

export type GameStatus = "perfect" | "no-hitter" | "game";

export type GameResult = "perfect" | "no-hitter" | "complete";

export type GameState = {
  outs: number;
  balls: number;
  strikes: number;
  hits: number;
  walks: number;
  hbp: number;
  strikeouts: number;
  runs: number;
  pitchCount: number;
  singles: number;
  doubles: number;
  triples: number;
  homers: number;
  runners: number;
  batterIndex: number;
  lastPitchId: PitchId | null;
  lastPitchMph: number;
  lastPitchLocation: PlateXY | null;
  status: GameStatus;
  finished: boolean;
  result: GameResult | null;
};

export type GradedThrow = {
  circles: number;
  power: number;
  overhold: number;
  drag: PlateXY;
  controlLoss: number;
  location: PlateXY;
  held: number;
};

export type Sample = Vec3 & { t: number };

export type Trajectory = {
  samples: Sample[];
  plate: PlateXY;
  flightSeconds: number;
  speedMps: number;
  mph: number;
  type: PitchId;
};

export type PitchDecision = {
  outcome: Outcome;
  swung: boolean;
  inZone: boolean;
  hanger: boolean;
  fooled: boolean;
};
