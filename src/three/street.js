// Eko Hustle — the open-world streets in 3D (Three.js). Ported from Gidi Hustle v0.5.
// Roads, pavements, buildings, the eight places, traffic, people and the Sim.
// Layout comes from world.js, so what you see is exactly what you bump into.
// Every model here is built from simple shapes in code.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { spots } from '../data/spots';
import { buildSim, daylight } from './pieces';
import {
  BUILDINGS, DOORS, ENTER_RADIUS, LAND_HALF, LOT_CENTERS, LOT_HALF, PLACE_LOTS, PLACE_SOLIDS,
  ROAD_HALF, ROAD_LINES, RUN_SPEED, WALK_SPEED, doorNear, faceYaw, resolve, roadPath,
} from './world.js';

const SIM_SCALE = 1.75;

/** Lit windows and glass shared by the places; their glow follows the clock. */
const GLOW = {
  window: new THREE.MeshStandardMaterial({ color: '#bfe3ff', roughness: 0.3, emissive: '#ffd27a', emissiveIntensity: 0 }),
  tower: null, // made with its texture in buildPlace
};
const GROUP_YAW = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 };

// ----------------------------------------------------------------- helpers

/** Many static boxes as ONE mesh (one draw call), each with its own colour. */
function mergedBoxes(list, { roughness = 0.85, metalness = 0, shadow = true } = {}) {
  const geos = list.map(({ w, h, d, x, y, z, color, rx = 0 }) => {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rx) g.rotateX(rx);
    g.translate(x, y, z);
    const c = new THREE.Color(color);
    const n = g.attributes.position.count;
    const cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return g;
  });
  const mesh = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness }));
  geos.forEach((g) => g.dispose());
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  return mesh;
}

const matCache = new Map();
function mat(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }));
  return matCache.get(key);
}

function box(w, h, d, material, x = 0, y = h / 2, z = 0, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

function cyl(rt, rb, h, material, x = 0, y = h / 2, z = 0, seg = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function plane(w, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), typeof material === 'string' ? mat(material) : material);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
}

