import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  Vector3,
} from "three";
import { FIELD } from "../config";
import { firstBase, secondBase, thirdBase, wallRadius } from "./camera";
import { chalkMap, dirtMap, grassMap, netMap, padMap, seatMap, skyMap } from "./textures";

const std = (color: string, extras: ConstructorParameters<typeof MeshStandardMaterial>[0] = {}) =>
  new MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.03, ...extras });

function box(w: number, h: number, d: number, color: string, extras?: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
  const mesh = new Mesh(new BoxGeometry(w, h, d), std(color, extras));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildStadium(scene: Scene) {
  addSky(scene);
  addGrass(scene);
  addDirt(scene);
  addBases(scene);
  addChalk(scene);
  addWall(scene);
  addDugouts(scene);
  addNet(scene);
  addStands(scene);
  addTowers(scene);
  addScoreboard(scene);
  addFlags(scene);
  addZone(scene);
}

function addSky(scene: Scene) {
  const sky = new Mesh(
    new SphereGeometry(220, 24, 16),
    new MeshBasicMaterial({ map: skyMap(), side: DoubleSide }),
  );
  scene.add(sky);
}

function addGrass(scene: Scene) {
  const grass = new Mesh(new CircleGeometry(150, 72), std("#2f8a3e", { map: grassMap() }));
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);
}

function addDirt(scene: Scene) {
  const packed = dirtMap(true);
  const loose = dirtMap(false);
  const home = new Mesh(new CircleGeometry(4.2, 28), std("#c48a4a", { map: loose }));
  home.rotation.x = -Math.PI / 2;
  home.position.y = 0.02;
  home.receiveShadow = true;

  const mound = new Mesh(new CylinderGeometry(2.7, 3.5, FIELD.moundHeight, 28), std("#a56b38", { map: packed }));
  mound.position.set(0, FIELD.moundHeight / 2, FIELD.moundToPlate);
  mound.receiveShadow = true;

  const rubber = box(0.61, 0.03, 0.152, "#f4efe6");
  rubber.position.set(0, FIELD.moundHeight + 0.02, FIELD.moundToPlate);

  const path = box(0.55, 0.025, FIELD.moundToPlate - 3.2, "#b67a42", { map: packed });
  path.position.set(0, 0.02, FIELD.moundToPlate / 2);
  path.receiveShadow = true;

  const rosin = new Mesh(new SphereGeometry(0.07, 8, 8), std("#c4b49a", { roughness: 0.95 }));
  rosin.scale.set(1, 0.55, 1.15);
  rosin.position.set(0.55, FIELD.moundHeight + 0.04, FIELD.moundToPlate + 0.35);

  scene.add(home, mound, rubber, path, rosin);

  for (const spot of [firstBase(), secondBase(), thirdBase()]) {
    const cut = new Mesh(new CircleGeometry(2.6, 20), std("#c48a4a", { map: loose }));
    cut.rotation.x = -Math.PI / 2;
    cut.position.set(spot.x, 0.02, spot.z);
    cut.receiveShadow = true;
    scene.add(cut);
  }
}

function addBases(scene: Scene) {
  const plate = box(FIELD.plateWidth, 0.04, FIELD.plateWidth, "#f7f4ee");
  plate.position.set(0, 0.03, 0);
  plate.rotation.y = Math.PI / 4;
  scene.add(plate);

  for (const spot of [firstBase(), secondBase(), thirdBase()]) {
    const base = box(0.38, 0.05, 0.38, "#f7f4ee");
    base.position.set(spot.x, 0.04, spot.z);
    scene.add(base);
  }

  const boxMat = std("#efe6d4", { map: chalkMap(), transparent: true, opacity: 0.9 });
  for (const x of [-1.15, 1.15]) {
    const batter = new Mesh(new BoxGeometry(1.22, 0.02, 1.83), boxMat);
    batter.position.set(x, 0.025, 0.2);
    batter.receiveShadow = true;
    scene.add(batter);
  }

  for (const x of [-11.5, 11.5]) {
    const onDeck = new Mesh(new CircleGeometry(0.76, 16), boxMat);
    onDeck.rotation.x = -Math.PI / 2;
    onDeck.position.set(x, 0.03, 8.5);
    scene.add(onDeck);
  }
}

