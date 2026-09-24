import { PITCHES } from "../config";
import type { PitchId } from "./types";

export const PITCH_ORDER: PitchId[] = [
  "fastball",
  "changeup",
  "curveball",
  "slider",
  "sinker",
  "knuckleball",
];

export function pitchDef(id: PitchId) {
  return PITCHES[id];
}

export function isOffspeed(id: PitchId) {
  return id === "changeup" || id === "curveball" || id === "knuckleball";
}

export function typicalMph(id: PitchId) {
  const def = PITCHES[id];
  const seconds = (def.minSeconds + def.maxSeconds) / 2;
  return (18.4404 / seconds) * 2.236936;
}
