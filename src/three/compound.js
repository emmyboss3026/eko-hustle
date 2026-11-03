// Gidi Hustle — the compound around your flat: the rest of the building, the
// yard, the fence and gate, the street outside and the neighbours.
// Your flat is the open, front-right unit of a two-storey block; everything
// here is drawn around it in the flat's own units (one floor tile = 1).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const STOREY = 1.5;

const cache = new Map();
function mat(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }));
  return cache.get(key);
}

function box(w, h, d, material, x = 0, y = h / 2, z = 0, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

function cyl(rt, rb, h, material, x = 0, y = h / 2, z = 0, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Axis-aligned boxes [x0, x1, y0, y1, z0, z1, colour] merged into one mesh. */
function slabs(list, shadow = true) {
  const geos = list.map(([x0, x1, y0, y1, z0, z1, color]) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const c = new THREE.Color(color);
    const n = g.attributes.position.count;
    const cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) cols.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return g;
  });
  const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
  geos.forEach((g) => g.dispose());
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

/** A neighbour: about as tall as your Sim. */
function person(shirt, skin = '#6b4423', trousers = '#2c3e50', wrapper = false) {
  const root = new THREE.Group();
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  legL.position.set(-0.08, 0.44, 0);
  legR.position.set(0.08, 0.44, 0);
  legL.add(box(0.12, 0.44, 0.13, trousers, 0, -0.22, 0, false));
  legR.add(box(0.12, 0.44, 0.13, trousers, 0, -0.22, 0, false));
  root.add(legL, legR);
  const body = box(0.36, 0.42, 0.2, shirt, 0, 0.65, 0);
  root.add(body);
  if (wrapper) root.add(box(0.4, 0.34, 0.24, shirt, 0, 0.3, 0, false));
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(-0.23, 0.84, 0);
  armR.position.set(0.23, 0.84, 0);
  armL.add(box(0.08, 0.34, 0.09, skin, 0, -0.17, 0, false));
  armR.add(box(0.08, 0.34, 0.09, skin, 0, -0.17, 0, false));
  root.add(armL, armR);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat(skin));
  head.position.y = 1.0;
  head.castShadow = true;
  root.add(head);
  return { root, legL, legR, armL, armR, head };
}

function plantain(x, z, s = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.12 * s, 0.16 * s, 1.6 * s, '#7f8c5a', 0, 0.8 * s, 0, 7));
  for (let i = 0; i < 6; i++) {
    const leaf = box(0.32 * s, 0.03, 1.5 * s, '#3e9b3a', Math.sin(i * 1.05) * 0.6 * s, 1.55 * s, Math.cos(i * 1.05) * 0.6 * s, true);
    leaf.rotation.y = i * 1.05;
    leaf.rotation.x = -0.5;
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  return g;
}

function shadeTree(x, z) {
  const g = new THREE.Group();
  g.add(cyl(0.22, 0.3, 2.2, '#7a4b2a', 0, 1.1, 0, 8));
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 0), mat('#2f8f3e', { flatShading: true }));
  crown.position.y = 3;
  crown.scale.set(1.2, 0.85, 1.2);
  crown.castShadow = true;
  g.add(crown);
  g.position.set(x, 0, z);
  return g;
}

