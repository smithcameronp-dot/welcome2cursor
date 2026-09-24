import { Clock, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import { CAMERA } from "../config";
import { gameplayRig } from "./camera";
import { addLighting, createRenderer } from "./lighting";
import { buildStadium, waveFlags } from "./stadium";

export type ParkView = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  resize: () => void;
  dispose: () => void;
};

export function createParkView(canvas: HTMLCanvasElement): ParkView {
  const renderer = createRenderer(canvas);
  const scene = new Scene();
  const rig = gameplayRig();
  const camera = new PerspectiveCamera(rig.fov, 16 / 9, 0.12, 400);
  camera.position.set(rig.pos.x, rig.pos.y, rig.pos.z);
  camera.lookAt(rig.look.x, rig.look.y, rig.look.z);

  addLighting(scene);
  buildStadium(scene);

  const clock = new Clock();
  const base = camera.position.clone();
  const look = new Vector3(rig.look.x, rig.look.y, rig.look.z);
  let raf = 0;

  function resize() {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    const t = clock.elapsedTime;
    const px = (CAMERA.handheldPx / 1080) * 0.012;
    camera.position.set(base.x + Math.sin(t * 0.7) * px, base.y + Math.cos(t * 0.55) * px * 0.6, base.z);
    camera.lookAt(look);
    waveFlags(scene, t);
    renderer.render(scene, camera);
  }

  resize();
  tick();
  window.addEventListener("resize", resize);

  return {
    renderer,
    scene,
    camera,
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}

export { gameplayRig } from "./camera";
export { wallRadius } from "./camera";
