import type { Batter, Club, Pitcher, ZoneCell } from "../game/types";

function cell(x: -1 | 0 | 1, y: -1 | 0 | 1): ZoneCell {
  return { x, y };
}

function batter(
  name: string,
  bats: "L" | "R",
  power: number,
  contact: number,
  discipline: number,
  speed: number,
  hot: ZoneCell,
  cold: ZoneCell,
): Batter {
  return { name, bats, contact, power, discipline, speed, hotZone: hot, coldZone: cold };
}

export const pitcher: Pitcher = {
  name: "Cole Brant",
  throws: "R",
  city: "San Antonio",
  club: "Gulls",
  number: 21,
  pitches: ["fastball", "changeup", "curveball", "slider", "sinker", "knuckleball"],
};

export const teams: Club[] = [
  {
    id: "otters",
    city: "Austin",
    name: "Otters",
    color: "#d4652f",
    accent: "#f2d2a2",
    lineup: [
      batter("Reed Paloma", "L", 52, 80, 68, 90, cell(0, -1), cell(1, 1)),
      batter("Miles Okada", "R", 58, 78, 76, 74, cell(-1, 0), cell(1, -1)),
      batter("Andre Solis", "R", 84, 80, 70, 62, cell(0, 1), cell(-1, -1)),
      batter("Luis Camacho", "R", 92, 68, 56, 44, cell(0, 1), cell(-1, 0)),
      batter("Imani Brooks", "L", 78, 74, 66, 70, cell(1, -1), cell(-1, 1)),
      batter("Sam Rivera", "R", 60, 66, 62, 64, cell(1, 0), cell(-1, 1)),
      batter("Eli Navarro", "R", 54, 60, 58, 56, cell(0, 0), cell(1, 1)),
      batter("Josh Pemberton", "R", 40, 48, 50, 42, cell(1, 1), cell(0, -1)),
      batter("Cal Dunne", "R", 32, 40, 44, 36, cell(-1, -1), cell(0, 1)),
    ],
  },
  {
    id: "locks",
    city: "Portland",
    name: "Locks",
    color: "#2f6f62",
    accent: "#d5ebe4",
    lineup: [
      batter("Hannah Crowe", "L", 48, 82, 74, 86, cell(-1, -1), cell(1, 1)),
      batter("Theo March", "L", 55, 80, 78, 72, cell(0, 0), cell(1, -1)),
      batter("Benicio Ruiz", "R", 70, 86, 80, 60, cell(1, -1), cell(-1, 1)),
      batter("Grant Holley", "R", 88, 64, 58, 48, cell(0, 1), cell(-1, 0)),
      batter("Naomi Feld", "L", 76, 72, 70, 66, cell(0, 1), cell(-1, -1)),
      batter("Chris Adelman", "R", 58, 64, 66, 60, cell(-1, 0), cell(1, 1)),
      batter("Pete Iwata", "R", 50, 58, 60, 64, cell(1, 0), cell(-1, 1)),
      batter("Doug Kessler", "R", 38, 46, 48, 40, cell(1, 1), cell(0, 0)),
      batter("Albie Frost", "L", 30, 38, 46, 34, cell(-1, -1), cell(0, 1)),
    ],
  },
  {
    id: "echoes",
    city: "Nashville",
    name: "Echoes",
    color: "#6b3fa0",
    accent: "#ead9f8",
    lineup: [
      batter("Junie Cobb", "L", 50, 76, 84, 82, cell(-1, 0), cell(1, 1)),
      batter("Marcus Hale", "R", 62, 74, 80, 70, cell(-1, 0), cell(1, -1)),
      batter("Deon Clarke", "R", 86, 76, 64, 58, cell(0, 1), cell(-1, -1)),
      batter("Vera Lang", "L", 90, 66, 60, 52, cell(0, 1), cell(1, -1)),
      batter("Omar Siddig", "R", 74, 78, 72, 64, cell(1, -1), cell(-1, 1)),
      batter("Kyle Breen", "R", 56, 62, 68, 60, cell(0, 0), cell(1, 1)),
      batter("Tess Arnold", "L", 52, 58, 64, 66, cell(0, 1), cell(-1, 0)),
      batter("Billy Knott", "R", 36, 44, 52, 40, cell(1, 1), cell(0, -1)),
      batter("Wes Palmer", "R", 28, 36, 42, 38, cell(-1, -1), cell(0, 1)),
    ],
  },
  {
    id: "steel",
    city: "Buffalo",
    name: "Steel",
    color: "#8a3a3a",
    accent: "#f0d0c8",
    lineup: [
      batter("Roman Biel", "R", 54, 74, 60, 92, cell(1, -1), cell(-1, 1)),
      batter("Casey Nguyen", "L", 60, 76, 64, 80, cell(1, 0), cell(-1, 1)),
      batter("Victor Adeyemi", "R", 88, 82, 68, 66, cell(0, 1), cell(-1, -1)),
      batter("Hank Moroz", "R", 96, 62, 50, 40, cell(0, 1), cell(-1, 0)),
      batter("Lila Schmidt", "L", 80, 70, 62, 58, cell(0, 0), cell(1, 1)),
      batter("Drew Passos", "R", 58, 60, 58, 62, cell(1, 0), cell(-1, 1)),
      batter("Miguel Sosa", "R", 48, 56, 54, 60, cell(1, 1), cell(-1, 0)),
      batter("Ed Kline", "R", 34, 42, 46, 38, cell(-1, -1), cell(0, 1)),
      batter("Patty Ruiz", "R", 26, 34, 40, 32, cell(1, 1), cell(0, 0)),
    ],
  },
];

export function teamById(id: string) {
  return teams.find((team) => team.id === id) ?? teams[0];
}