function car(color) {
  const g = new THREE.Group();
  g.add(box(1.1, 0.45, 2.3, color, 0, 0.42));
  g.add(box(0.98, 0.38, 1.25, mat('#22313f', { roughness: 0.25 }), 0, 0.82, -0.1));
  for (const x of [-0.5, 0.5]) for (const z of [-0.75, 0.75]) {
    const w = cyl(0.2, 0.2, 0.14, '#1e1e1e', x, 0.2, z, 10);
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
  return g;
}

function danfo() {
  const g = new THREE.Group();
  g.add(box(1.2, 1.1, 2.7, '#f7c600', 0, 0.75));
  g.add(box(1.22, 0.1, 2.72, '#111', 0, 0.55));
  g.add(box(1.22, 0.1, 2.72, '#111', 0, 0.72));
  g.add(box(1.23, 0.32, 1.9, mat('#22313f', { roughness: 0.3 }), 0, 1.05, -0.3));
  for (const x of [-0.55, 0.55]) for (const z of [-0.9, 0.9]) {
    const w = cyl(0.22, 0.22, 0.14, '#1e1e1e', x, 0.22, z, 10);
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
  return g;
}

function keke() {
  const g = new THREE.Group();
  g.add(box(0.75, 0.55, 1.4, '#27ae60', 0, 0.5));
  g.add(box(0.8, 0.06, 1.45, '#1e1e1e', 0, 1.15));
  for (const x of [-0.35, 0.35]) for (const z of [-0.65, 0.65]) g.add(box(0.04, 0.42, 0.04, '#1e1e1e', x, 0.95, z, false));
  for (const [x, z] of [[-0.33, -0.5], [0.33, -0.5], [0, 0.6]]) {
    const w = cyl(0.17, 0.17, 0.1, '#1e1e1e', x, 0.17, z, 10);
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
  return g;
}

/**
 * Build everything around the flat.
 * Returns { group, rearN, rearW, update(dt, t, { night, grid }) }.
 * rearN / rearW are the parts behind and left of the flat, hidden when the
 * camera swings round behind them so they never block the view into your rooms.
 */
export function buildCompound() {
  const group = new THREE.Group();
  const rearN = new THREE.Group();
  const rearW = new THREE.Group();
  group.add(rearN, rearW);

  // The ground: dusty earth all round, a concrete compound inside the fence.
  const earth = new THREE.Mesh(new THREE.CircleGeometry(70, 48), mat('#b49d72', { roughness: 1 }));
  earth.rotation.x = -Math.PI / 2;
  earth.position.y = -0.2;
  earth.receiveShadow = true;
  group.add(earth);
  group.add(slabs([
    [-14, 16, -0.19, -0.12, -14, 14, '#cbc3b3'],    // compound concrete
    [-2.2, -0.8, -0.12, -0.1, 4.3, 14, '#b8b0a0'],  // path to the gate
    [-0.8, 8.5, -0.12, -0.1, 12.6, 14, '#b8b0a0'],
  ], false));
  for (const [x, z, r] of [[12, 9, 2.2], [-11, 9, 2], [13, -6, 1.6]]) {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(r, 16), mat('#7ea35a', { roughness: 1 }));
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, -0.105, z);
    patch.receiveShadow = true;
    group.add(patch);
  }

  // ------------------------------------------------------- the building
  const wall = '#eadcc2';
  const band = '#cdb894';
  const roof = '#9a9184';
  const W = [-12.2, -4.12];   // the unit to the left of yours
  const N = [-12.2, -4.12];   // the units behind yours
  // Ground floor: left unit, back unit, back-left unit.
  rearW.add(slabs([[W[0], W[1], 0, STOREY, -4, 4, wall]]));
  rearN.add(slabs([
    [-4, 4, 0, STOREY, N[0], N[1], wall],
    [W[0], W[1], 0, STOREY, N[0], N[1], wall],
  ]));
  // Upper floor over the neighbours (never over your flat, so you can see in).
  rearW.add(slabs([
    [W[0] - 0.1, W[1] + 0.1, STOREY, STOREY + 0.12, -4.1, 4.4, band],
    [W[0], W[1], STOREY + 0.12, STOREY * 2, -4, 4, wall],
    [W[0] - 0.1, W[1] + 0.1, STOREY * 2, STOREY * 2 + 0.1, -4.1, 4.1, roof],
    [W[0] - 0.1, W[1] + 0.1, STOREY * 2 + 0.1, STOREY * 2 + 0.35, 3.98, 4.1, band],
  ]));
  rearN.add(slabs([
    [-4.1, 4.4, STOREY, STOREY + 0.12, N[0] - 0.1, N[1] + 0.1, band],
    [-4, 4, STOREY + 0.12, STOREY * 2, N[0], N[1], wall],
    [W[0], W[1], STOREY + 0.12, STOREY * 2, N[0], N[1], wall],
    [W[0] - 0.1, 4.1, STOREY * 2, STOREY * 2 + 0.1, N[0] - 0.1, N[1] + 0.1, roof],
    [3.98, 4.1, STOREY * 2 + 0.1, STOREY * 2 + 0.35, N[0], N[1], band],
  ]));

  // Windows and doors on the faces you can see. Their glow follows the clock.
  const glow = new THREE.MeshStandardMaterial({ color: '#bfe3ff', roughness: 0.3, emissive: '#ffcf7a', emissiveIntensity: 0 });
  const frame = '#5d4037';
  const winFront = (g, x, y, z) => { // a window on a face looking +z
    g.add(box(1.2, 0.7, 0.05, glow, x, y, z, false));
    g.add(box(1.3, 0.08, 0.1, frame, x, y - 0.38, z, false));
  };
  const winSide = (g, x, y, z) => { // a window on a face looking +x
    g.add(box(0.05, 0.7, 1.2, glow, x, y, z, false));
    g.add(box(0.1, 0.08, 1.3, frame, x, y - 0.38, z, false));
  };
  // Left unit: door and window at the front, two windows upstairs, a balcony.
  rearW.add(box(0.8, 1.15, 0.06, '#6d4c41', -9.6, 0.58, 4.03, false));
  winFront(rearW, -6.6, 0.85, 4.03);
  winFront(rearW, -10.6, 2.3, 4.03);
  winFront(rearW, -6.6, 2.3, 4.03);
  rearW.add(slabs([[W[0], W[1], STOREY + 0.12, STOREY + 0.16, 4.0, 5.0, '#b9ad99']], false));
  for (let x = W[0] + 0.2; x <= W[1] - 0.1; x += 0.5) rearW.add(box(0.04, 0.45, 0.04, '#2d3436', x, STOREY + 0.38, 4.95, false));
  rearW.add(box(W[1] - W[0], 0.05, 0.05, '#2d3436', (W[0] + W[1]) / 2, STOREY + 0.6, 4.95, false));
  // Clothes hanging on the balcony rail.
  const balconyClothes = [];
  ['#e74c3c', '#f1c40f', '#3498db', '#ffffff'].forEach((c, i) => {
    const cloth = box(0.4, 0.5, 0.03, c, -11 + i * 0.6, STOREY + 0.35, 5.0, false);
    balconyClothes.push(cloth);
    rearW.add(cloth);
  });
  // Back units: windows on the side facing the yard, upstairs and down.
  winSide(rearN, 4.03, 0.85, -6.5);
  winSide(rearN, 4.03, 0.85, -10);
  winSide(rearN, 4.03, 2.3, -6.5);
  winSide(rearN, 4.03, 2.3, -10);
  // An outside staircase up the side of the back units.
  const steps = [];
  for (let i = 0; i < 10; i++) steps.push([4.2, 5.4, 0, (i + 1) * (STOREY / 10), -4.6 - i * 0.6, -4.0 - i * 0.6, '#b9ad99']);
  steps.push([4.2, 5.4, 0, STOREY, -12.2, -10.5, '#b9ad99']);
  rearN.add(slabs(steps));
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 6.3, 6), mat('#2d3436'));
  rail.position.set(5.45, STOREY / 2 + 0.55, -7.3);
  rail.rotation.x = Math.atan2(STOREY, 6);
  rearN.add(rail);
  // A black water tank on the roof.
  rearN.add(cyl(0.7, 0.7, 1.1, '#1e1e1e', -8, STOREY * 2 + 0.65, -8, 14));

  // ------------------------------------------------------ fence and gate
  const fence = '#d8cfc0';
  const H = 1.0;
  group.add(slabs([
    [-14, 16, 0, H, 13.85, 14.15, fence].map((v, i) => (i === 1 ? 6 : v)),   // front, left of the gate
    [9, 16, 0, H, 13.85, 14.15, fence],                                        // front, right of the gate
    [15.85, 16.15, 0, H, -14, 14, fence],                                      // right side
  ]));
  rearN.add(slabs([[-14, 16, 0, H, -14.15, -13.85, fence]]));
  rearW.add(slabs([[-14.15, -13.85, 0, H, -14, 14, fence]]));
  for (const x of [6, 9]) group.add(box(0.35, 1.4, 0.35, '#bfb4a1', x, 0.7, 14));
  const gate = new THREE.Group();
  for (let x = 0.1; x < 1.5; x += 0.22) gate.add(box(0.05, 1.1, 0.05, '#2d3436', x, 0.6, 0, false));
  gate.add(box(1.5, 0.06, 0.06, '#2d3436', 0.75, 1.1, 0, false));
  gate.add(box(1.5, 0.06, 0.06, '#2d3436', 0.75, 0.15, 0, false));
  gate.position.set(6.2, 0, 14.05);
  gate.rotation.y = -1.2; // standing open
  group.add(gate);

  // ------------------------------------------------------------ the yard
  const parked = car('#c0392b');
  parked.position.set(10.5, 0, 6);
  parked.rotation.y = 0.15;
  group.add(parked);
  // Generator, humming when NEPA takes light.
  const gen = new THREE.Group();
  gen.add(box(0.9, 0.55, 0.6, '#f1c40f', 0, 0.3));
  gen.add(box(0.5, 0.25, 0.02, '#2d3436', 0, 0.33, 0.31, false));
  gen.add(cyl(0.05, 0.05, 0.25, '#555', 0.3, 0.7, -0.1, 6));
  gen.position.set(7, 0, -9.5);
  group.add(gen);
  const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: '#9e9e9e', transparent: true, opacity: 0 }));
  smoke.position.set(7.3, 1, -9.6);
  group.add(smoke);
  // Water tank on a stand.
  const tower = new THREE.Group();
  for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) tower.add(box(0.12, 2.4, 0.12, '#636e72', x, 1.2, z));
  tower.add(box(1.5, 0.1, 1.5, '#636e72', 0, 2.45, 0));
  tower.add(cyl(0.75, 0.75, 1.2, '#1e1e1e', 0, 3.1, 0, 14));
  tower.position.set(12.5, 0, -10.5);
  group.add(tower);
  // A clothes line with washing that moves in the breeze.
  for (const x of [7, 13]) group.add(box(0.1, 1.6, 0.1, '#7f8c8d', x, 0.8, -3));
  group.add(box(6, 0.02, 0.02, '#ecf0f1', 10, 1.55, -3, false));
  const washing = [];
  ['#e74c3c', '#2980b9', '#f1c40f', '#8e44ad', '#ecf0f1', '#16a085'].forEach((c, i) => {
    const piece = new THREE.Group();
    piece.add(box(0.55, 0.65, 0.02, c, 0, -0.33, 0, false));
    piece.position.set(7.6 + i * 0.95, 1.55, -3);
    washing.push(piece);
    group.add(piece);
  });
  // Trees and plantains.
  group.add(plantain(-11.5, 9, 1.1));
  group.add(plantain(14, 10.5, 1));
  group.add(plantain(-12.5, 12.2, 0.9));
  group.add(shadeTree(11.5, 1.5));
  // Under the tree: a table, plastic chairs and two neighbours gisting.
  group.add(box(0.9, 0.06, 0.9, '#ecf0f1', 11.5, 0.6, 1.5));
  group.add(cyl(0.05, 0.05, 0.6, '#ecf0f1', 11.5, 0.3, 1.5, 6));
  for (const [x, z, c] of [[10.6, 1.5, '#e74c3c'], [12.4, 1.5, '#2980b9']]) {
    group.add(box(0.45, 0.05, 0.45, c, x, 0.38, z));
    group.add(box(0.05, 0.4, 0.45, c, x + (x < 11.5 ? -0.22 : 0.22), 0.6, z, false));
  }
  const chatA = person('#8e44ad', '#5a3825', '#34495e');
  const chatB = person('#f39c12', '#6b4423', '#2c3e50', true);
  for (const [p, x, yaw] of [[chatA, 10.6, Math.PI / 2], [chatB, 12.4, -Math.PI / 2]]) {
    p.root.position.set(x, 0, 1.5);
    p.root.rotation.y = yaw;
    p.legL.rotation.x = p.legR.rotation.x = -Math.PI / 2;
    p.root.position.y = -0.04;
    group.add(p.root);
  }
  // A kid chasing a ball, someone sweeping, chickens.
  const kid = person('#e84393', '#7b4a2d', '#2c3e50');
  kid.root.scale.setScalar(0.7);
  group.add(kid.root);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mat('#ffffff'));
  ball.castShadow = true;
  group.add(ball);
  const sweeper = person('#16a085', '#4a2c1a', '#16a085', true);
  const broom = box(0.05, 0.8, 0.05, '#c8a165', 0.18, 0.4, 0.25, false);
  broom.rotation.x = 0.5;
  sweeper.root.add(broom);
  group.add(sweeper.root);
  const chickens = [];
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Group();
    c.add(box(0.22, 0.18, 0.3, '#f5f6fa', 0, 0.2, 0));
    c.add(box(0.1, 0.12, 0.1, '#f5f6fa', 0, 0.33, 0.15));
    c.add(box(0.04, 0.05, 0.04, '#e74c3c', 0, 0.41, 0.17, false));
    group.add(c);
    chickens.push(c);
  }
  // Compound light on a pole by the gate.
  group.add(box(0.1, 3, 0.1, '#4b4f55', 4.6, 1.5, 12.8));
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff4cf', emissive: '#ffd27a', emissiveIntensity: 0 });
  group.add(box(0.4, 0.15, 0.3, bulbMat, 4.6, 3.0, 12.6, false));
  const yardLight = new THREE.PointLight('#ffd59a', 0, 16, 1.5);
  yardLight.position.set(4.6, 2.8, 12.4);
  group.add(yardLight);
  // A doormat outside your front door.
  group.add(box(0.9, 0.03, 0.5, '#8e5d3b', -1.5, 0.0, 4.5, false));

  // ------------------------------------------------- the street outside
  group.add(slabs([
    [-60, 60, -0.15, -0.1, 15.4, 20.6, '#3b3d43'],
    [-60, 60, -0.15, 0.02, 14.2, 15.4, '#c2baa9'],
    [-60, 60, -0.15, 0.02, 20.6, 21.8, '#c2baa9'],
  ], false));
  const dashes = [];
  for (let x = -58; x < 60; x += 4) dashes.push([x, x + 2, -0.1, -0.08, 17.94, 18.06, '#e9e4d4']);
  group.add(slabs(dashes, false));
  // Houses across the road and round the sides.
  const houses = [];
  const roofs = [];
  const colours = ['#e3c4a8', '#c7d3dd', '#e8d5b5', '#b9c7a5', '#d9b38c', '#f0e0c0'];
  let k = 0;
  for (let x = -40; x <= 40; x += 9) {
    const h = 1.6 + (k % 3) * 0.9;
    houses.push([x - 3.5, x + 3.5, 0, h, 23, 29, colours[k % colours.length]]);
    roofs.push([x - 3.8, x + 3.8, h, h + 0.15, 22.7, 29.3, '#8e9aa3']);
    k++;
  }
  for (let z = -40; z <= 10; z += 10) {
    const h = 1.5 + (k % 3) * 1.1;
    houses.push([20, 27, 0, h, z - 3.5, z + 3.5, colours[k % colours.length]]);
    roofs.push([19.7, 27.3, h, h + 0.15, z - 3.8, z + 3.8, '#8e9aa3']);
    k++;
  }
  group.add(slabs(houses));
  group.add(slabs(roofs, false));
  const farW = [];
  const farN = [];
  for (let z = -40; z <= 25; z += 10) farW.push([-28, -20, 0, 1.8 + (k++ % 3) * 0.9, z - 3.5, z + 3.5, colours[k % colours.length]]);
  for (let x = -25; x <= 15; x += 10) farN.push([x - 3.5, x + 3.5, 0, 1.6 + (k++ % 3) * 1.2, -28, -20, colours[k % colours.length]]);
  rearW.add(slabs(farW));
  rearN.add(slabs(farN));
  const nightWindows = [];
  for (let x = -40; x <= 40; x += 9) nightWindows.push(box(1, 0.6, 0.05, glow, x - 1.5, 1, 22.97, false), box(1, 0.6, 0.05, glow, x + 1.6, 1, 22.97, false));
  nightWindows.forEach((w) => group.add(w));
  group.add(plantain(-17, 22, 1.2));
  group.add(shadeTree(18, 24));
  // Traffic passing the gate.
  const rides = [
    { g: danfo(), lane: 16.5, dir: 1, x: -30, speed: 5 },
    { g: keke(), lane: 19.5, dir: -1, x: 20, speed: 3.5 },
    { g: car('#2980b9'), lane: 16.5, dir: 1, x: 10, speed: 6 },
  ];
  for (const r of rides) {
    r.g.rotation.y = r.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(r.g);
  }
  // People walking past on the pavement.
  const walkers = [person('#d35400'), person('#2980b9', '#5a3825'), person('#c0392b', '#4a2c1a', '#c0392b', true)];
  walkers.forEach((p, i) => { p.x = -30 + i * 22; p.dir = i % 2 ? -1 : 1; p.lane = i % 2 ? 21.2 : 14.8; group.add(p.root); });

  // ------------------------------------------------------------ animation
  function update(dt, t, { night, grid }) {
    glow.emissiveIntensity = night ? (grid ? 1.0 : 0.25) : 0;
    bulbMat.emissiveIntensity = night && grid ? 2.4 : 0;
    yardLight.intensity = night && grid ? 6 : 0;
    // Generators run when the light is off.
    const genOn = !grid;
    gen.position.x = 7 + (genOn ? Math.sin(t * 60) * 0.01 : 0);
    const puff = (t * 0.8) % 1;
    smoke.material.opacity = genOn ? 0.5 * (1 - puff) : 0;
    smoke.position.y = 0.9 + puff * 1.2;
    smoke.scale.setScalar(0.6 + puff * 1.4);
    // Washing in the breeze.
    washing.forEach((w, i) => { w.rotation.x = Math.sin(t * 1.6 + i) * 0.18; });
    balconyClothes.forEach((c, i) => { c.rotation.x = Math.sin(t * 1.3 + i * 0.7) * 0.12; });
    // The two neighbours gisting under the tree.
    chatA.head.rotation.y = Math.sin(t * 0.9) * 0.3;
    chatA.armR.rotation.x = -0.6 + Math.sin(t * 3) * 0.4;
    chatB.head.rotation.x = Math.max(0, Math.sin(t * 2.2)) * 0.25;
    chatB.armL.rotation.x = -0.3 + Math.sin(t * 2.5 + 1) * 0.3;
    // The kid and the ball.
    const a = t * 0.7;
    ball.position.set(2 + Math.cos(a) * 3.2, 0.14 + Math.abs(Math.sin(t * 4)) * 0.25, 9.2 + Math.sin(a) * 1.8);
    const ka = a - 0.35;
    kid.root.position.set(2 + Math.cos(ka) * 3.2, 0, 9.2 + Math.sin(ka) * 1.8);
    kid.root.rotation.y = Math.atan2(-Math.sin(ka), Math.cos(ka));
    const run = Math.sin(t * 9) * 0.7;
    kid.legL.rotation.x = run; kid.legR.rotation.x = -run;
    kid.armL.rotation.x = -run; kid.armR.rotation.x = run;
    // Sweeping in front of the left unit.
    const sx = -8.5 + Math.sin(t * 0.25) * 3;
    sweeper.root.position.set(sx, 0, 5.6);
    sweeper.root.rotation.y = Math.cos(t * 0.25) > 0 ? Math.PI / 2 : -Math.PI / 2;
    broom.rotation.z = Math.sin(t * 5) * 0.4;
    sweeper.armR.rotation.x = -0.7 + Math.sin(t * 5) * 0.2;
    const step = Math.sin(t * 3) * 0.35;
    sweeper.legL.rotation.x = step; sweeper.legR.rotation.x = -step;
    // Chickens wander and peck.
    chickens.forEach((c, i) => {
      const r = t * 0.3 + i * 2.1;
      c.position.set(-3 + Math.cos(r) * (1.5 + i * 0.6), 0, 10.5 + Math.sin(r * 1.3) * 1.2);
      c.rotation.y = r + Math.PI / 2;
      c.children[1].position.y = 0.33 - Math.max(0, Math.sin(t * 6 + i)) * 0.12;
    });
    // Traffic and passers-by on the street.
    for (const r of rides) {
      r.x += r.dir * r.speed * dt;
      if (r.x > 60) r.x = -60;
      if (r.x < -60) r.x = 60;
      r.g.position.set(r.x, -0.1, r.lane);
    }
    for (const p of walkers) {
      p.x += p.dir * 0.9 * dt;
      if (p.x > 55) p.x = -55;
      if (p.x < -55) p.x = 55;
      p.root.position.set(p.x, 0.02, p.lane);
      p.root.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      const s = Math.sin(t * 6 + p.lane) * 0.5;
      p.legL.rotation.x = s; p.legR.rotation.x = -s;
    }
  }

  return { group, rearN, rearW, update };
}
