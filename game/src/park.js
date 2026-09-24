import * as THREE from "../vendor/three.module.js";

const MOUND_Z = 18.4;
const FIRST = 27.4;

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.04, ...extras });
}

function box(w, h, d, color, extras) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extras));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(rTop, rBot, h, color, segs = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), mat(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function figure({ jersey = "#f4f1ea", pants = "#1c3a66", cap = "#12325a", skin = "#efd0b0", visor = "#0d1b2a" }) {
  const root = new THREE.Group();
  const legs = box(0.28, 0.7, 0.2, pants);
  legs.position.y = 0.35;
  const torso = box(0.38, 0.55, 0.24, jersey);
  torso.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), mat(skin, { roughness: 0.55 }));
  head.position.y = 1.38;
  head.castShadow = true;
  const hat = cyl(0.17, 0.17, 0.1, cap, 12);
  hat.position.y = 1.5;
  const bill = box(0.18, 0.03, 0.16, visor);
  bill.position.set(0, 1.47, -0.14);
  const glove = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat("#6b4a2a"));
  glove.position.set(0.28, 0.95, 0.08);
  root.add(legs, torso, head, hat, bill, glove);
  root.userData.glove = glove;
  return root;
}

function lerp3(a, b, t) {
  return new THREE.Vector3().lerpVectors(a, b, t);
}

function smooth(t) {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
}

