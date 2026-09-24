import * as THREE from "../vendor/three.module.js";

function canvas(w, h, paint) {
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  paint(el.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(el);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function rand(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const CLOTHES = [
  "#d9cbb8",
  "#8ea0b5",
  "#f4f1ea",
  "#5c6b7a",
  "#2f6f62",
  "#c45c5c",
  "#1c3a66",
  "#e8d5a3",
  "#6b3fa0",
  "#2a2a2a",
  "#c97b3a",
  "#7aa3c4",
  "#e7e7e7",
  "#4a6b3c",
  "#9b2f2f",
  "#f2d27a",
];
const SKIN = ["#f1d0b0", "#e2b48a", "#c48a62", "#8d5a3c", "#5c3a28", "#d7b08a"];

function paintCrowd(ctx, x0, y0, x1, y1, scale, seed) {
  ctx.fillStyle = "#3b4652";
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const rows = Math.max(1, Math.floor((y1 - y0) / scale));
  const cols = Math.max(1, Math.floor((x1 - x0) / (scale * 0.62)));
  for (let row = 0; row < rows; row += 1) {
    const aisle = row % 9 === 8;
    if (aisle) {
      ctx.fillStyle = "#2c343c";
      ctx.fillRect(x0, y0 + row * scale, x1 - x0, scale);
      continue;
    }
    for (let col = 0; col < cols; col += 1) {
      const n = seed + row * 2206 + col * 17;
      if (col % 22 === 0) {
        ctx.fillStyle = "#505862";
        ctx.fillRect(x0 + col * scale * 0.62, y0 + row * scale, scale * 0.4, scale);
        continue;
      }
      if (rand(n) < 0.07) continue;
      const x = x0 + col * scale * 0.62 + (row % 2) * scale * 0.28 + (rand(n + 1) - 0.5) * scale * 0.35;
      const y = y0 + row * scale + (rand(n + 2) - 0.5) * scale * 0.2;
      const cw = scale * (0.38 + rand(n + 3) * 0.28);
      const ch = scale * (0.58 + rand(n + 4) * 0.22);
      ctx.fillStyle = CLOTHES[Math.floor(rand(n + 5) * CLOTHES.length)];
      ctx.fillRect(x, y, cw, ch);
      ctx.fillStyle = SKIN[Math.floor(rand(n + 6) * SKIN.length)];
      ctx.beginPath();
      ctx.arc(x + cw * 0.5, y - scale * 0.06, scale * (0.12 + rand(n + 7) * 0.06), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function speckle(ctx, w, h, amount) {
  const data = ctx.getImageData(0, 0, w, h);
  const pix = data.data;
  for (let i = 0; i < pix.length; i += 4) {
    const n = ((i * 13) % 97) / 97;
    const d = (n - 0.5) * amount;
    pix[i] = Math.max(0, Math.min(255, pix[i] + d));
    pix[i + 1] = Math.max(0, Math.min(255, pix[i + 1] + d));
    pix[i + 2] = Math.max(0, Math.min(255, pix[i + 2] + d));
  }
  ctx.putImageData(data, 0, 0);
}

export function grassTex() {
  return canvas(512, 512, (ctx, w, h) => {
    for (let y = 0; y < h; y += 1) {
      ctx.fillStyle = Math.floor(y / 28) % 2 ? "#2f8d40" : "#257536";
      ctx.fillRect(0, y, w, 1);
    }
    for (let i = 0; i < 22000; i += 1) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? "#3aa34c" : "#1e5f2c";
      ctx.fillRect(x, y, 1.4, 3.2);
    }
  });
}

export function dirtTex() {
  return canvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#c48a4a";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 16000; i += 1) {
      ctx.fillStyle = `rgba(${140 + Math.random() * 80},${80 + Math.random() * 55},${36 + Math.random() * 32},${0.38})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function crowdTex() {
  return canvas(1024, 1024, (ctx, w, h) => {
    paintCrowd(ctx, 0, 0, w, h, 9, 11);
    speckle(ctx, w, h, 18);
  });
}

export function stadiumTex() {
  return canvas(2048, 1024, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 170);
    sky.addColorStop(0, "#6eb4ea");
    sky.addColorStop(1, "#cfe6f8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, 170);

    ctx.fillStyle = "#d7e2ea";
    ctx.fillRect(0, 164, w, 28);
    ctx.fillStyle = "#9aa8b4";
    ctx.fillRect(0, 186, w, 6);

    paintCrowd(ctx, 0, 192, w, 430, 7, 3);
    ctx.fillStyle = "#cfd8e0";
    ctx.fillRect(0, 424, w, 22);
    ctx.fillStyle = "#1a365c";
    ctx.fillRect(0, 438, w, 10);
    ctx.fillStyle = "#f4f1ea";
    ctx.font = "700 28px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SAN ANTONIO  ·  GULLS  ·  BULLPEN SAVE", w / 2, 446);

    paintCrowd(ctx, 0, 448, w, 880, 8, 41);
    speckle(ctx, w, h, 14);

    ctx.fillStyle = "#1a365c";
    ctx.fillRect(0, 872, w, 152);
    ctx.fillStyle = "#f4f1ea";
    for (let x = 40; x < w; x += 28) {
      ctx.fillRect(x, 884, 4, 8);
    }
    ctx.font = "900 92px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GULLS", w / 2, 980);
  });
}

export function skyTex() {
  return canvas(8, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#4f9ad8");
    g.addColorStop(0.55, "#8ec4ee");
    g.addColorStop(1, "#d6ecfb");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function jerseyTex({ word = "GULLS", number = "21", color = "#f4f6f8", ink = "#1a365c" }) {
  return canvas(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ink;
    ctx.font = "900 68px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(word, w / 2, 150);
    ctx.font = "900 200px Arial, sans-serif";
    ctx.fillText(number, w / 2, 390);
  });
}

function capTex(ink) {
  return canvas(128, 128, (ctx, w, h) => {
    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f4f1ea";
    ctx.font = "900 88px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("G", w / 2, h / 2 + 6);
  });
}

function std(color, extras = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04, ...extras });
}

function limb(r, h, color, segs = 10) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 4, segs), std(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function ballplayer({
  jersey = "#f4f6f8",
  pants = "#f4f6f8",
  cap = "#1a365c",
  sleeve = "#1a365c",
  skin = "#e2b48a",
  word = "GULLS",
  number = "21",
  glove = true,
  stance = "idle",
} = {}) {
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.position.y = 0;

  const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.6, 16), std(jersey, { roughness: 0.84 }));
  shirt.position.y = 1.2;
  shirt.scale.set(1.18, 1, 0.72);
  shirt.castShadow = true;

  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.4),
    new THREE.MeshStandardMaterial({
      map: jerseyTex({ word, number, color: jersey, ink: cap }),
      transparent: true,
      depthWrite: false,
      roughness: 0.88,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  decal.position.set(0, 1.18, -0.16);
  decal.rotation.y = Math.PI;

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 16, Math.PI), std(jersey));
  collar.position.set(0, 1.5, -0.04);
  collar.rotation.x = Math.PI / 2;

  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.18, 0.24, 12), std(pants, { roughness: 0.86 }));
  hips.position.y = 0.84;
  hips.castShadow = true;
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 12), std("#1a1408"));
  belt.position.y = 0.95;

  const lLeg = limb(0.075, 0.44, pants);
  lLeg.position.set(-0.1, 0.48, -0.06);
  const rLeg = limb(0.075, 0.44, pants);
  rLeg.position.set(0.1, 0.48, 0.08);
  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.075, 0.24), std("#141414"));
  lShoe.position.set(-0.1, 0.045, -0.04);
  const rShoe = lShoe.clone();
  rShoe.position.set(0.1, 0.045, 0.1);

  const lArm = limb(0.052, 0.4, sleeve);
  lArm.position.set(0.32, 1.22, -0.05);
  const rArm = limb(0.052, 0.4, sleeve);
  rArm.position.set(-0.32, 1.22, 0.06);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.1, 10), std(skin, { roughness: 0.48 }));
  neck.position.y = 1.54;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 16), std(skin, { roughness: 0.46 }));
  head.position.y = 1.68;
  head.scale.set(0.9, 1.06, 0.88);
  head.castShadow = true;

  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), std(skin));
  earL.position.set(-0.11, 1.67, 0);
  const earR = earL.clone();
  earR.position.x = 0.11;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), std(skin));
  nose.position.set(0, 1.66, -0.11);
  const eyeWhite = std("#f4f1ea", { roughness: 0.3 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeWhite);
  eyeL.position.set(-0.038, 1.69, -0.1);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.038;
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), std("#1a120c"));
  iris.position.set(-0.038, 1.69, -0.116);
  const irisR = iris.clone();
  irisR.position.x = 0.038;

  const capMat = std(cap, { roughness: 0.6 });
  const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.132, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
  capCrown.position.y = 1.75;
  const bill = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.15), capMat);
  bill.position.set(0, 1.745, -0.15);
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.1),
    new THREE.MeshStandardMaterial({ map: capTex(cap), roughness: 0.55, transparent: false }),
  );
  logo.position.set(0, 1.74, -0.14);
  logo.rotation.y = Math.PI;

  if (number) {
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.34),
      new THREE.MeshStandardMaterial({
        map: jerseyTex({ word: "", number, color: jersey, ink: cap }),
        transparent: true,
        depthWrite: false,
        roughness: 0.88,
      }),
    );
    back.position.set(0, 1.22, 0.16);
    torso.add(back);
  }

  torso.add(shirt, decal, collar);
  root.add(
    torso,
    hips,
    belt,
    lLeg,
    rLeg,
    lShoe,
    rShoe,
    lArm,
    rArm,
    neck,
    head,
    earL,
    earR,
    nose,
    eyeL,
    eyeR,
    iris,
    irisR,
    capCrown,
    bill,
    logo,
  );

  if (glove) {
    const mitt = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), std("#5a3a24", { roughness: 0.92 }));
    mitt.scale.set(1.05, 0.82, 1.2);
    mitt.castShadow = true;
    lArm.add(mitt);
    mitt.position.set(0, -0.28, 0.02);
    root.userData.glove = mitt;
  }

  if (stance === "stretch") {
    lLeg.rotation.x = -0.22;
    rLeg.rotation.x = 0.16;
    lArm.rotation.set(-0.85, 0.05, 0.28);
    rArm.rotation.set(-0.3, 0.45, -0.2);
    torso.rotation.y = 0.08;
    root.rotation.y = 0.22;
  } else {
    lArm.rotation.z = -0.16;
    rArm.rotation.z = 0.2;
    rArm.rotation.x = 0.28;
  }

  root.userData.rArm = rArm;
  root.userData.lArm = lArm;
  root.userData.lLeg = lLeg;
  root.userData.rLeg = rLeg;
  root.userData.torso = torso;
  root.userData.pose = {
    rArmX: rArm.rotation.x,
    lArmX: lArm.rotation.x,
    rArmZ: rArm.rotation.z,
    lArmZ: lArm.rotation.z,
  };
  return root;
}

export function idle(player, t) {
  if (!player?.userData.rArm) return;
  const s = Math.sin(t * 1.7);
  const pose = player.userData.pose;
  player.userData.rArm.rotation.x = pose.rArmX + s * 0.05;
  player.userData.lArm.rotation.x = pose.lArmX - s * 0.04;
  if (player.userData.torso) player.userData.torso.position.y = s * 0.008;
}

export function walk(player, t) {
  if (!player?.userData.lLeg) return;
  const s = Math.sin(t * 10);
  player.userData.lLeg.rotation.x = s * 0.45;
  player.userData.rLeg.rotation.x = -s * 0.45;
  player.userData.lArm.rotation.x = -s * 0.35;
  player.userData.rArm.rotation.x = s * 0.35;
}
