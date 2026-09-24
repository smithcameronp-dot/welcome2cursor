import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PCFSoftShadowMap,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from "three";
import { LIGHTING } from "../config";

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    failIfMajorPerformanceCaveat: false,
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = LIGHTING.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  return renderer;
}

export function addLighting(scene: Scene) {
  scene.fog = new Fog(new Color(LIGHTING.fog), LIGHTING.fogNear, LIGHTING.fogFar);
  scene.background = new Color("#9ec0dc");

  const hemi = new HemisphereLight(LIGHTING.hemiSky, LIGHTING.hemiGround, LIGHTING.hemiIntensity);
  const sun = new DirectionalLight(LIGHTING.sunColor, LIGHTING.sunIntensity);
  sun.position.set(LIGHTING.sun.x, LIGHTING.sun.y, LIGHTING.sun.z);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -55;
  sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -55;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 160;
  sun.shadow.bias = -0.00025;
  const fill = new DirectionalLight("#b9d3ee", 0.28);
  fill.position.set(24, 10, -16);
  scene.add(hemi, sun, fill);
  return { sun, hemi };
}