function addChalk(scene: Scene) {
  const chalk = std("#efe6d4", { map: chalkMap() });
  const first = firstBase();
  const third = thirdBase();
  const len = 108;
  const left = new Mesh(new BoxGeometry(0.08, 0.02, len), chalk);
  left.position.set(third.x * 2.2, 0.03, third.z * 2.2);
  left.rotation.y = Math.atan2(third.x, third.z);
  const right = new Mesh(new BoxGeometry(0.08, 0.02, len), chalk);
  right.position.set(first.x * 2.2, 0.03, first.z * 2.2);
  right.rotation.y = Math.atan2(first.x, first.z);
  scene.add(left, right);
}

function addWall(scene: Scene) {
  const pad = padMap();
  pad.wrapS = RepeatWrapping;
  pad.repeat.set(12, 1);
  const segs = 48;
  const group = new Group();
  for (let i = 0; i < segs; i += 1) {
    const a0 = -Math.PI / 4 + (i / segs) * (Math.PI / 2);
    const a1 = -Math.PI / 4 + ((i + 1) / segs) * (Math.PI / 2);
    const r0 = wallRadius(a0);
    const r1 = wallRadius(a1);
    const r = (r0 + r1) / 2;
    const a = (a0 + a1) / 2;
    const width = Math.hypot(r1 * Math.sin(a1) - r0 * Math.sin(a0), r1 * Math.cos(a1) - r0 * Math.cos(a0));
    const wall = box(width + 0.2, 2.5, 0.45, "#1a365c", { map: pad });
    wall.position.set(Math.sin(a) * r, 1.25, Math.cos(a) * r);
    wall.lookAt(0, 1.25, 0);
    const yellow = box(width + 0.2, 0.08, 0.2, "#e2b15a");
    yellow.position.set(Math.sin(a) * r, 2.54, Math.cos(a) * r);
    yellow.lookAt(0, 2.54, 0);
    const track = box(width + 0.4, 0.03, 4.6, "#b67a42", { map: dirtMap(false) });
    track.position.set(Math.sin(a) * (r - 2.5), 0.03, Math.cos(a) * (r - 2.5));
    track.lookAt(0, 0.03, 0);
    group.add(wall, yellow, track);
  }
  const pole = (theta: number) => {
    const r = wallRadius(theta);
    const p = new Mesh(new CylinderGeometry(0.12, 0.12, 18, 8), std("#e2b15a"));
    p.position.set(Math.sin(theta) * r, 9, Math.cos(theta) * r);
    p.castShadow = true;
    return p;
  };
  scene.add(group, pole(-Math.PI / 4), pole(Math.PI / 4));
}

function addDugouts(scene: Scene) {
  for (const side of [-1, 1]) {
    const dug = box(12, 1.6, 3.2, "#2a241c");
    dug.position.set(side * 18.5, 0.5, 14.5);
    const roof = box(12.4, 0.16, 3.6, "#6e5a3c");
    roof.position.set(side * 18.5, 1.45, 14.5);
    const rail = box(12.4, 0.08, 0.08, "#cfc6b8");
    rail.position.set(side * 18.5, 1.55, 13.1);
    scene.add(dug, roof, rail);
    for (let i = 0; i < 4; i += 1) {
      const step = box(1.4, 0.12, 0.4, "#4a4036");
      step.position.set(side * 12.6, 0.08 + i * 0.18, 13.2 - i * 0.12);
      scene.add(step);
    }
  }
}

function addNet(scene: Scene) {
  const net = new Mesh(
    new PlaneGeometry(28, 12),
    new MeshStandardMaterial({
      map: netMap(),
      transparent: true,
      depthWrite: false,
      roughness: 0.4,
      metalness: 0.1,
      side: DoubleSide,
    }),
  );
  net.position.set(0, 6.2, -16);
  scene.add(net);
  const posts = [-13, 0, 13];
  for (const x of posts) {
    const post = box(0.12, 12, 0.12, "#c5c0b4");
    post.position.set(x, 6, -16);
    scene.add(post);
  }
}

