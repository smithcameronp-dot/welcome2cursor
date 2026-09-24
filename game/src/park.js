import * as THREE from "../vendor/three.module.js";
import { ballplayer, crowdTex, dirtTex, grassTex, idle, skyTex, stadiumTex, walk } from "./look.js";

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

function lerp3(a, b, t) {
  return new THREE.Vector3().lerpVectors(a, b, t);
}

function smooth(t) {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
}

export function createPark(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, failIfMajorPerformanceCaveat: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#c5def0", 90, 240);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(180, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide }),
  );
  scene.add(sky);

  const camera = new THREE.PerspectiveCamera(18, 16 / 9, 0.1, 400);

  const hemi = new THREE.HemisphereLight("#e7f3ff", "#6f7d52", 0.95);
  const sun = new THREE.DirectionalLight("#fff4d8", 2.45);
  sun.position.set(-22, 36, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.bias = -0.0002;
  const fill = new THREE.DirectionalLight("#c5dcf4", 0.7);
  fill.position.set(18, 10, -14);
  const rim = new THREE.DirectionalLight("#fff1c8", 0.35);
  rim.position.set(8, 14, 28);
  scene.add(hemi, sun, fill, rim);

  const { backdrop } = buildField(scene);
  const pitcher = ballplayer({
    jersey: "#f4f6f8",
    pants: "#f4f6f8",
    cap: "#1a365c",
    sleeve: "#1a365c",
    word: "GULLS",
    number: "21",
    stance: "stretch",
  });
  const batter = ballplayer({ jersey: "#e8e4dc", pants: "#2c2c32", cap: "#6b2f2f", sleeve: "#6b2f2f", word: "OTTERS", number: "2", glove: false });
  const catcher = ballplayer({ jersey: "#1a365c", pants: "#1a365c", cap: "#1a365c", sleeve: "#1a365c", word: "GULLS", number: "8" });
  const umpire = ballplayer({ jersey: "#2a241c", pants: "#1a1814", cap: "#111", sleeve: "#2a241c", word: "", number: "", glove: false, skin: "#c9a07a" });
  const manager = ballplayer({ jersey: "#ff7a3c", pants: "#1a1408", cap: "#1a1408", sleeve: "#1a1408", word: "GULLS", number: "", glove: false });
  pitcher.userData.moundYaw = 0.22;
  pitcher.position.set(0, 0.45, MOUND_Z);
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
    new THREE.MeshBasicMaterial({ color: "#e2b15a", transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  );
  zone.position.set(0, 0.95, 0.15);
  scene.add(zone);

  const heroCam = { pos: new THREE.Vector3(-5.8, 0.86, 12.4), look: new THREE.Vector3(0.08, 1.42, 18.55) };
  const pitchCam = { pos: new THREE.Vector3(1.55, 2.25, 27.8), look: new THREE.Vector3(0, 0.92, 0.35) };
  camera.position.copy(heroCam.pos);
  camera.lookAt(heroCam.look);

  let raf = 0;
  let anim = null;
  let cancelPlay = null;
  let moving = false;
  const clock = new THREE.Clock();

  function applyCam(rig) {
    camera.position.copy(rig.pos);
    camera.lookAt(rig.look);
    backdrop.visible = rig === heroCam;
  }

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
    const t = clock.elapsedTime;
    if (anim) anim(dt, t);
    if (!moving) idle(pitcher, t);
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
    async playIntro({ onCam } = {}) {
      manager.visible = false;
      ball.visible = false;
      backdrop.visible = false;
      moving = true;
      const dugout = new THREE.Vector3(16.2, 0, 12.2);
      const jump = new THREE.Vector3(9.4, 0, 16.6);
      const rubber = new THREE.Vector3(0, 0.45, MOUND_Z);
      pitcher.position.copy(dugout);
      await play(9000, (t) => {
        if (onCam) onCam(t < 0.38 ? "CAM 1" : t < 0.68 ? "CAM 2" : "CAM 3");
        const spin = t * Math.PI * 2.15;
        const radius = 34 - t * 10;
        walk(pitcher, t * 12);
        if (t < 0.48) {
          pitcher.position.lerpVectors(dugout, jump, smooth(t / 0.48));
          pitcher.position.y = 0;
          camera.position.set(Math.sin(spin) * radius, 18 - t * 8, Math.cos(spin) * radius + 10);
          camera.lookAt(pitcher.position.x, 1.2, pitcher.position.z);
        } else if (t < 0.62) {
          const u = smooth((t - 0.48) / 0.14);
          pitcher.position.lerpVectors(jump, new THREE.Vector3(6.2, 0, 17.4), u);
          pitcher.position.y = Math.sin(u * Math.PI) * 1.35;
          camera.position.set(Math.sin(spin) * radius, 14 - t * 6, Math.cos(spin) * radius + 8);
          camera.lookAt(pitcher.position.x, 1.2, pitcher.position.z);
        } else {
          const u = smooth((t - 0.62) / 0.38);
          pitcher.position.lerpVectors(new THREE.Vector3(6.2, 0.45, 17.4), rubber, u);
          pitcher.rotation.y = 0.9 - u * (0.9 - (pitcher.userData.moundYaw ?? 0.22));
          camera.position.lerpVectors(
            new THREE.Vector3(Math.sin(spin) * radius, 10, Math.cos(spin) * radius + 8),
            heroCam.pos,
            u,
          );
          camera.lookAt(lerp3(new THREE.Vector3(pitcher.position.x, 1.3, pitcher.position.z), heroCam.look, u));
          backdrop.visible = u > 0.55;
        }
      });
      moving = false;
      pitcher.position.copy(rubber);
      pitcher.rotation.y = pitcher.userData.moundYaw ?? 0.22;
      applyCam(heroCam);
    },
    setPitchingView() {
      manager.visible = false;
      ball.visible = false;
      moving = false;
      pitcher.position.set(0, 0.45, MOUND_Z);
      pitcher.rotation.y = pitcher.userData.moundYaw ?? 0.22;
      applyCam(heroCam);
    },
    setAimView() {
      applyCam(pitchCam);
    },
    async throwPitch({ type, location, error, late, outcome, bats }) {
      applyCam(pitchCam);
      const start = new THREE.Vector3(-0.22, 1.32, MOUND_Z - 0.55);
      const end = zonePoint(location, error, late, bats);
      const mid = breakPoint(start, end, type, late);
      ball.visible = true;
      ball.position.copy(start);
      if (pitcher.userData.rArm) pitcher.userData.rArm.rotation.x = -1.1;
      await play(speedMs(type, error), (t) => {
        const a = lerp3(start, mid, t);
        const b = lerp3(mid, end, t);
        ball.position.lerpVectors(a, b, t);
        ball.position.y += Math.sin(t * Math.PI) * 0.08;
        if (swings(outcome) && t > 0.72) batter.rotation.y = bats === "L" ? 0.7 : -0.7;
      });
      if (pitcher.userData.rArm) {
        pitcher.userData.rArm.rotation.x = pitcher.userData.pose?.rArmX ?? 0.35;
      }
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
      batter.rotation.y = Math.PI;
      ball.visible = false;
      applyCam(heroCam);
    },
    async playHook() {
      backdrop.visible = false;
      manager.visible = true;
      moving = true;
      manager.position.set(16.4, 0, 12.4);
      const start = manager.position.clone();
      const end = new THREE.Vector3(1.1, 0.45, MOUND_Z + 0.35);
      camera.position.set(-2.4, 1.7, 15.8);
      camera.lookAt(0.2, 1.4, MOUND_Z);
      await play(4800, (t) => {
        manager.position.lerpVectors(start, end, smooth(t));
        manager.lookAt(pitcher.position);
        walk(manager, t * 14);
        camera.position.lerp(new THREE.Vector3(-1.8, 1.55, 16.4), 0.03);
        camera.lookAt(0.3, 1.45, MOUND_Z);
      });
      moving = false;
    },
    seekIntro(t) {
      const u = Math.max(0, Math.min(1, t));
      backdrop.visible = u > 0.88;
      const dugout = new THREE.Vector3(16.2, 0, 12.2);
      const jump = new THREE.Vector3(9.4, 0, 16.6);
      const rubber = new THREE.Vector3(0, 0.45, MOUND_Z);
      const spin = u * Math.PI * 2.15;
      const radius = 34 - u * 10;
      if (u < 0.48) {
        pitcher.position.lerpVectors(dugout, jump, smooth(u / 0.48));
        pitcher.position.y = 0;
        camera.position.set(Math.sin(spin) * radius, 18 - u * 8, Math.cos(spin) * radius + 10);
        camera.lookAt(pitcher.position.x, 1.2, pitcher.position.z);
      } else if (u < 0.62) {
        const j = smooth((u - 0.48) / 0.14);
        pitcher.position.lerpVectors(jump, new THREE.Vector3(6.2, 0, 17.4), j);
        pitcher.position.y = Math.sin(j * Math.PI) * 1.35;
        camera.position.set(Math.sin(spin) * radius, 14 - u * 6, Math.cos(spin) * radius + 8);
        camera.lookAt(pitcher.position.x, 1.2, pitcher.position.z);
      } else {
        const w = smooth((u - 0.62) / 0.38);
        pitcher.position.lerpVectors(new THREE.Vector3(6.2, 0.45, 17.4), rubber, w);
        pitcher.rotation.y = 0.9 - w * (0.9 - (pitcher.userData.moundYaw ?? 0.18));
        camera.position.lerpVectors(
          new THREE.Vector3(Math.sin(spin) * radius, 10, Math.cos(spin) * radius + 8),
          heroCam.pos,
          w,
        );
        camera.lookAt(lerp3(new THREE.Vector3(pitcher.position.x, 1.3, pitcher.position.z), heroCam.look, w));
      }
    },
    seekHook(t) {
      const u = Math.max(0, Math.min(1, t));
      backdrop.visible = false;
      manager.visible = true;
      const start = new THREE.Vector3(16.4, 0, 12.4);
      const end = new THREE.Vector3(1.1, 0.45, MOUND_Z + 0.35);
      manager.position.lerpVectors(start, end, smooth(u));
      pitcher.position.set(0, 0.45, MOUND_Z);
      camera.position.set(-2.4 + u * 0.6, 1.7 - u * 0.15, 15.8 + u * 0.6);
      camera.lookAt(0.3, 1.45, MOUND_Z);
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
  return ["swinging-strike", "foul", "groundout", "flyout", "single", "double", "homer"].includes(outcome);
}

function buildField(scene) {
  const grassMap = grassTex();
  grassMap.wrapS = grassMap.wrapT = THREE.RepeatWrapping;
  grassMap.repeat.set(18, 18);
  const grass = new THREE.Mesh(new THREE.CircleGeometry(95, 64), mat("#2f8a3e", { map: grassMap }));
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  const dirtMap = dirtTex();
  dirtMap.wrapS = dirtMap.wrapT = THREE.RepeatWrapping;
  dirtMap.repeat.set(6, 6);
  const dirtShape = new THREE.Shape();
  dirtShape.moveTo(0, 0);
  dirtShape.lineTo(22, 22);
  dirtShape.lineTo(0, 38.8);
  dirtShape.lineTo(-22, 22);
  dirtShape.closePath();
  const dirt = new THREE.Mesh(new THREE.ShapeGeometry(dirtShape), mat("#c48a4a", { map: dirtMap, side: THREE.DoubleSide }));
  dirt.rotation.x = Math.PI / 2;
  dirt.position.y = 0.02;
  dirt.receiveShadow = true;
  scene.add(dirt);

  const mound = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 0.45, 28), mat("#c48a4a", { map: dirtMap }));
  mound.position.set(0, 0.22, MOUND_Z);
  mound.receiveShadow = true;
  scene.add(mound);
  const rubber = box(0.61, 0.03, 0.15, "#f4efe6");
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

  const wall = new THREE.Mesh(new THREE.CylinderGeometry(46, 46, 3.4, 64, 1, true), mat("#1a365c"));
  wall.position.y = 1.7;
  scene.add(wall);

  const crowdMap = crowdTex();
  crowdMap.wrapS = THREE.RepeatWrapping;
  crowdMap.repeat.set(3, 1);
  const stands = new THREE.Mesh(
    new THREE.CylinderGeometry(58, 46, 16, 64, 1, true),
    new THREE.MeshStandardMaterial({ map: crowdMap, roughness: 0.95 }),
  );
  stands.position.y = 10;
  scene.add(stands);

  const deck = new THREE.Mesh(
    new THREE.CylinderGeometry(66, 58, 9, 64, 1, true),
    new THREE.MeshStandardMaterial({ map: crowdMap, roughness: 0.95 }),
  );
  deck.position.y = 21;
  scene.add(deck);

  const fascia = new THREE.Mesh(new THREE.CylinderGeometry(46, 46, 1.4, 64, 1, true), mat("#d9e2ea"));
  fascia.position.y = 3.4;
  scene.add(fascia);

  const stadiumMap = stadiumTex();
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(78, 32), new THREE.MeshBasicMaterial({ map: stadiumMap }));
  backdrop.position.set(2.4, 13.4, 33.5);
  backdrop.rotation.y = Math.PI;
      scene.add(backdrop);
      return { backdrop };

  const dug = box(6.4, 1.4, 2.2, "#2a241c");
  dug.position.set(16.6, 0.7, 12.2);
  const dugRoof = box(6.8, 0.18, 2.6, "#6e5a3c");
  dugRoof.position.set(16.6, 1.5, 12.2);
  const dug2 = dug.clone();
  dug2.position.x = -16.6;
  const dugRoof2 = dugRoof.clone();
  dugRoof2.position.x = -16.6;
  scene.add(dug, dugRoof, dug2, dugRoof2);

  const board = box(16, 7, 0.4, "#1d3a66");
  board.position.set(0, 22, 56);
  scene.add(board);
}
