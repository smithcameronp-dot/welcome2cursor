function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sample(keys, t) {
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1][0] < t) i += 1;
  const a = keys[i];
  const b = keys[Math.min(keys.length - 1, i + 1)];
  const span = b[0] - a[0] || 1;
  const u = Math.max(0, Math.min(1, (t - a[0]) / span));
  return {
    x: lerp(a[1], b[1], u),
    z: lerp(a[2], b[2], u),
    height: lerp(a[3], b[3], u),
  };
}

export function pitcherPath(t) {
  return sample(
    [
      [0, 148, 112, 0],
      [0.16, 112, 96, 0],
      [0.32, 76, 76, 0],
      [0.44, 50, 50, 0],
      [0.5, 40, 48, 6],
      [0.56, 24, 60, 24],
      [0.64, 14, 61, 0],
      [1, 8, 60, 0],
    ],
    t,
  );
}

function drawPlan(ctx) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 130, 250, 0, Math.PI * 2);
  ctx.clip();
  for (let i = -6; i < 16; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "#1b6b3c" : "#228246";
    ctx.fillRect(-280, i * 26, 560, 26);
  }
  ctx.restore();

  ctx.fillStyle = "#8d5a32";
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(70, 78);
  ctx.lineTo(0, 148);
  ctx.lineTo(-70, 78);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(244,239,230,.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(230, 234);
  ctx.moveTo(0, 4);
  ctx.lineTo(-230, 234);
  ctx.stroke();

  ctx.fillStyle = "#c9854a";
  ctx.beginPath();
  ctx.arc(0, 60, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(-1.2, 57, 2.4, 6);

  for (const base of [
    [64, 64],
    [0, 127],
    [-64, 64],
  ]) {
    ctx.save();
    ctx.translate(base[0], base[1]);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(-4.5, -4.5, 9, 9);
    ctx.restore();
  }

  ctx.fillStyle = "#f7f4ee";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(5, 6);
  ctx.lineTo(0, 9);
  ctx.lineTo(-5, 6);
  ctx.closePath();
  ctx.fill();

  drawDugout(ctx, 132, 96);
  drawDugout(ctx, -132, 96);
}

function drawDugout(ctx, x, z) {
  ctx.fillStyle = "#2a241c";
  ctx.fillRect(x - 28, z - 16, 56, 26);
  ctx.fillStyle = "#14110e";
  ctx.fillRect(x - 24, z - 10, 48, 16);
  ctx.fillStyle = "#6e5a3c";
  ctx.fillRect(x - 30, z - 20, 60, 5);
}

function drawAthlete(ctx, spot, color, leg) {
  const y = spot.z - spot.height;
  ctx.fillStyle = "rgba(0,0,0,.4)";
  ctx.beginPath();
  ctx.ellipse(spot.x, spot.z, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(spot.x, y);
  const swing = Math.sin(leg) * (spot.height > 8 ? 2 : 10);
  ctx.strokeStyle = "#241c16";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(-6 + swing, 18);
  ctx.moveTo(4, 0);
  ctx.lineTo(6 - swing, 18);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(-11, -28, 22, 28);
  ctx.fillStyle = "#efd0b0";
  ctx.beginPath();
  ctx.arc(0, -36, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1f4e79";
  ctx.fillRect(-10, -46, 20, 8);
  ctx.restore();
}

export function drawOverhead(ctx, w, h, angle, spot, leg, trail = []) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#101614";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2 + 10);
  ctx.rotate(angle);
  const zoom = Math.min(w, h) / 300;
  ctx.scale(zoom, zoom);
  ctx.translate(-spot.x, -spot.z);
  drawPlan(ctx);
  ctx.fillStyle = "rgba(244,241,234,.7)";
  for (const ghost of trail) {
    ctx.beginPath();
    ctx.arc(ghost.x, ghost.z, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  drawAthlete(ctx, spot, "#f4f1ea", leg);
  ctx.restore();
}

export function drawMound(ctx, w, h, { walk = 1, manager = null, ballWith = "pitcher", opponent = "" }) {
  ctx.clearRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#1a2230");
  sky.addColorStop(0.42, "#3a4658");
  sky.addColorStop(1, "#1d3a28");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#243044";
  ctx.fillRect(0, h * 0.28, w, h * 0.12);
  for (let i = 0; i < 28; i += 1) {
    ctx.fillStyle = i % 3 === 0 ? "#d7c4a4" : "#8ea0b5";
    ctx.fillRect((i * w) / 28 + 4, h * 0.3, 8, 10);
  }

  ctx.fillStyle = "#6d5838";
  ctx.fillRect(0, h * 0.38, w, 8);
  ctx.fillStyle = "#1e7a42";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.46);
  ctx.lineTo(w, h * 0.46);
  ctx.lineTo(w * 0.82, h);
  ctx.lineTo(w * 0.18, h);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#8d5a32";
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.5);
  ctx.lineTo(w * 0.78, h * 0.78);
  ctx.lineTo(w * 0.5, h * 0.95);
  ctx.lineTo(w * 0.22, h * 0.78);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(244,239,230,.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.52);
  ctx.lineTo(w * 0.9, h * 0.95);
  ctx.moveTo(w * 0.5, h * 0.52);
  ctx.lineTo(w * 0.1, h * 0.95);
  ctx.stroke();

  ctx.fillStyle = "#c9854a";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.74, w * 0.06, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2c241c";
  ctx.fillRect(w * 0.8, h * 0.62, w * 0.16, h * 0.08);
  ctx.fillStyle = "#111";
  ctx.fillRect(w * 0.81, h * 0.635, w * 0.14, h * 0.05);

  const px = lerp(w * 0.66, w * 0.5, walk);
  const py = lerp(h * 0.66, h * 0.73, walk);
  drawFigure(ctx, px, py, 52, "#f4f1ea", "#1f4e79");

  if (manager) {
    ctx.strokeStyle = "rgba(244,241,234,.45)";
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(w * 0.86, h * 0.64);
    ctx.lineTo(manager.x * w, manager.y * h);
    ctx.stroke();
    ctx.setLineDash([]);
    drawFigure(ctx, manager.x * w, manager.y * h, 60, "#ff7a3c", "#1a1408");
  }

  if (opponent) {
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = "600 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(opponent.toUpperCase(), w * 0.5, h * 0.36);
  }

  if (ballWith === "manager" && manager) {
    ctx.fillStyle = "#f7f4ee";
    ctx.beginPath();
    ctx.arc(manager.x * w + 10, manager.y * h - 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFigure(ctx, x, y, size, jersey, cap) {
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.55, size * 0.28, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#241c16";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x - 8, y + size * 0.5);
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 8, y + size * 0.5);
  ctx.stroke();
  ctx.fillStyle = jersey;
  ctx.fillRect(x - size * 0.22, y - size * 0.35, size * 0.44, size * 0.42);
  ctx.fillStyle = "#efd0b0";
  ctx.beginPath();
  ctx.arc(x, y - size * 0.48, size * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cap;
  ctx.fillRect(x - size * 0.18, y - size * 0.66, size * 0.36, size * 0.1);
}

export function managerSpot(t) {
  const u = Math.max(0, Math.min(1, t));
  const ease = u * u * (3 - 2 * u);
  return {
    x: lerp(0.86, 0.56, ease),
    y: lerp(0.64, 0.72, ease),
  };
}

export function drawVignette(ctx, w, h, alpha) {
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, w, h);
}