function addStands(scene: Scene) {
  const seat = seatMap();
  const lower = new Mesh(
    new CylinderGeometry(58, 42, 14, 48, 1, true, Math.PI * 0.55, Math.PI * 0.9),
    std("#3a4552", { map: seat, roughness: 0.95, side: DoubleSide }),
  );
  lower.position.y = 8;
  const upper = new Mesh(
    new CylinderGeometry(68, 58, 10, 48, 1, true, Math.PI * 0.55, Math.PI * 0.9),
    std("#323c48", { map: seat, roughness: 0.95, side: DoubleSide }),
  );
  upper.position.y = 19;
  const fascia = new Mesh(
    new CylinderGeometry(42.2, 42.2, 1.2, 48, 1, true, Math.PI * 0.55, Math.PI * 0.9),
    std("#d9e2ea", { side: DoubleSide }),
  );
  fascia.position.y = 1.6;
  scene.add(lower, upper, fascia);
  addSeatInstances(scene);
}

function addSeatInstances(scene: Scene) {
  const dummy = new Object3D();
  const geo = new BoxGeometry(0.45, 0.42, 0.45);
  const mat = std("#2e3946");
  const count = 1600;
  const mesh = new InstancedMesh(geo, mat, count);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  let n = 0;
  for (let row = 0; row < 16 && n < count; row += 1) {
    const r = 24 + row * 1.15;
    const y = 2.2 + row * 0.62;
    const around = 48 + row * 2;
    for (let i = 0; i < around && n < count; i += 1) {
      const a = Math.PI + ((i - around / 2) / around) * 1.7;
      dummy.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
      dummy.lookAt(new Vector3(0, y, 0));
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      n += 1;
    }
  }
  mesh.count = n;
  scene.add(mesh);
}

function addTowers(scene: Scene) {
  const spots = [
    [-48, -8],
    [48, -8],
    [-55, 48],
    [55, 48],
  ];
  for (const [x, z] of spots) {
    const pole = new Mesh(new CylinderGeometry(0.35, 0.45, 32, 8), std("#c5c0b4"));
    pole.position.set(x, 16, z);
    pole.castShadow = true;
    const rack = box(6.5, 1.4, 1.1, "#1c1c1c");
    rack.position.set(x, 31.2, z);
    scene.add(pole, rack);
  }
}

function addScoreboard(scene: Scene) {
  const r = FIELD.outfieldCenter + 6;
  const board = box(22, 10, 1.2, "#0e1c33");
  board.position.set(0, 16, r);
  const screen = box(18, 6.5, 0.2, "#1a2a22");
  screen.position.set(0, 16.2, r - 0.7);
  const word = box(10, 1.4, 0.15, "#f4f1ea");
  word.position.set(0, 21.4, r - 0.5);
  scene.add(board, screen, word);
}

function addFlags(scene: Scene) {
  const flags = new Group();
  flags.name = "flags";
  for (const x of [-22, 22]) {
    const pole = new Mesh(new CylinderGeometry(0.06, 0.07, 10, 6), std("#d8d2c6"));
    pole.position.set(x, 5, -18);
    const cloth = new Mesh(new PlaneGeometry(2.2, 1.1), std("#1a365c"));
    cloth.position.set(x + 1.1, 9.2, -18);
    cloth.name = "flag";
    flags.add(pole, cloth);
  }
  scene.add(flags);
}

function addZone(scene: Scene) {
  const w = FIELD.zoneHalfWidth * 2;
  const h = FIELD.zoneTop - FIELD.zoneBottom;
  const zone = new Mesh(
    new BoxGeometry(w, h, 0.02),
    new MeshBasicMaterial({ color: "#e2b15a", transparent: true, opacity: 0.22, depthWrite: false }),
  );
  zone.position.set(0, FIELD.zoneBottom + h / 2, 0.18);
  scene.add(zone);
}

export function waveFlags(root: Scene, t: number) {
  root.traverse((obj: { name: string; rotation: { y: number } }) => {
    if (obj.name === "flag") obj.rotation.y = Math.sin(t * 2.4) * 0.28;
  });
}
