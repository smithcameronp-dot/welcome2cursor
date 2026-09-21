export const TENDENCY_LABELS = {
  "first-pitch": "First-Pitch Hitter",
  "dead-red": "Dead Red",
  "breaking-ball": "Breaking Ball Hitter",
  fighter: "Fighter",
  "free-swinger": "Free Swinger",
  patient: "Patient",
  "table-setter": "Table Setter",
};

export const pitcher = {
  name: "Cole Brant",
  throws: "R",
  city: "San Antonio",
  club: "Gulls",
  pitches: [
    { id: "fastball", label: "Fastball", abbr: "FB" },
    { id: "sinker", label: "Sinker", abbr: "SI" },
    { id: "slider", label: "Slider", abbr: "SL" },
    { id: "curve", label: "Curve", abbr: "CU" },
    { id: "changeup", label: "Change", abbr: "CH" },
  ],
};

function batter(name, bats, pow, con, vis, spd, tendencies) {
  return { name, bats, pow, con, vis, spd, tendencies };
}

export const teams = [
  {
    id: "otters",
    city: "Austin",
    name: "Otters",
    color: "#d4652f",
    accent: "#f2d2a2",
    lineup: [
      batter("Reed Paloma", "L", 52, 80, 68, 90, ["table-setter", "first-pitch"]),
      batter("Miles Okada", "R", 58, 78, 76, 74, ["patient"]),
      batter("Andre Solis", "R", 84, 80, 70, 62, ["dead-red"]),
      batter("Luis Camacho", "R", 92, 68, 56, 44, ["dead-red"]),
      batter("Imani Brooks", "L", 78, 74, 66, 70, ["breaking-ball"]),
      batter("Sam Rivera", "R", 60, 66, 62, 64, ["free-swinger"]),
      batter("Eli Navarro", "R", 54, 60, 58, 56, ["fighter"]),
      batter("Josh Pemberton", "R", 40, 48, 50, 42, ["free-swinger"]),
      batter("Cal Dunne", "R", 32, 40, 44, 36, ["patient"]),
    ],
  },
  {
    id: "locks",
    city: "Portland",
    name: "Locks",
    color: "#2f6f62",
    accent: "#d5ebe4",
    lineup: [
      batter("Hannah Crowe", "L", 48, 82, 74, 86, ["table-setter", "patient"]),
      batter("Theo March", "L", 55, 80, 78, 72, ["fighter"]),
      batter("Benicio Ruiz", "R", 70, 86, 80, 60, ["breaking-ball"]),
      batter("Grant Holley", "R", 88, 64, 58, 48, ["dead-red"]),
      batter("Naomi Feld", "L", 76, 72, 70, 66, ["first-pitch"]),
      batter("Chris Adelman", "R", 58, 64, 66, 60, ["patient"]),
      batter("Pete Iwata", "R", 50, 58, 60, 64, ["free-swinger"]),
      batter("Doug Kessler", "R", 38, 46, 48, 40, ["free-swinger"]),
      batter("Albie Frost", "L", 30, 38, 46, 34, ["patient"]),
    ],
  },
  {
    id: "echoes",
    city: "Nashville",
    name: "Echoes",
    color: "#6b3fa0",
    accent: "#ead9f8",
    lineup: [
      batter("Junie Cobb", "L", 50, 76, 84, 82, ["table-setter", "patient"]),
      batter("Marcus Hale", "R", 62, 74, 80, 70, ["patient"]),
      batter("Deon Clarke", "R", 86, 76, 64, 58, ["dead-red", "fighter"]),
      batter("Vera Lang", "L", 90, 66, 60, 52, ["dead-red"]),
      batter("Omar Siddig", "R", 74, 78, 72, 64, ["breaking-ball"]),
      batter("Kyle Breen", "R", 56, 62, 68, 60, ["fighter"]),
      batter("Tess Arnold", "L", 52, 58, 64, 66, ["first-pitch"]),
      batter("Billy Knott", "R", 36, 44, 52, 40, ["free-swinger"]),
      batter("Wes Palmer", "R", 28, 36, 42, 38, ["patient"]),
    ],
  },
  {
    id: "steel",
    city: "Buffalo",
    name: "Steel",
    color: "#8a3a3a",
    accent: "#f0d0c8",
    lineup: [
      batter("Roman Biel", "R", 54, 74, 60, 92, ["table-setter", "first-pitch"]),
      batter("Casey Nguyen", "L", 60, 76, 64, 80, ["free-swinger"]),
      batter("Victor Adeyemi", "R", 88, 82, 68, 66, ["dead-red", "breaking-ball"]),
      batter("Hank Moroz", "R", 96, 62, 50, 40, ["dead-red", "free-swinger"]),
      batter("Lila Schmidt", "L", 80, 70, 62, 58, ["fighter"]),
      batter("Drew Passos", "R", 58, 60, 58, 62, ["first-pitch"]),
      batter("Miguel Sosa", "R", 48, 56, 54, 60, ["free-swinger"]),
      batter("Ed Kline", "R", 34, 42, 46, 38, ["patient"]),
      batter("Patty Ruiz", "R", 26, 34, 40, 32, ["free-swinger"]),
    ],
  },
];

export function teamById(id) {
  return teams.find((team) => team.id === id) ?? teams[0];
}
