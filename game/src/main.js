import { TENDENCY_LABELS, pitcher, teamById, teams } from "../data/teams.js";
import { createPump } from "./audio.js";
import { DIALS, dialPoint, gradeDial } from "./dial.js";
import { playScene } from "./intro.js";
import {
  createOuting,
  currentBatter,
  formatInnings,
  mulberry32,
  resolvePitch,
} from "./resolve.js";

const $ = (id) => document.getElementById(id);
const menu = $("menu");
const scene = $("scene");
const game = $("game");
const result = $("result");
const canvas = $("scene-canvas");

const LABELS = {
  ball: "Ball",
  "called-strike": "Called strike",
  "swinging-strike": "Swing and a miss",
  foul: "Foul",
  groundout: "Groundout",
  flyout: "Flyout",
  strikeout: "Strikeout",
  single: "Single",
  double: "Double",
  homer: "Home run",
  walk: "Walk",
  hbp: "Hit by pitch",
};

let team = null;
let outing = null;
let rng = null;
let pitchType = null;
let stopScene = null;
let pump = null;
let audioCtx = null;
let dialTimer = 0;
let dialPosition = 0;
let dialing = false;
let resolving = false;

function show(el) {
  for (const section of [menu, scene, game, result]) {
    section.hidden = section !== el;
  }
}

function audio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function renderTeams() {
  const list = $("teams");
  list.replaceChildren();
  for (const club of teams) {
    const button = document.createElement("button");
    button.type = "button";
    button.style.setProperty("--club", club.color);
    button.innerHTML = `<strong>${club.city}</strong><span>${club.name}</span>`;
    button.addEventListener("click", () => startOuting(club));
    list.append(button);
  }
}

function renderPitcher() {
  const card = $("pitcher-card");
  card.replaceChildren();
  card.innerHTML = `
    <p class="eyebrow">${pitcher.city}</p>
    <h3>${pitcher.name}</h3>
    <p class="meta">${pitcher.club} · Throws ${pitcher.throws}</p>
    <div class="pitches-list">${pitcher.pitches.map((pitch) => `<span>${pitch.label}</span>`).join("")}</div>
  `;
}

function renderBatter() {
  const batter = currentBatter(team, outing);
  const card = $("batter-card");
  const bars = [
    ["POW", batter.pow, "#e07a3d"],
    ["CON", batter.con, "#d6c15a"],
    ["VIS", batter.vis, "#6cb5e0"],
    ["SPD", batter.spd, "#8fd18a"],
  ]
    .map(
      ([label, value, color]) => `
      <div class="rating">
        <span>${label}</span>
        <div class="track"><span style="width:${value}%;background:${color}"></span></div>
        <span>${value}</span>
      </div>`,
    )
    .join("");
  const tags = batter.tendencies
    .map((id) => `<span>${TENDENCY_LABELS[id] ?? id}</span>`)
    .join("");
  card.innerHTML = `
    <p class="eyebrow">${team.city} ${team.name}</p>
    <h3>${batter.name}</h3>
    <p class="meta">Bats ${batter.bats} · No. ${(outing.batterIndex % 9) + 1}</p>
    ${bars}
    <div class="tags">${tags}</div>
  `;
}

function renderScore() {
  $("inning").textContent = `Inning ${Math.min(9, Math.floor(outing.outs / 3) + 1)}`;
  $("line").textContent = `${formatInnings(outing.outs)} IP · ${outing.hits} H · ${outing.runs} R`;
  const clean = outing.hits === 0 && outing.walks === 0 && outing.hbp === 0;
  $("perfect").classList.toggle("off", !clean);
  $("count").innerHTML = `
    <span>${dots(outing.balls, 3, "")} </span>
    <span>${dots(outing.strikes, 2, "strike")} </span>
    <span>${dots(outing.outs % 3, 3, "out")}</span>
  `;
}

function dots(on, total, kind) {
  return Array.from({ length: total }, (_, index) => `<i class="${kind} ${index < on ? "on" : ""}"></i>`).join("");
}

function renderPitches() {
  const row = $("pitches");
  row.replaceChildren();
  for (const pitch of pitcher.pitches) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = pitch.label;
    button.setAttribute("aria-pressed", String(pitch.id === pitchType));
    button.addEventListener("click", () => choosePitch(pitch.id));
    row.append(button);
  }
}

function renderZone() {
  const zone = $("zone");
  if (zone.childElementCount) return;
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const button = document.createElement("button");
      button.type = "button";
      const heart = row >= 1 && row <= 3 && col >= 1 && col <= 3;
      if (heart) button.classList.add("heart");
      button.dataset.x = String((col - 2) * 0.7);
      button.dataset.y = String((2 - row) * 0.7);
      button.addEventListener("click", () => chooseLocation(button));
      zone.append(button);
    }
  }
}

function paintWindow(type) {
  const dial = DIALS[type] ?? DIALS.fastball;
  const track = arc(0, 1);
  const windowArc = arc(dial.start, dial.end);
  $("dial-track").setAttribute("d", track);
  $("dial-window").setAttribute("d", windowArc);
  moveNeedle(0);
}

function arc(from, to) {
  const a = dialPoint(from);
  const b = dialPoint(to);
  return `M ${a.x} ${a.y} A 78 78 0 0 1 ${b.x} ${b.y}`;
}

function moveNeedle(position) {
  const tip = dialPoint(Math.max(0, Math.min(1, position)), 74);
  const needle = $("dial-needle");
  needle.setAttribute("x2", String(tip.x));
  needle.setAttribute("y2", String(tip.y));
}