/** A sign: text painted on a canvas. */
function signTexture(text, { bg = '#c0392b', fg = '#ffffff', w = 512, h = 128, font = 64, glow = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.font = `800 ${font}px Sora, system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (glow) { g.shadowColor = glow; g.shadowBlur = 24; }
  g.fillStyle = fg;
  g.fillText(text, w / 2, h / 2 + 4, w - 24);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function signBoard(text, w, h, opts = {}) {
  const tex = signTexture(text, opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.6, emissive: opts.emissive ? new THREE.Color('#ffffff') : new THREE.Color('#000000'),
    emissiveMap: opts.emissive ? tex : null, emissiveIntensity: opts.emissive ? 1 : 0,
  }));
  return m;
}

/** A floating name over a place, always facing the camera. */
function label(text) {
  const tex = signTexture(text, { bg: null, fg: '#ffffff', w: 1024, h: 160, font: 84, glow: '#000000' });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, fog: false }));
  s.scale.set(26, 4.1, 1);
  return s;
}

/** A simple person for the pavements (the Sim uses scene.js's own figure). */
function buildPerson(shirt, skin, trousers) {
  const root = new THREE.Group();
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  legL.position.set(-0.17, 0.85, 0);
  legR.position.set(0.17, 0.85, 0);
  legL.add(box(0.24, 0.85, 0.26, trousers, 0, -0.42, 0, false));
  legR.add(box(0.24, 0.85, 0.26, trousers, 0, -0.42, 0, false));
  root.add(legL, legR);
  root.add(box(0.7, 0.8, 0.36, shirt, 0, 1.25, 0, true));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), mat(skin));
  head.position.y = 1.9;
  head.castShadow = true;
  root.add(head);
  return { root, legL, legR };
}

// ---------------------------------------------------------------- vehicles

function wheelSet(g, xs, zs, r = 0.42) {
  for (const x of xs) for (const z of zs) {
    const w = cyl(r, r, 0.3, '#1e1e1e', x, r, z, 10);
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
}

function buildDanfo() {
  const g = new THREE.Group();
  g.add(box(2.3, 2.1, 5.2, '#f7c600', 0, 1.45));
  g.add(box(2.34, 0.18, 5.24, '#111', 0, 1.0));
  g.add(box(2.34, 0.18, 5.24, '#111', 0, 1.3));
  g.add(box(2.36, 0.6, 3.8, mat('#22313f', { roughness: 0.3 }), 0, 2.05, -0.5));
  g.add(box(2.1, 0.8, 0.08, mat('#22313f', { roughness: 0.3 }), 0, 1.95, 2.6));
  wheelSet(g, [-1.05, 1.05], [-1.7, 1.7]);
  return g;
}

function buildKeke() {
  const g = new THREE.Group();
  g.add(box(1.4, 1.0, 2.6, '#27ae60', 0, 0.9));
  g.add(box(1.5, 0.12, 2.7, '#1e1e1e', 0, 2.1));
  for (const x of [-0.65, 0.65]) for (const z of [-1.2, 1.2]) g.add(box(0.08, 0.8, 0.08, '#1e1e1e', x, 1.7, z, false));
  g.add(box(1.2, 0.5, 0.06, mat('#bfe3ff', { transparent: true, opacity: 0.6 }), 0, 1.65, 1.25, false));
  wheelSet(g, [-0.62, 0.62], [-0.9], 0.34);
  wheelSet(g, [0], [1.1], 0.34);
  return g;
}

function buildCar(color) {
  const g = new THREE.Group();
  g.add(box(1.9, 0.8, 4.3, color, 0, 0.75));
  g.add(box(1.7, 0.65, 2.3, mat('#22313f', { roughness: 0.25 }), 0, 1.45, -0.2));
  g.add(box(1.72, 0.08, 2.3, color, 0, 1.8, -0.2));
  wheelSet(g, [-0.9, 0.9], [-1.35, 1.35], 0.38);
  for (const x of [-0.65, 0.65]) g.add(box(0.35, 0.18, 0.05, mat('#fff7d1', { emissive: '#fff3b0', emissiveIntensity: 0 }), x, 0.85, 2.16, false));
  return g;
}

// ----------------------------------------------------------------- places

function buildPlace(id) {
  const lot = PLACE_LOTS[id];
  const g = new THREE.Group();
  g.position.set(lot.cx, 0, lot.cz);
  g.rotation.y = GROUP_YAW[lot.face];
  const solids = PLACE_SOLIDS[id];
  let height = 6;
  const add = (o) => { g.add(o); return o; };
  const sign = (text, w, h, y, z, opts) => {
    const s = signBoard(text, w, h, opts);
    s.position.set(0, y, z);
    s.rotation.y = Math.PI; // face −z (the front)
    return add(s);
  };

  switch (id) {
    case 'home': {
      add(plane(48, 48, '#9bb06a', 0, 0.07, 0));
      const [, lz, w, d, h] = solids[0];
      add(box(w, h, d, '#efe4d0', 0, h / 2, lz));
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4), mat('#b5523b'));
      roof.scale.set((w + 1.5) / Math.SQRT2, 4, (d + 1.5) / Math.SQRT2);
      roof.position.set(0, h + 2, lz);
      roof.castShadow = true;
      add(roof);
      add(box(2, 2.8, 0.15, '#6d4c41', 0, 1.4, lz - d / 2 - 0.05, false));
      for (const x of [-5, 5]) add(box(2.6, 1.6, 0.12, GLOW.window, x, 2.8, lz - d / 2 - 0.05, false));
      add(cyl(1, 1, 1.8, '#1e1e1e', 4, h + 2.4, lz + 2));
      add(box(1.2, 1, 1, '#f1c40f', 9.5, 0.5, lz - 2));
      for (const x of [-3.5, 3.5]) add(box(0.8, 1.8, 0.8, '#d8cfc0', x, 0.9, -23.5));
      height = h + 6;
      break;
    }
    case 'buka': {
      add(plane(48, 48, '#b89a6c', 0, 0.07, 0));
      const [, lz, w, d, h] = solids[0];
      add(box(w, h, d, '#d9c7a3', 0, h / 2, lz));
      const roof = box(w + 3, 0.2, d + 3, mat('#9aa5ae', { metalness: 0.5, roughness: 0.5 }), 0, h + 0.6, lz);
      roof.rotation.x = -0.12;
      add(roof);
      sign('MAMA RONKE BUKA', 14, 2.6, h - 0.2, lz - d / 2 - 0.1, { bg: '#c0392b' });
      add(box(10, 1.1, 1.2, '#6d4c41', 0, 0.55, lz - d / 2 - 0.8));
      add(cyl(0.9, 0.7, 1, '#555', -3, 1.6, lz - d / 2 - 0.8));
      for (const [x, z, c] of [[-6, -17, '#e74c3c'], [-2, -18, '#2980b9'], [3, -17, '#e74c3c'], [7, -18, '#e74c3c']]) {
        add(box(0.9, 0.12, 0.9, c, x, 0.8, z, false));
        add(box(0.9, 0.9, 0.1, c, x, 1.2, z + 0.45, false));
      }
      add(cyl(0.05, 0.05, 3, '#555', 0, 1.5, -20, 6));
      const umb = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1, 10), mat('#27ae60'));
      umb.position.set(0, 3.2, -20);
      add(umb);
      height = h + 6;
      break;
    }
    case 'market': {
      add(plane(48, 48, '#a59e8c', 0, 0.07, 0));
      const colours = ['#e67e22', '#2980b9', '#c0392b', '#16a085', '#8e44ad', '#f1c40f'];
      const produce = ['#e74c3c', '#27ae60', '#f39c12', '#c0392b'];
      solids.forEach(([x, z, w, d], i) => {
        add(box(w, 1, d, '#8d6e63', x, 0.5, z));
        for (let k = 0; k < 4; k++) {
          const p = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), mat(produce[(i + k) % 4]));
          p.position.set(x - 0.9 + (k % 2) * 1.8, 1.25, z - 0.6 + Math.floor(k / 2) * 1.2);
          add(p);
        }
        add(cyl(0.06, 0.06, 3.4, '#555', x, 1.7, z, 6));
        const u = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.1, 8), mat(colours[i % colours.length]));
        u.position.set(x, 3.6, z);
        u.castShadow = true;
        add(u);
      });
      for (const x of [-7, 7]) add(box(0.6, 5, 0.6, '#5d4037', x, 2.5, -23));
      sign('OJA TUNTUN MARKET', 14, 2.2, 5.2, -23, { bg: '#e67e22' });
      height = 8;
      break;
    }
    case 'hub': {
      add(plane(48, 48, '#9aa5ae', 0, 0.07, 0));
      const [, lz, w, d, h] = solids[0];
      const c = document.createElement('canvas');
      c.width = 128; c.height = 256;
      const gx = c.getContext('2d');
      gx.fillStyle = '#2c3e50'; gx.fillRect(0, 0, 128, 256);
      for (let r = 0; r < 16; r++) for (let k = 0; k < 8; k++) {
        gx.fillStyle = (r * 7 + k * 3) % 5 ? '#8ec5ea' : '#5d8fb5';
        gx.fillRect(k * 16 + 2, r * 16 + 3, 12, 10);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      GLOW.tower = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 0, roughness: 0.25, metalness: 0.3 });
      const tower = box(w, h, d, GLOW.tower, 0, h / 2, lz);
      add(tower);
      sign('BRAINBOX TECH HUB', 16, 2.6, 5, lz - d / 2 - 0.1, { bg: '#00b894', emissive: true });
      add(box(6, 3.2, 0.2, mat('#5dade2', { transparent: true, opacity: 0.7 }), 0, 1.6, lz - d / 2 - 0.1, false));
      height = h + 6;
      break;
    }
    case 'gym': {
      add(plane(48, 48, '#8a8f94', 0, 0.07, 0));
      const [, lz, w, d, h] = solids[0];
      add(box(w, h, d, '#57606f', 0, h / 2, lz));
      sign('IRON GATE GYM', 15, 2.6, h - 1.6, lz - d / 2 - 0.1, { bg: '#ff6b35' });
      for (const x of [-7, 7]) add(box(6, 3.4, 0.12, GLOW.window, x, 2.4, lz - d / 2 - 0.05, false));
      const bell = new THREE.Group();
      bell.add(cyl(0.2, 0.2, 6, '#dfe6e9', 0, 0, 0, 8).rotateZ(Math.PI / 2));
      for (const x of [-3, 3]) bell.add(cyl(1.2, 1.2, 0.7, '#2d3436', x, 0, 0).rotateZ(Math.PI / 2));
      bell.position.set(0, h + 1.5, lz);
      add(bell);
      height = h + 7;
      break;
    }
    case 'park': {
      add(plane(48, 48, '#6fae4f', 0, 0.07, 0));
      add(plane(4, 48, '#d8c3a0', 0, 0.1, 0));
      add(plane(48, 4, '#d8c3a0', 0, 0.11, 2));
      const [fx, fz] = solids[0];
      add(cyl(3, 3.2, 0.9, '#bdc3c7', fx, 0.45, fz, 20));
      add(cyl(2.6, 2.6, 0.1, mat('#5dade2', { roughness: 0.1 }), fx, 0.92, fz, 20));
      add(cyl(0.3, 0.4, 2, '#bdc3c7', fx, 1, fz, 10));
      for (const [x, z] of solids.slice(1)) {
        add(cyl(0.45, 0.6, 5, '#7a4b2a', x, 2.5, z, 8));
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 0), mat('#2f9e44', { flatShading: true }));
        crown.position.set(x, 7, z);
        crown.castShadow = true;
        add(crown);
      }
      for (const [x, z] of [[-7, -6], [7, -6], [-7, 10], [7, 10]]) {
        add(box(3, 0.15, 0.8, '#8d6e63', x, 0.9, z));
        add(box(3, 0.8, 0.15, '#8d6e63', x, 1.3, z + 0.4));
      }
      height = 10;
      break;
    }
    case 'beach': {
      add(plane(62, 62, '#f1d9a7', 7, 0.07, 7));
      for (const [x, z] of solids) {
        const trunk = cyl(0.35, 0.5, 7, '#8b5a2b', x, 3.5, z, 7);
        trunk.rotation.z = 0.12;
        add(trunk);
        for (let k = 0; k < 5; k++) {
          const leaf = box(0.6, 0.12, 4.2, '#2b9348', x + Math.sin(k * 1.26) * 1.8, 6.8, z + Math.cos(k * 1.26) * 1.8, true);
          leaf.rotation.y = k * 1.26;
          leaf.rotation.x = 0.35;
          add(leaf);
        }
      }
      for (const [x, z, c] of [[-4, -4, '#e84393'], [6, -2, '#0984e3'], [-12, 14, '#fdcb6e'], [16, 18, '#e84393']]) {
        add(cyl(0.06, 0.06, 2.8, '#ecf0f1', x, 1.4, z, 6));
        const u = new THREE.Mesh(new THREE.ConeGeometry(2.4, 0.9, 10), mat(c));
        u.position.set(x, 3, z);
        add(u);
        add(box(1, 0.3, 2.2, '#ffffff', x + 1.6, 0.35, z));
      }
      // A horse waiting for riders.
      const horse = new THREE.Group();
      horse.add(box(1, 1.1, 2.4, '#8d5524', 0, 1.6, 0));
      horse.add(box(0.6, 1.2, 0.7, '#8d5524', 0, 2.4, 1.3));
      for (const [x, z] of [[-0.35, -0.9], [0.35, -0.9], [-0.35, 0.9], [0.35, 0.9]]) horse.add(box(0.22, 1.1, 0.22, '#6d3f1a', x, 0.55, z, false));
      horse.position.set(12, 0, 2);
      horse.rotation.y = 0.6;
      add(horse);
      for (const x of [-6, 6]) add(box(0.5, 4.5, 0.5, '#8b5a2b', x, 2.25, -23));
      sign('SUNSET BEACH', 12, 2, 4.7, -23, { bg: '#0984e3' });
      height = 9;
      break;
    }
    case 'club': {
      add(plane(48, 48, '#2d2d3a', 0, 0.07, 0));
      const [, lz, w, d, h] = solids[0];
      add(box(w, h, d, '#1c1c2e', 0, h / 2, lz));
      const neon = (color) => mat(color, { emissive: color, emissiveIntensity: 1.6 });
      add(box(w + 0.2, 0.25, 0.25, neon('#ff4fd8'), 0, h, lz - d / 2, false));
      add(box(0.25, h, 0.25, neon('#4fd1ff'), -w / 2, h / 2, lz - d / 2, false));
      add(box(0.25, h, 0.25, neon('#4fd1ff'), w / 2, h / 2, lz - d / 2, false));
      sign('THE PULSE', 14, 3.2, h - 2.5, lz - d / 2 - 0.12, { bg: '#1c1c2e', fg: '#ffe6fa', glow: '#ff4fd8', emissive: true });
      add(box(3.5, 3.2, 0.15, neon('#4fd1ff'), 0, 1.6, lz - d / 2 - 0.08, false));
      for (const x of [-5, 5]) add(cyl(0.12, 0.12, 1.1, '#d4af37', x, 0.55, lz - d / 2 - 3, 8));
      add(box(10, 0.12, 0.12, '#c0392b', 0, 1, lz - d / 2 - 3, false));
      height = h + 6;
      break;
    }
    default:
      break;
  }

  const p = id === 'home' ? { emoji: '🏠', name: 'Home' } : spots[id];
  const tag = label(`${p.emoji} ${p.name}`);
  tag.position.set(0, height + 2, 0);
  add(tag);
  g.userData.door = id;
  g.traverse((o) => { o.userData.door = id; });
  return g;
}

// ------------------------------------------------------------------- view

export class StreetView {
  constructor(renderer, hooks) {
    this.renderer = renderer;
    this.hooks = hooks; // { onMove(x, z, yaw, moved), onArrive(doorId) }
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, 1, 1, 900);
    this.camera.position.set(0, 14, 18);
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enabled = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 140;
    this.controls.maxPolarAngle = 1.38;
    this.controls.minPolarAngle = 0.25;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
    this.active = false;
    this.time = 0;
    this.keys = new Set();
    this.joy = { x: 0, y: 0 };
    this.run = false;
    this.route = [];
    this.routeDoor = null;
    this.mode = null;

    this.hemi = new THREE.HemisphereLight('#dfefff', '#7a6a50', 1);
    this.sun = new THREE.DirectionalLight('#fff4e0', 1.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = sc.bottom = -45; sc.right = sc.top = 45; sc.near = 1; sc.far = 220;
    this.sun.shadow.bias = -0.0006;
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.scene.fog = new THREE.Fog('#bcd9f2', 120, 340);

    this.buildTown();
    this.places = Object.keys(PLACE_LOTS).map((id) => buildPlace(id));
    this.places.forEach((g) => this.scene.add(g));
    this.buildTraffic();
    this.buildPeople();

    const sim = buildSim();
    this.sim = sim;
    sim.root.scale.setScalar(SIM_SCALE);
    this.scene.add(sim.root);
    this.player = new THREE.Vector3(DOORS.home.x, 0, DOORS.home.z);
    this.yaw = 0;

    this.beacon = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 60, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    beam.position.y = 30;
    this.beacon.add(beam);
    this.beacon.visible = false;
    this.scene.add(this.beacon);

    this.raycaster = new THREE.Raycaster();
    this.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    addEventListener('keydown', (e) => this.key(e, true));
    addEventListener('keyup', (e) => this.key(e, false));
    addEventListener('blur', () => this.keys.clear());
  }

  key(e, down) {
    const k = e.key.toLowerCase();
    if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) return;
    if (down && (!this.active || this.inputBlocked?.() || /input|textarea/i.test(e.target?.tagName ?? ''))) return;
    if (k === 'shift') { this.shift = down; return; }
    if (down) { this.keys.add(k); e.preventDefault(); } else this.keys.delete(k);
  }

  // ---------------------------------------------------------------- town

  buildTown() {
    const S = this.scene;
    // Lagoon and land.
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ color: '#2f86b4', roughness: 0.15, metalness: 0.2 }));
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = -0.8;
    S.add(this.water);
    const land = box(LAND_HALF * 2, 1, LAND_HALF * 2, '#b3a47c', 0, -0.5, 0, false);
    S.add(land);
    // Heights are spaced apart so distant surfaces never flicker through each other.
    const L = LAND_HALF * 2;
    S.add(mergedBoxes(LOT_CENTERS.map(([cx, cz]) => ({ w: LOT_HALF * 2, h: 0.04, d: LOT_HALF * 2, x: cx, y: 0.0, z: cz, color: '#a99a73' })), { shadow: false }));
    // Roads (one mesh) and raised pavements (one mesh).
    const roads = [];
    const walks = [];
    for (const r of ROAD_LINES) {
      roads.push({ w: ROAD_HALF * 2, h: 0.04, d: L, x: r, y: 0.08, z: 0, color: '#3b3d43' });
      roads.push({ w: L, h: 0.04, d: ROAD_HALF * 2, x: 0, y: 0.11, z: r, color: '#3b3d43' });
      for (const side of [-1, 1]) {
        walks.push({ w: 1.8, h: 0.18, d: L, x: r + side * (ROAD_HALF + 0.9), y: 0.09, z: 0, color: '#c2baa9' });
        walks.push({ w: L, h: 0.18, d: 1.8, x: 0, y: 0.09, z: r + side * (ROAD_HALF + 0.9), color: '#c2baa9' });
      }
    }
    S.add(mergedBoxes(roads, { roughness: 0.95, shadow: false }));
    S.add(mergedBoxes(walks, { shadow: false }));
    const dashes = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.25, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e9e4d4' }), 7 * 2 * 62);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    let n = 0;
    for (const r of ROAD_LINES) {
      for (let t = -184; t < 184; t += 6) {
        if (ROAD_LINES.some((x) => Math.abs(x - t) < 5)) continue;
        dashes.setMatrixAt(n++, m.compose(new THREE.Vector3(r, 0.16, t), q, one));
        dashes.setMatrixAt(n++, m.compose(new THREE.Vector3(t, 0.16, r), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), one));
      }
    }
    dashes.count = n;
    S.add(dashes);

    // Ordinary buildings, with windows and water tanks.
    const winGeo = new THREE.PlaneGeometry(1.3, 1.4);
    const panes = [];
    const tanks = [];
    S.add(mergedBoxes(BUILDINGS.map((b) => ({ w: b.w, h: b.h, d: b.d, x: b.x, y: b.h / 2, z: b.z, color: b.color }))));
    const roofs = BUILDINGS.filter((b) => b.roof === 'zinc' && b.kind === 'house')
      .map((b) => ({ w: b.w + 0.8, h: 0.2, d: b.d + 0.8, x: b.x, y: b.h + 0.5, z: b.z, color: '#8e9aa3', rx: 0.1 }));
    if (roofs.length) S.add(mergedBoxes(roofs, { metalness: 0.4, roughness: 0.6, shadow: false }));
    for (const b of BUILDINGS) {
      if (b.tank) tanks.push([b.x + b.w / 4, b.h, b.z - b.d / 4]);
      const floors = Math.max(1, Math.floor((b.h - 1) / 3.2));
      for (let f = 0; f < floors; f++) {
        const y = 2 + f * 3.2;
        const across = (len, cb) => { const k = Math.max(1, Math.floor(len / 3.2)); for (let i = 0; i < k; i++) cb(-len / 2 + (len / k) * (i + 0.5)); };
        across(b.w, (o) => { panes.push([b.x + o, y, b.z - b.d / 2 - 0.03, Math.PI]); panes.push([b.x + o, y, b.z + b.d / 2 + 0.03, 0]); });
        across(b.d, (o) => { panes.push([b.x - b.w / 2 - 0.03, y, b.z + o, -Math.PI / 2]); panes.push([b.x + b.w / 2 + 0.03, y, b.z + o, Math.PI / 2]); });
      }
    }
    this.winLit = new THREE.MeshStandardMaterial({ color: '#9fb8cc', roughness: 0.3, emissive: '#ffcf7a', emissiveIntensity: 0 });
    this.winDark = new THREE.MeshStandardMaterial({ color: '#9fb8cc', roughness: 0.3 });
    const lit = new THREE.InstancedMesh(winGeo, this.winLit, panes.length);
    const dark = new THREE.InstancedMesh(winGeo, this.winDark, panes.length);
    let a = 0;
    let d = 0;
    panes.forEach(([x, y, z, yaw], i) => {
      const mtx = m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), one);
      if ((i * 7919) % 10 < 6) lit.setMatrixAt(a++, mtx); else dark.setMatrixAt(d++, mtx);
    });
    lit.count = a;
    dark.count = d;
    S.add(lit, dark);
    const tankMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 10), mat('#1e1e1e'), tanks.length);
    tanks.forEach(([x, y, z], i) => tankMesh.setMatrixAt(i, m.compose(new THREE.Vector3(x, y + 0.8, z), q, one)));
    tankMesh.castShadow = true;
    S.add(tankMesh);

    // Street lamps and palms along the pavements.
    const lamps = [];
    const palms = [];
    const nearDoor = (x, z) => Object.values(DOORS).some((dd) => Math.hypot(dd.x - x, dd.z - z) < 7);
    ROAD_LINES.forEach((r, ri) => {
      for (let t = -170; t <= 170; t += 34) {
        if (ROAD_LINES.some((x) => Math.abs(x - t) < 8)) continue;
        const side = (ri + Math.round(t / 34)) % 2 ? 1 : -1;
        const off = side * (ROAD_HALF + 1.4);
        if (!nearDoor(r + off, t)) lamps.push([r + off, t, side, 'z']);
        if (!nearDoor(t, r - off)) lamps.push([t, r - off, -side, 'x']);
        if (!nearDoor(r - off, t + 17) && Math.abs(t + 17) < 176) palms.push([r - off, t + 17]);
      }
    });
    const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 6.5, 6), mat('#4b4f55'), lamps.length);
    this.lampMat = new THREE.MeshStandardMaterial({ color: '#fff4cf', emissive: '#ffd27a', emissiveIntensity: 0 });
    const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.25, 1.4), this.lampMat, lamps.length);
    lamps.forEach(([x, z, side, axis], i) => {
      pole.setMatrixAt(i, m.compose(new THREE.Vector3(x, 3.25, z), q, one));
      const dx = axis === 'z' ? -side * 0.7 : 0;
      const dz = axis === 'x' ? side * 0.7 : 0;
      heads.setMatrixAt(i, m.compose(new THREE.Vector3(x + dx, 6.4, z + dz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), axis === 'z' ? Math.PI / 2 : 0), one));
    });
    pole.castShadow = true;
    S.add(pole, heads);
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.32, 6, 6), mat('#8b5a2b'), palms.length);
    const frond = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 1.4, 7), mat('#2b9348', { flatShading: true }), palms.length);
    palms.forEach(([x, z], i) => {
      trunk.setMatrixAt(i, m.compose(new THREE.Vector3(x, 3, z), q, one));
      frond.setMatrixAt(i, m.compose(new THREE.Vector3(x, 6.4, z), q, one));
    });
    trunk.castShadow = frond.castShadow = true;
    S.add(trunk, frond);

    // A glowing ring at every door so you know where to go in.
    this.rings = [];
    for (const dd of Object.values(DOORS)) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: '#35d9bd', transparent: true, opacity: 0.8, depthWrite: false }));
      ring.position.set(dd.x, 0.24, dd.z);
      ring.userData.door = dd.id;
      this.rings.push(ring);
      S.add(ring);
    }
  }

  buildTraffic() {
    this.cars = [];
    const lanes = [];
    for (const r of ROAD_LINES) for (const dir of [-1, 1]) {
      lanes.push({ axis: 'x', line: r, dir });
      lanes.push({ axis: 'z', line: r, dir });
    }
    const colours = ['#c0392b', '#2980b9', '#ecf0f1', '#2d3436', '#8e44ad', '#16a085', '#d35400'];
    for (let i = 0; i < 22; i++) {
      const lane = lanes[(i * 5) % lanes.length];
      const kind = i % 3 === 0 ? 'danfo' : i % 3 === 1 ? 'keke' : 'car';
      const g = kind === 'danfo' ? buildDanfo() : kind === 'keke' ? buildKeke() : buildCar(colours[i % colours.length]);
      const car = { g, lane, t: -180 + ((i * 97) % 360), speed: kind === 'keke' ? 9 : kind === 'danfo' ? 12 : 14, base: 0 };
      car.base = car.speed;
      this.cars.push(car);
      this.scene.add(g);
    }
  }

  buildPeople() {
    this.people = [];
    const shirts = ['#e74c3c', '#2980b9', '#f1c40f', '#8e44ad', '#16a085', '#e67e22', '#ecf0f1', '#e84393'];
    const skins = ['#5a3825', '#6b4423', '#7b4a2d', '#8d5524', '#4a2c1a'];
    for (let i = 0; i < 30; i++) {
      const p = buildPerson(shirts[i % shirts.length], skins[i % skins.length], i % 2 ? '#2c3e50' : '#34495e');
      const r = ROAD_LINES[1 + (i % 5)];
      const axis = i % 2 ? 'x' : 'z';
      const side = i % 4 < 2 ? 1 : -1;
      const seg = -150 + ((i * 7) % 6) * 60;
      this.people.push({ ...p, axis, line: r + side * (ROAD_HALF + 1.1), from: seg - 22, to: seg + 22, t: seg + ((i * 13) % 40) - 20, dir: i % 3 ? 1 : -1, speed: 1.6 + (i % 4) * 0.3 });
      this.scene.add(p.root);
    }
  }

  // ---------------------------------------------------------------- state

  /** Point the view at the current state: walking outside, or a place's front. */
  setState(state, info) {
    this.state = state;
    this.info = info;
    const a = state.sim.away;
    const mode = a?.kind === 'street' ? 'street' : 'place';
    if (mode === 'street' && (this.mode !== 'street' || this.syncedFrom !== a)) {
      // Entering the street (or a save was loaded): put the Sim where the state says.
      this.player.set(a.x, 0, a.z);
      this.yaw = a.yaw ?? 0;
      this.route = [];
      this.routeDoor = null;
      this.frameCamera(this.player, 18, this.yaw);
      this.syncedFrom = a;
    }
    if (mode === 'place') {
      const id = a?.kind === 'place' ? a.place : null;
      if (id && this.placeShown !== id) {
        const d = DOORS[id];
        const lot = PLACE_LOTS[id];
        // Narrow (phone) screens need the camera further back to fit the lot.
        const dist = 46 * Math.max(1, 0.95 / Math.max(0.3, this.camera.aspect));
        this.frameCamera(new THREE.Vector3(lot.cx, 4, lot.cz), dist, faceYaw(d.face), new THREE.Vector3(d.x, 0, d.z));
        this.placeShown = id;
      }
    } else {
      this.placeShown = null;
    }
    this.mode = mode;
  }

  /** Put the camera behind a point, looking at it. */
  frameCamera(target, distance, yaw, from = null) {
    const t = target.clone();
    t.y = Math.max(t.y, 1.6);
    const dir = from
      ? new THREE.Vector3(from.x - target.x, 0, from.z - target.z).normalize()
      : new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    this.controls.target.copy(t);
    this.camera.position.copy(t).addScaledVector(dir, distance).add(new THREE.Vector3(0, distance * 0.6, 0));
    this.controls.update();
  }

  setActive(on) {
    this.active = on;
    this.controls.enabled = on;
    if (!on) { this.keys.clear(); this.joy = { x: 0, y: 0 }; }
  }

  resize(w, h) {
    this.size = { w, h };
    this.camera.aspect = w / h;
    this.offsetFor = null; // re-apply the view offset
    this.camera.updateProjectionMatrix();
  }

  /** Inside a place, its panel covers the bottom of the screen: draw the
   *  picture higher so the building sits above the panel. */
  applyOffset() {
    const key = `${this.mode}:${this.size?.w}x${this.size?.h}`;
    if (key === this.offsetFor || !this.size) return;
    this.offsetFor = key;
    const { w, h } = this.size;
    if (this.mode === 'place') this.camera.setViewOffset(w, h, 0, h * (w < h ? 0.3 : 0.22), w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  /** Walk along the roads to a point, or to a door (and go in on arrival). */
  /** @param {number} x @param {number} z @param {string | null} [doorId] */
  walkTo(x, z, doorId = null) {
    const [tx, tz] = resolve(x, z);
    this.route = roadPath([this.player.x, this.player.z], [tx, tz]).slice(1);
    this.routeDoor = doorId;
  }

  /** @param {string | null} doorId */
  setTarget(doorId) {
    this.target = doorId;
    const d = doorId ? DOORS[doorId] : null;
    this.beacon.visible = !!d;
    if (d) this.beacon.position.set(d.x, 0, d.z);
  }

  /** What a tap hit: a place (go to its door) or a spot on the ground. */
  pick(clientX, clientY) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), this.camera);
    const hits = this.raycaster.intersectObjects([...this.places, ...this.rings], true);
    for (const h of hits) {
      if (h.object.isSprite) continue;
      const id = h.object.userData.door;
      if (id) return { kind: 'door', id };
    }
    const p = this.raycaster.ray.intersectPlane(this.ground, new THREE.Vector3());
    if (!p || Math.abs(p.x) > LAND_HALF || Math.abs(p.z) > LAND_HALF) return null;
    return { kind: 'ground', x: p.x, z: p.z };
  }

  // ---------------------------------------------------------------- frame

  update(dt, { paused = false } = {}) {
    this.time += dt;
    const t = this.time;
    const info = this.info ?? { hour: 12, grid: true };
    const day = daylight(info.hour);

    // Light and sky.
    const angle = ((info.hour - 6) / 13) * Math.PI;
    const sky = new THREE.Color('#0b1430').lerp(new THREE.Color(day > 0.2 && day < 0.6 ? '#f2a46b' : '#9fcbef'), day);
    this.scene.background = sky;
    this.scene.fog.color.copy(sky);
    this.sun.intensity = 0.12 + 1.9 * day;
    this.sun.color.set(day < 0.5 ? '#ffb27a' : '#fff4e0');
    this.hemi.intensity = 0.32 + 0.8 * day;
    this.water.material.color.set(day < 0.3 ? '#14324a' : '#2f86b4');
    const night = day < 0.35;
    const lights = night && info.grid;
    this.lampMat.emissiveIntensity = lights ? 2.2 : 0;
    this.winLit.emissiveIntensity = night ? (info.grid ? 1.1 : 0.25) : 0; // a few generators in a power cut
    GLOW.window.emissiveIntensity = night ? 0.9 : 0;
    if (GLOW.tower) GLOW.tower.emissiveIntensity = night ? 0.6 : 0;
    for (const ring of this.rings) {
      ring.material.opacity = 0.45 + 0.35 * Math.sin(t * 3);
      ring.visible = this.mode === 'street';
    }

    // The Sim.
    const moving = this.mode === 'street' && !paused ? this.step(dt) : false;
    this.sim.root.visible = this.mode === 'street';
    this.sim.root.position.copy(this.player);
    this.sim.root.rotation.y = this.yaw;
    this.animate(this.sim, moving ? (this.running ? 16 : 11) : 0, t, moving);

    // Shadows follow whoever we're looking at.
    const focus = this.controls.target;
    this.sun.position.set(focus.x + Math.cos(angle) * 60, Math.max(20, Math.sin(angle) * 90), focus.z + 40);
    this.sun.target.position.copy(focus);

    // Traffic: drives on the right, and stops for the Sim.
    for (const c of this.cars) {
      const { axis, line, dir } = c.lane;
      const offset = axis === 'x' ? dir * 2 : -dir * 2;
      let blockedAhead = false;
      if (this.mode === 'street') {
        const along = axis === 'x' ? this.player.x : this.player.z;
        const across = axis === 'x' ? this.player.z - (line + offset) : this.player.x - (line + offset);
        const ahead = (along - c.t) * dir;
        blockedAhead = ahead > 0 && ahead < 9 && Math.abs(across) < 2.6;
      }
      c.speed += ((blockedAhead || paused ? 0 : c.base) - c.speed) * Math.min(1, dt * 4);
      c.t += dir * c.speed * dt;
      if (c.t > 196) c.t = -196;
      if (c.t < -196) c.t = 196;
      if (axis === 'x') c.g.position.set(c.t, 0, line + offset);
      else c.g.position.set(line + offset, 0, c.t);
      c.g.rotation.y = axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
    }

    // People on the pavements.
    for (const p of this.people) {
      if (!paused) {
        p.t += p.dir * p.speed * dt;
        if (p.t > p.to) { p.t = p.to; p.dir = -1; }
        if (p.t < p.from) { p.t = p.from; p.dir = 1; }
      }
      if (p.axis === 'x') { p.root.position.set(p.t, 0.18, p.line); p.root.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      else { p.root.position.set(p.line, 0.18, p.t); p.root.rotation.y = p.dir > 0 ? 0 : Math.PI; }
      const sw = paused ? 0 : Math.sin(t * 6 * p.speed + p.line) * 0.5;
      p.legL.rotation.x = sw;
      p.legR.rotation.x = -sw;
    }

    // Camera follows the Sim.
    if (this.mode === 'street') {
      const want = this.player.clone().setY(1.8);
      const delta = want.sub(this.controls.target);
      this.controls.target.add(delta);
      this.camera.position.add(delta);
    }
    this.controls.update();

    this.applyOffset();
    // Who's near a door?
    this.near = this.mode === 'street' ? doorNear(this.player.x, this.player.z, ENTER_RADIUS) : null;
    this.renderer.render(this.scene, this.camera);
  }

  /** Move the Sim from the keys, the stick, or along a tapped route. */
  step(dt) {
    let ix = 0;
    let iz = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) iz += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) iz -= 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) ix -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) ix += 1;
    ix += this.joy.x;
    iz += this.joy.y;
    const manual = Math.hypot(ix, iz) > 0.08;
    let dx = 0;
    let dz = 0;
    this.running = this.run || this.shift || Math.hypot(this.joy.x, this.joy.y) > 0.92;
    const speed = this.running ? RUN_SPEED : WALK_SPEED;
    if (manual) {
      this.route = [];
      this.routeDoor = null;
      // Relative to the camera: "up" walks away from it.
      const fwd = new THREE.Vector3().subVectors(this.controls.target, this.camera.position).setY(0).normalize();
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      const len = Math.min(1, Math.hypot(ix, iz));
      const v = fwd.multiplyScalar(iz).add(right.multiplyScalar(ix)).normalize().multiplyScalar(speed * len * dt);
      dx = v.x;
      dz = v.z;
    } else if (this.route.length) {
      const [tx, tz] = this.route[0];
      const ddx = tx - this.player.x;
      const ddz = tz - this.player.z;
      const k = Math.hypot(ddx, ddz);
      const stepLen = Math.min(k, speed * dt);
      if (k > 1e-6) { dx = (ddx / k) * stepLen; dz = (ddz / k) * stepLen; }
      if (k <= speed * dt + 0.01) {
        this.route.shift();
        if (!this.route.length && this.routeDoor) {
          const door = this.routeDoor;
          this.routeDoor = null;
          this.hooks.onMove?.(tx, tz, this.yaw, true);
          this.player.set(tx, 0, tz);
          this.hooks.onArrive?.(door);
          return true;
        }
      }
    } else {
      return false;
    }
    const [nx, nz] = resolve(this.player.x + dx, this.player.z + dz);
    const moved = Math.hypot(nx - this.player.x, nz - this.player.z) > 1e-4;
    if (moved) {
      const target = Math.atan2(nx - this.player.x, nz - this.player.z);
      let d = target - this.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * Math.min(1, dt * 12);
    } else if (this.route.length) {
      this.route = []; // stuck: give up on the route
    }
    this.player.set(nx, 0, nz);
    this.hooks.onMove?.(nx, nz, this.yaw, moved);
    return moved;
  }

  animate(figure, rate, t, moving) {
    const { body, legL, legR, armL, armR } = figure;
    const sw = moving ? Math.sin(t * rate) * (this.running ? 0.9 : 0.6) : 0;
    legL.rotation.x = sw;
    legR.rotation.x = -sw;
    armL.rotation.x = -sw * 0.8;
    armR.rotation.x = sw * 0.8;
    body.position.y = moving ? Math.abs(Math.sin(t * rate)) * 0.03 : Math.sin(t * 2) * 0.004;
  }
}