export function createPark(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, failIfMajorPerformanceCaveat: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#6ea6d4");
  scene.fog = new THREE.Fog("#8eb7d4", 40, 160);

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 400);
  const look = new THREE.Vector3(0, 1.05, 1.2);

  const hemi = new THREE.HemisphereLight("#d7ecff", "#3d5a32", 0.95);
  const sun = new THREE.DirectionalLight("#fff3d6", 1.35);
  sun.position.set(-24, 36, -8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  scene.add(hemi, sun);

  buildField(scene);
  const pitcher = figure({ jersey: "#f4f1ea", pants: "#1c3a66", cap: "#12325a" });
  const batter = figure({ jersey: "#cfd3d8", pants: "#2c2c32", cap: "#8a3a3a" });
  const catcher = figure({ jersey: "#1c3a66", pants: "#1c3a66", cap: "#12325a" });
  const umpire = figure({ jersey: "#2a241c", pants: "#1a1814", cap: "#111", visor: "#111" });
  const manager = figure({ jersey: "#ff7a3c", pants: "#1a1408", cap: "#1a1408" });
  pitcher.position.set(0, 0.45, MOUND_Z);
  pitcher.rotation.y = 0;
  batter.position.set(0.85, 0, 0.55);
  batter.rotation.y = Math.PI;
  catcher.position.set(0, 0, -1.35);
  catcher.rotation.y = Math.PI;
  umpire.position.set(0.15, 0, -2.15);
  umpire.rotation.y = Math.PI;
  manager.position.set(16.4, 0, 12.4);
  manager.visible = false;
  scene.add(pitcher, batter, catcher, umpire, manager);

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), mat("#f7f4ee", { roughness: 0.4 }));
  ball.castShadow = true;
  ball.visible = false;
  scene.add(ball);

  const zone = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.7),
    new THREE.MeshBasicMaterial({ color: "#e2b15a", transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
  );
  zone.position.set(0, 0.95, 0.15);
  scene.add(zone);

  const pitchCam = { pos: new THREE.Vector3(1.55, 2.25, 27.8), look: new THREE.Vector3(0, 0.92, 0.35) };
  camera.position.copy(pitchCam.pos);
  camera.lookAt(pitchCam.look);

  let raf = 0;
  let anim = null;
  let cancelPlay = null;
  const clock = new THREE.Clock();

  function resize() {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta());
    if (anim) anim(dt, clock.elapsedTime);
    renderer.render(scene, camera);
  }

  function play(duration, step) {
    return new Promise((resolve) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ms = reduced ? 80 : duration;
      const t0 = performance.now();
      const finish = () => {
        if (cancelPlay !== finish) return;
        cancelPlay = null;
        anim = null;
        resolve();
      };
      cancelPlay = finish;
      anim = () => {
        const t = Math.min(1, (performance.now() - t0) / ms);
        step(t);
        if (t >= 1) finish();
      };
    });
  }

  resize();
  tick();
  window.addEventListener("resize", resize);

  return {
    canvas,
    resize,
    setBatterHand(hand) {
      batter.position.x = hand === "L" ? -0.85 : 0.85;
    },
    setClubColor(hex) {
      batter.children[2].material.color.set(hex);
    },
    async playIntro({ onCam } = {}) {
      manager.visible = false;
      ball.visible = false;
      pitcher.visible = true;
      const dugout = new THREE.Vector3(16.2, 0, 12.2);
      const jump = new THREE.Vector3(9.4, 0, 16.6);
      const rubber = new THREE.Vector3(0, 0.45, MOUND_Z);
      pitcher.position.copy(dugout);
      await play(9000, (t) => {
        if (onCam) onCam(t < 0.38 ? "CAM 1" : t < 0.68 ? "CAM 2" : "CAM 3");
        const spin = t * Math.PI * 2.15;
        const radius = 34 - t * 10;
        camera.position.set(Math.sin(spin) * radius, 18 - t * 8, Math.cos(spin) * radius + 10);
        camera.lookAt(0, 0.4, 12);
        if (t < 0.48) {
          pitcher.position.lerpVectors(dugout, jump, smooth(t / 0.48));
          pitcher.position.y = 0;
        } else if (t < 0.62) {
          const u = smooth((t - 0.48) / 0.14);
          pitcher.position.lerpVectors(jump, new THREE.Vector3(6.2, 0, 17.4), u);
          pitcher.position.y = Math.sin(u * Math.PI) * 1.35;
        } else {
          const u = smooth((t - 0.62) / 0.38);
          pitcher.position.lerpVectors(new THREE.Vector3(6.2, 0.45, 17.4), rubber, u);
          pitcher.rotation.y = 0.5 - u * 0.5;
          camera.position.lerpVectors(
            new THREE.Vector3(Math.sin(spin) * radius, 18 - t * 8, Math.cos(spin) * radius + 10),
            pitchCam.pos,
            u,
          );
          const lookNow = lerp3(new THREE.Vector3(0, 0.4, 12), pitchCam.look, u);
          camera.lookAt(lookNow);
        }
      });
      pitcher.position.copy(rubber);
      pitcher.rotation.y = 0;
      camera.position.copy(pitchCam.pos);
      camera.lookAt(pitchCam.look);
    },
    setPitchingView() {
      manager.visible = false;
      ball.visible = false;
      pitcher.position.set(0, 0.45, MOUND_Z);
      pitcher.rotation.y = 0;
      camera.position.copy(pitchCam.pos);
      camera.lookAt(pitchCam.look);
    },
    async throwPitch({ type, location, error, late, outcome, bats }) {
      const start = new THREE.Vector3(-0.22, 1.32, MOUND_Z - 0.55);
      const end = zonePoint(location, error, late, bats);
      const mid = breakPoint(start, end, type, late);
      ball.visible = true;
      ball.position.copy(start);
      pitcher.rotation.x = -0.18;
      await play(speedMs(type, error), (t) => {
        const a = lerp3(start, mid, t);
        const b = lerp3(mid, end, t);
        ball.position.lerpVectors(a, b, t);
        ball.position.y += Math.sin(t * Math.PI) * 0.08;
        if (swings(outcome) && t > 0.72) batter.rotation.y = bats === "L" ? 0.7 : -0.7;
      });
      pitcher.rotation.x = 0;
      await play(420, (t) => {
        if (outcome === "groundout") ball.position.y = 0.08;
        if (outcome === "flyout" || outcome === "homer" || outcome === "double" || outcome === "single") {
          ball.position.y = 1.2 + t * (outcome === "homer" ? 14 : 6);
          ball.position.z += t * (outcome === "homer" ? 40 : 18);
        }
        if (outcome === "foul") {
          ball.position.x += (bats === "L" ? -1 : 1) * t * 8;
          ball.position.y += t * 5;
        }
      });
      batter.rotation.y = 0;
      ball.visible = false;
    },
    async playHook() {
      manager.visible = true;
      manager.position.set(16.4, 0, 12.4);
      const start = manager.position.clone();
      const end = new THREE.Vector3(1.1, 0.45, MOUND_Z + 0.35);
      camera.position.set(8.5, 4.2, 28);
      camera.lookAt(0, 0.8, MOUND_Z);
      await play(4800, (t) => {
        manager.position.lerpVectors(start, end, smooth(t));
        manager.lookAt(pitcher.position);
        camera.position.lerp(new THREE.Vector3(4.2, 2.4, 24.5), 0.04);
        camera.lookAt(0.4, 1.1, MOUND_Z);
      });
    },
    seekIntro(t) {
      const u = Math.max(0, Math.min(1, t));
      const dugout = new THREE.Vector3(16.2, 0, 12.2);
      const jump = new THREE.Vector3(9.4, 0, 16.6);
      const rubber = new THREE.Vector3(0, 0.45, MOUND_Z);
      const spin = u * Math.PI * 2.15;
      const radius = 34 - u * 10;
      if (u < 0.48) {
        pitcher.position.lerpVectors(dugout, jump, smooth(u / 0.48));
        pitcher.position.y = 0;
        camera.position.set(Math.sin(spin) * radius, 18 - u * 8, Math.cos(spin) * radius + 10);
        camera.lookAt(0, 0.4, 12);
      } else if (u < 0.62) {
        const j = smooth((u - 0.48) / 0.14);
        pitcher.position.lerpVectors(jump, new THREE.Vector3(6.2, 0, 17.4), j);
        pitcher.position.y = Math.sin(j * Math.PI) * 1.35;
        camera.position.set(Math.sin(spin) * radius, 18 - u * 8, Math.cos(spin) * radius + 10);
        camera.lookAt(0, 0.4, 12);
      } else {
        const w = smooth((u - 0.62) / 0.38);
        pitcher.position.lerpVectors(new THREE.Vector3(6.2, 0.45, 17.4), rubber, w);
        pitcher.rotation.y = 0.5 - w * 0.5;
        camera.position.lerpVectors(
          new THREE.Vector3(Math.sin(spin) * radius, 18 - u * 8, Math.cos(spin) * radius + 10),
          pitchCam.pos,
          w,
        );
        camera.lookAt(lerp3(new THREE.Vector3(0, 0.4, 12), pitchCam.look, w));
      }
    },
    seekHook(t) {
      const u = Math.max(0, Math.min(1, t));
      manager.visible = true;
      const start = new THREE.Vector3(16.4, 0, 12.4);
      const end = new THREE.Vector3(1.1, 0.45, MOUND_Z + 0.35);
      manager.position.lerpVectors(start, end, smooth(u));
      pitcher.position.set(0, 0.45, MOUND_Z);
      camera.position.set(8.5 - u * 4.3, 4.2 - u * 1.8, 28 - u * 3.5);
      camera.lookAt(0.4, 1.1, MOUND_Z);
    },
    skip() {
      if (cancelPlay) cancelPlay();
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}

function zonePoint(location, error, late, bats) {
  const missY = (late ? 0.55 : -0.7) * error;
  const missX = (late ? 0.12 : -0.28) * error;
  const x = (location?.x ?? 0) * 0.22 + missX;
  const y = 0.95 + (location?.y ?? 0) * 0.22 + missY;
  return new THREE.Vector3(x, Math.max(0.15, y), 0.2);
}

function breakPoint(start, end, type, late) {
  const mid = lerp3(start, end, 0.55);
  if (type === "curve") mid.y -= late ? 0.15 : 1.1;
  if (type === "slider") mid.x += 0.55;
  if (type === "sinker") mid.y -= 0.45;
  if (type === "changeup") {
    mid.y -= 0.35;
    mid.z += 1.2;
  }
  if (type === "fastball") mid.y += 0.18;
  return mid;
}

function speedMs(type, error) {
  const base = { fastball: 520, sinker: 620, slider: 700, curve: 880, changeup: 940 }[type] ?? 640;
  return base + error * 180;
}

function swings(outcome) {
  return [
    "swinging-strike",
    "foul",
    "groundout",
    "flyout",
    "single",
    "double",
    "homer",
  ].includes(outcome);
}

function buildField(scene) {
  const grass = new THREE.Mesh(new THREE.CircleGeometry(95, 64), mat("#1f7a43"));
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  const dirtShape = new THREE.Shape();
  dirtShape.moveTo(0, 0);
  dirtShape.lineTo(22, 22);
  dirtShape.lineTo(0, 38.8);
  dirtShape.lineTo(-22, 22);
  dirtShape.closePath();
  const dirt = new THREE.Mesh(new THREE.ShapeGeometry(dirtShape), mat("#8d5a32"));
  dirt.rotation.x = Math.PI / 2;
  dirt.position.y = 0.02;
  dirt.material.side = THREE.DoubleSide;
  dirt.receiveShadow = true;
  scene.add(dirt);

  const mound = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 0.45, 24), mat("#c9854a"));
  mound.position.set(0, 0.22, MOUND_Z);
  mound.receiveShadow = true;
  scene.add(mound);
  const rubber = box(0.6, 0.04, 0.14, "#f4efe6");
  rubber.position.set(0, 0.47, MOUND_Z);
  scene.add(rubber);

  const plate = box(0.43, 0.04, 0.43, "#f7f4ee");
  plate.position.set(0, 0.03, 0);
  plate.rotation.y = Math.PI / 4;
  scene.add(plate);

  for (const [x, z] of [
    [FIRST, 18.4],
    [0, 36.8],
    [-FIRST, 18.4],
  ]) {
    const base = box(0.38, 0.05, 0.38, "#f7f4ee");
    base.position.set(x, 0.04, z);
    scene.add(base);
  }

  const chalk = mat("#f4efe6");
  const lineGeo = new THREE.BoxGeometry(0.08, 0.02, 55);
  const left = new THREE.Mesh(lineGeo, chalk);
  left.position.set(-19.4, 0.03, 19.4);
  left.rotation.y = Math.PI / 4;
  const right = new THREE.Mesh(lineGeo, chalk);
  right.position.set(19.4, 0.03, 19.4);
  right.rotation.y = -Math.PI / 4;
  scene.add(left, right);

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(78, 78, 3.2, 48, 1, true),
    mat("#6d5838"),
  );
  wall.position.y = 1.6;
  scene.add(wall);

  const stands = new THREE.Mesh(
    new THREE.CylinderGeometry(88, 80, 12, 48, 1, true),
    mat("#243044"),
  );
  stands.position.y = 8;
  scene.add(stands);

  const crowdGeo = new THREE.BoxGeometry(0.45, 0.85, 0.4);
  const crowdMat = new THREE.MeshStandardMaterial({ color: "#d7c4a4", roughness: 0.9 });
  const crowd = new THREE.InstancedMesh(crowdGeo, crowdMat, 420);
  const dummy = new THREE.Object3D();
  let i = 0;
  for (let ring = 0; ring < 6; ring += 1) {
    const r = 80 + ring * 1.15;
    const count = 52 + ring * 6;
    for (let n = 0; n < count && i < 420; n += 1) {
      const a = (n / count) * Math.PI * 1.65 + 0.55;
      dummy.position.set(Math.sin(a) * r, 2.6 + ring * 1.35, Math.cos(a) * r);
      dummy.updateMatrix();
      crowd.setMatrixAt(i, dummy.matrix);
      i += 1;
    }
  }
  crowd.instanceMatrix.needsUpdate = true;
  scene.add(crowd);

  const dug = box(6.4, 1.4, 2.2, "#2a241c");
  dug.position.set(16.6, 0.7, 12.2);
  const dugRoof = box(6.8, 0.18, 2.6, "#6e5a3c");
  dugRoof.position.set(16.6, 1.5, 12.2);
  const dug2 = dug.clone();
  dug2.position.x = -16.6;
  const dugRoof2 = dugRoof.clone();
  dugRoof2.position.x = -16.6;
  scene.add(dug, dugRoof, dug2, dugRoof2);
}
