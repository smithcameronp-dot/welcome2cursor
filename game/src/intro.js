import { drawMound, drawOverhead, drawVignette, managerSpot, pitcherPath } from "./draw.js";

const INTRO_MS = 9000;
const HOOK_MS = 5200;

function fit(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, rect.width);
  const h = Math.max(1, rect.height);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function smooth(t) {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
}

export function playScene(canvas, { mode, opponent, onDone, onCam, audio, still = null }) {
  if (still != null) {
    const { ctx, w, h } = fit(canvas);
    const t = Math.max(0, Math.min(1, still));
    if (mode === "intro") drawIntro(ctx, w, h, t, onCam, opponent);
    else drawHook(ctx, w, h, t, opponent);
    return () => {};
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduced ? 500 : mode === "intro" ? INTRO_MS : HOOK_MS;
  const started = performance.now();
  let frame = 0;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    if (audio) audio.fade();
    onDone();
  };

  const tick = (now) => {
    const t = Math.min(1, (now - started) / duration);
    const { ctx, w, h } = fit(canvas);
    if (mode === "intro") drawIntro(ctx, w, h, reduced ? 1 : t, onCam, opponent);
    else drawHook(ctx, w, h, reduced ? 1 : t, opponent);
    if (t < 1) frame = requestAnimationFrame(tick);
    else finish();
  };

  frame = requestAnimationFrame(tick);
  return finish;
}

function drawIntro(ctx, w, h, t, onCam, opponent) {
  const cam = t < 0.42 ? "CAM 1" : t < 0.7 ? "CAM 2" : "CAM 3";
  if (onCam) onCam(cam);

  let spin = t * Math.PI * 2.4;
  if (t > 0.42) spin += Math.PI;
  const spot = pitcherPath(Math.min(t, 0.7));
  const leg = t < 0.48 || t > 0.64 ? t * 46 : 0;
  const trail = [0.08, 0.04]
    .map((back) => pitcherPath(Math.max(0, Math.min(t, 0.7) - back)))
    .filter((ghost) => ghost.x !== spot.x || ghost.z !== spot.z);
  drawOverhead(ctx, w, h, spin, spot, leg, trail);

  const moundAlpha = smooth((t - 0.66) / 0.14);
  if (moundAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = moundAlpha;
    const walk = smooth((t - 0.78) / 0.22);
    drawMound(ctx, w, h, { walk, opponent });
    ctx.restore();
  }

  drawVignette(ctx, w, h, t < 0.08 ? 1 - t / 0.08 : 0);
  paintBug(ctx, w, cam, "COLE BRANT", "runs out for the Gulls");
}

function drawHook(ctx, w, h, t, opponent) {
  const spot = managerSpot(t);
  const arrived = t > 0.78;
  drawMound(ctx, w, h, {
    walk: 1,
    manager: spot,
    ballWith: arrived ? "manager" : "pitcher",
    opponent,
  });
  paintBug(ctx, w, "CAM 3", "MANAGER", arrived ? "takes the ball" : "is on his way");
}

function paintBug(ctx, w, cam, title, line) {
  ctx.fillStyle = "rgba(8,10,14,.72)";
  ctx.fillRect(16, 16, 92, 28);
  ctx.fillStyle = "#f4f1ea";
  ctx.font = "700 14px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(cam, 28, 35);
  ctx.fillStyle = "rgba(8,10,14,.72)";
  ctx.fillRect(16, 52, Math.min(280, w - 32), 44);
  ctx.fillStyle = "#f4f1ea";
  ctx.font = "700 16px sans-serif";
  ctx.fillText(title, 28, 70);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "rgba(244,241,234,.8)";
  ctx.fillText(line, 28, 88);
}