function choosePitch(id) {
  if (resolving || dialing || !outing || outing.finished) return;
  pitchType = id;
  renderPitches();
  paintWindow(id);
  $("call").textContent = "Pick a spot";
}

function chooseLocation(button) {
  if (!pitchType || resolving || dialing || outing.finished) return;
  for (const cell of $("zone").children) cell.classList.remove("picked");
  button.classList.add("picked");
  startDial({
    x: Number(button.dataset.x),
    y: Number(button.dataset.y),
  });
}

function startDial(location) {
  cancelAnimationFrame(dialTimer);
  dialing = true;
  dialPosition = 0;
  const dial = DIALS[pitchType];
  const started = performance.now();
  $("stop").disabled = false;
  $("call").textContent = "Stop the dial";
  const frame = (now) => {
    dialPosition = Math.min(1, (now - started) / dial.ms);
    moveNeedle(dialPosition);
    if (dialPosition >= 1) release(location, null);
    else dialTimer = requestAnimationFrame(frame);
  };
  dialTimer = requestAnimationFrame(frame);
  $("stop").onclick = () => release(location, dialPosition);
}

function release(location, position) {
  if (resolving) return;
  resolving = true;
  dialing = false;
  cancelAnimationFrame(dialTimer);
  $("stop").disabled = true;
  const graded = gradeDial(pitchType, position);
  const before = outing;
  const step = resolvePitch(
    outing,
    currentBatter(team, outing),
    { type: pitchType, location, error: graded.error, late: graded.late },
    rng,
  );
  outing = step.state;
  const text = callText(step.outcome, before, outing);
  $("call").textContent = text;
  renderScore();
  renderBatter();
  pitchType = null;
  renderPitches();
  window.setTimeout(() => finishPitch(text), 700);
}

function callText(outcome, before, after) {
  if ((outcome === "called-strike" || outcome === "swinging-strike") && after.outs > before.outs) {
    return "Strikeout";
  }
  if (outcome === "ball" && after.walks > before.walks) return "Walk";
  return LABELS[outcome] ?? "Pitch";
}

function finishPitch() {
  resolving = false;
  if (outing.hooked) {
    $("call").textContent = "Here comes the manager";
    runScene("hook", () => showResult());
    return;
  }
  if (outing.finished) {
    showResult();
    return;
  }
  $("call").textContent = "Call a pitch";
  for (const cell of $("zone").children) cell.classList.remove("picked");
}

function showResult() {
  show(result);
  const kicker = $("result-kicker");
  const title = $("result-title");
  const line = $("result-line");
  kicker.textContent = `${team.city} ${team.name}`;
  if (outing.perfect) {
    title.textContent = "Perfect game";
    line.textContent = `${formatInnings(outing.outs)} innings, no hits, no walks.`;
  } else if (outing.hooked) {
    title.textContent = "Pulled";
    line.textContent = `The manager took the ball after ${formatInnings(outing.outs)} innings, ${outing.hits} hits, and ${outing.runs} runs.`;
  } else {
    title.textContent = outing.hits === 0 ? "No hits" : `${outing.hits} hits`;
    line.textContent = `${formatInnings(outing.outs)} innings, ${outing.runs} runs, ${outing.walks} walks. Not a perfect game.`;
  }
}

function startOuting(club) {
  team = club;
  rng = mulberry32((Date.now() ^ (Math.random() * 0x100000000)) >>> 0);
  outing = createOuting(rng);
  pitchType = null;
  resolving = false;
  runScene("intro", () => openGame());
}

function openGame() {
  show(game);
  renderPitcher();
  renderBatter();
  renderScore();
  renderPitches();
  renderZone();
  paintWindow("fastball");
  $("call").textContent = "Call a pitch";
  $("stop").disabled = true;
}

function runScene(mode, onDone) {
  show(scene);
  if (pump) {
    pump.stop();
    pump = null;
  }
  let mix = null;
  if (mode === "intro") {
    mix = createPump(audio());
    pump = mix;
  }
  stopScene = playScene(canvas, {
    mode,
    opponent: `${team.city} ${team.name}`,
    audio: mix,
    onDone: () => {
      stopScene = null;
      onDone();
    },
  });
}

$("skip").addEventListener("click", () => {
  if (stopScene) stopScene();
});

$("again").addEventListener("click", () => {
  show(menu);
});

document.addEventListener("keydown", (event) => {
  if (game.hidden) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < pitcher.pitches.length) {
    choosePitch(pitcher.pitches[index].id);
  }
  if (event.code === "Space" && !$("stop").disabled) {
    event.preventDefault();
    $("stop").click();
  }
});

renderTeams();

const params = new URLSearchParams(location.search);
const preview = params.get("preview");
if (preview === "mound") {
  team = teamById(params.get("team") || "otters");
  outing = createOuting(mulberry32(7));
  openGame();
} else if (preview === "intro" || preview === "hook") {
  team = teamById("otters");
  outing = createOuting(mulberry32(7));
  if (preview === "hook") {
    outing = { ...outing, hits: 11, runs: 4, outs: 12, hooked: true, finished: true };
  }
  const at = params.get("at");
  if (at != null) {
    show(scene);
    playScene(canvas, {
      mode: preview,
      opponent: `${team.city} ${team.name}`,
      still: Number(at),
      onDone() {},
    });
  } else {
    runScene(preview, () => {
      if (preview === "hook") showResult();
      else openGame();
    });
  }
}
