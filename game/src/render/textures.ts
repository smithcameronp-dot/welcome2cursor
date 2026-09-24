import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

function paint(w: number, h: number, fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): Texture {
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  fn(el.getContext("2d")!, w, h);
  const tex = new CanvasTexture(el);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function grassMap() {
  const tex = paint(512, 512, (ctx, w, h) => {
    for (let y = 0; y < h; y += 1) {
      ctx.fillStyle = Math.floor(y / 28) % 2 ? "#2f8a3c" : "#246f32";
      ctx.fillRect(0, y, w, 1);
    }
    for (let i = 0; i < 18000; i += 1) {
      ctx.fillStyle = Math.random() > 0.5 ? "#3aa14a" : "#1d5c2b";
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 3.2);
    }
  });
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(70, 70);
  return tex;
}

export function dirtMap(packed = false) {
  const tex = paint(512, 512, (ctx, w, h) => {
    ctx.fillStyle = packed ? "#a56b38" : "#c48a4a";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 14000; i += 1) {
      const r = packed ? 120 : 150;
      ctx.fillStyle = `rgba(${r + Math.random() * 50},${70 + Math.random() * 40},${30 + Math.random() * 24},0.4)`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

export function chalkMap() {
  return paint(64, 64, (ctx, w, h) => {
    ctx.fillStyle = "#efe6d4";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(180,170,150,0.35)";
    for (let i = 0; i < 80; i += 1) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 1);
    }
  });
}

export function padMap() {
  return paint(256, 64, (ctx, w, h) => {
    ctx.fillStyle = "#1a365c";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(244,241,234,0.18)";
    for (let x = 8; x < w; x += 18) ctx.fillRect(x, 8, 3, 6);
    ctx.fillStyle = "#e8e0d0";
    ctx.font = "700 28px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GULLS", w / 2, 42);
  });
}

export function netMap() {
  const tex = paint(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(230,230,230,0.45)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= w; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
  });
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(18, 10);
  return tex;
}

export function seatMap() {
  return paint(64, 32, (ctx, w, h) => {
    ctx.fillStyle = "#2a3340";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1c242e";
    ctx.fillRect(0, h - 8, w, 8);
    ctx.fillStyle = "#3b4654";
    ctx.fillRect(4, 4, w - 8, h - 14);
  });
}

export function skyMap() {
  return paint(8, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#3e7eb8");
    g.addColorStop(0.45, "#8eb7dc");
    g.addColorStop(0.72, "#d7b48a");
    g.addColorStop(1, "#f0d2b0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}
