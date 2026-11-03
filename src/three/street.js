// Eko Hustle — the open-world streets in 3D (Three.js). Ported from Gidi Hustle v0.5.
// Roads, pavements, buildings, the eight places, traffic, people and the Sim.
// Layout comes from world.js, so what you see is exactly what you bump into.
// Every model here is built from simple shapes in code.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { spots } from '../data/spots';
import { buildSim, daylight } from './pieces';
import { buildVehicle, setLights } from './vehicles';
import { Animator } from './animator';
import { QualityGovernor } from './quality';
import { PLOTS, carById, homeSolids, inRect, plotTier, plotWidth } from '../data/estate';
import { PERSONAS } from '../data/chatter';
import {
  BUILDINGS, DOORS, ENTER_RADIUS, ESTATE_LOT, LAND_HALF, LOT_CENTERS, LOT_HALF, PLACE_LOTS, PLACE_SOLIDS,
  ROAD_HALF, ROAD_LINES, RUN_SPEED, WALK_SPEED, blocked, doorNear, faceYaw, moveHome, resolve, roadPath,
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

/** A player's name floating over their head, always facing the camera. */
function nameTag(text) {
  const tex = signTexture(text, { bg: null, fg: '#ffffff', w: 512, h: 96, font: 58, glow: '#000000' });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, fog: false }));
  s.scale.set(1.7, 0.32, 1);
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

/** The empty land on the estate, with a for-sale sign and stakes marking the biggest plot. Hidden once you own land. */
function buildEstateSale() {
  const g = new THREE.Group();
  g.position.set(ESTATE_LOT.cx, 0, ESTATE_LOT.cz);
  g.rotation.y = GROUP_YAW[ESTATE_LOT.face];
  const wide = PLOTS.at(-1).width;
  const s = signBoard('LAND FOR SALE', 14, 2.6, { bg: '#e67e22' });
  s.position.set(0, 4.2, -LOT_HALF - 0.5);
  s.rotation.y = Math.PI;
  g.add(s);
  for (const x of [-4, 4]) g.add(box(0.4, 4.4, 0.4, '#5d4037', x, 2.2, -LOT_HALF - 0.5));
  // stakes along the front and the corners of the whole estate
  for (let x = -wide / 2; x <= wide / 2 + 0.1; x += 24) {
    for (const z of [-LOT_HALF, LOT_HALF]) g.add(box(0.35, 1.3, 0.35, '#ff8a3d', x, 0.65, z, false));
  }
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

export function buildPlace(id, labelFor, property) {
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

  switch (id === 'flats' ? 'home' : id) {
    case 'home': {
      const pr = property ?? {};
      const tier = plotTier(pr);
      const wide = plotWidth(pr);          // your own land is wider than the old compound
      const up = pr.floor2 ? 3.4 : 0; // a second floor adds a storey
      add(plane(tier ? wide : 48, 48, pr.garden || tier ? '#58b05c' : '#9bb06a', 0, 0.07, 0));
      const [, lz, w, d, h] = solids[0];
      add(box(w, h, d, '#efe4d0', 0, h / 2, lz));
      if (pr.floor2) {
        add(box(w, up, d, '#f6ecd9', 0, h + up / 2, lz));
        add(box(w + 0.6, 0.25, d + 0.6, '#cfc3ae', 0, h + 0.1, lz)); // the slab between the floors
        for (const x of [-5, 0, 5]) add(box(2.2, 1.6, 0.12, GLOW.window, x, h + 1.8, lz - d / 2 - 0.08, false));
      }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4), mat('#b5523b'));
      roof.scale.set((w + 1.5) / Math.SQRT2, 4, (d + 1.5) / Math.SQRT2);
      roof.position.set(0, h + up + 2, lz);
      roof.castShadow = true;
      add(roof);
      add(box(2, 2.8, 0.15, '#6d4c41', 0, 1.4, lz - d / 2 - 0.05, false));
      for (const x of [-5, 5]) add(box(2.6, 1.6, 0.12, GLOW.window, x, 2.8, lz - d / 2 - 0.05, false));
      add(cyl(1, 1, 1.8, '#1e1e1e', 4, h + up + 2.4, lz + 2));
      add(box(1.2, 1, 1, '#f1c40f', 9.5, 0.5, lz - 2));
      for (const x of [-3.5, 3.5]) add(box(0.8, 1.8, 0.8, '#d8cfc0', x, 0.9, -23.5));
      height = h + up + 6;

      // ---- what you have built (see data/estate.ts; solid parts are listed in homeSolids)
      if (pr.driveway) {
        add(box(7, 0.1, 12.5, '#8d8d96', 0, 0.12, -18));
        for (const [bx, bz, bw, bd] of [[-1.35, -17.5, 0.12, 5.2], [1.35, -17.5, 0.12, 5.2], [0, -20.1, 2.82, 0.12]]) add(box(bw, 0.02, bd === undefined ? 0.12 : bd, '#f4f4f4', bx, 0.18, bz, false));
      }
      if (tier) {
        const half = wide / 2, mid = (3.5 + half) / 2, len = half - 3.5;
        const wall = (x, z, ww, dd) => { add(box(ww, 1.9, dd, '#efe9dc', x, 0.95, z)); add(box(ww + 0.2, 0.16, dd + 0.2, '#b5523b', x, 1.95, z)); };
        wall(-mid, -23.6, len, 0.5); wall(mid, -23.6, len, 0.5);   // the front, with a gap for the gate
        wall(-half, 0, 0.5, 47.2); wall(half, 0, 0.5, 47.2); wall(0, 23.6, wide, 0.5);
        // trees along the back wall, and a parking space marked on the lawn for each one you have
        for (let x = -half + 8; x < half - 4; x += 14) {
          add(cyl(0.3, 0.4, 3, '#7a5230', x, 1.5, 20, 8));
          const crown = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), mat('#2f8a3d'));
          crown.position.set(x, 4.2, 20);
          crown.castShadow = true;
          add(crown);
        }
        for (let n = 1; n <= tier * 2; n++) {
          const [sx] = [(n % 2 ? -1 : 1) * (9 + 6 * Math.floor((n - 1) / 2))];
          for (const [mx, mz, mw, md] of [[sx - 1.4, -17, 0.1, 5.2], [sx + 1.4, -17, 0.1, 5.2], [sx, -19.6, 2.9, 0.1]]) add(box(mw, 0.02, md, '#f4f4f4', mx, 0.14, mz, false));
        }
      }
      if (pr.gate && !tier) {
        for (const sx of [-1, 1]) {
          add(box(20.5, 1.9, 0.5, '#efe9dc', sx * 13.75, 0.95, -23.6));
          add(box(20.7, 0.16, 0.7, '#b5523b', sx * 13.75, 1.95, -23.6));
        }
      }
      if (pr.gate) {
        // an iron gate, swung open
        for (const sx of [-1, 1]) {
          const leaf = new THREE.Group();
          leaf.position.set(sx * 3.4, 0, -23.6);
          leaf.rotation.y = sx * 1.25;
          for (let i = 0; i < 6; i++) leaf.add(box(0.08, 1.7, 0.08, '#1a1a1d', -sx * (0.2 + i * 0.5), 0.95, 0, false));
          leaf.add(box(3.1, 0.1, 0.1, '#1a1a1d', -sx * 1.7, 1.7, 0, false));
          leaf.add(box(3.1, 0.1, 0.1, '#1a1a1d', -sx * 1.7, 0.3, 0, false));
          add(leaf);
        }
      }
      if (pr.garden) {
        const green = ['#3f9d4a', '#2f8a3d', '#58b05c'];
        const bush = (x, z, r, c) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat(c)); b.position.set(x, r * 0.8, z); b.castShadow = true; add(b); };
        [[-8, -14], [-12, -14], [-19, -14], [8, -14], [12, -14], [-20, -4], [20, 6], [-20, 8]].forEach(([x, z], i) => bush(x, z, 0.8 + (i % 3) * 0.25, green[i % 3]));
        const flowers = ['#ff5f6d', '#ffd23d', '#ff8fb1', '#9b6bff'];
        for (let i = 0; i < 12; i++) add(box(0.35, 0.35, 0.35, flowers[i % 4], -19 + (i % 6) * 1.1, 0.35, -21 + Math.floor(i / 6) * 1.2, false));
        add(cyl(0.35, 0.45, 4, '#7a5230', -16, 2, -17, 8));
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 10), mat('#2f8a3d'));
        canopy.position.set(-16, 5.6, -17);
        canopy.castShadow = true;
        add(canopy);
      }
      if (pr.garage) {
        const wall = '#efe4d0';
        add(box(10.4, 0.15, 9.4, '#9a9aa2', 15.5, 0.12, -7));
        add(box(10.4, 3.6, 0.4, wall, 15.5, 1.8, -2.4));
        add(box(0.4, 3.6, 9, wall, 10.5, 1.8, -7));
        add(box(0.4, 3.6, 9, wall, 20.5, 1.8, -7));
        add(box(11, 0.3, 10.2, '#b5523b', 15.5, 3.75, -7));
        add(box(10.4, 0.9, 0.4, '#e7dccb', 15.5, 3.15, -11.5)); // lintel over the open front
        add(box(9.6, 0.5, 0.12, '#cfd8dc', 15.5, 2.7, -11.3, false)); // the rolled-up door
      }
      if (pr.balcony) {
        const by = 3.4, bz = lz - d / 2 - 1.35;
        add(box(8, 0.3, 2.7, '#d8cfc0', 0, by, bz));
        for (const x of [-3.7, 3.7]) add(box(0.3, by, 0.3, '#d8cfc0', x, by / 2, bz - 1.1));
        add(box(8, 0.08, 0.08, '#1a1a1d', 0, by + 1.05, bz - 1.3, false));
        for (let i = 0; i <= 16; i++) add(box(0.05, 1.0, 0.05, '#1a1a1d', -3.9 + i * 0.49, by + 0.55, bz - 1.3, false));
        for (const sx of [-1, 1]) add(box(0.08, 1.0, 2.6, '#1a1a1d', sx * 3.95, by + 0.55, bz, false));
      }
      if (pr.pool) {
        add(box(12.8, 0.18, 7.8, '#ecebf0', 0, 0.13, 11));
        const water = new THREE.Mesh(new THREE.BoxGeometry(12, 0.06, 7), new THREE.MeshStandardMaterial({ color: '#2bc6e6', emissive: '#0a8fb0', emissiveIntensity: 0.35, roughness: 0.1, metalness: 0.2 }));
        water.position.set(0, 0.24, 11);
        add(water);
        for (const lx of [-5, 5]) add(box(1.4, 0.35, 0.7, '#ffcf5c', lx, 0.35, 15.3)); // loungers
      }
      // the marked space on the kerb outside, for the car you keep on the street
      for (const [mx, mz, mw, md] of [[-13.1, -26.3, 5.4, 0.1], [-8.9, -26.3, 5.4, 0.1], [-11, -27.45, 0.1, 2.4], [-11, -25.15, 0.1, 2.4]]) {
        add(box(mw, 0.02, md, '#f4f4f4', mx, 0.14, mz, false));
      }
      break;
    }
    case 'station': {
      add(plane(48, 48, '#8f9298', 0, 0.07, 0));
      const [, slz, sw, sd, sh] = solids[0];
      add(box(sw, sh, sd, '#f2efe6', 0, sh / 2, slz));                      // the shop
      add(box(sw + 1, 0.4, sd + 1, '#c0392b', 0, sh + 0.2, slz));
      add(box(2, 2.6, 0.15, GLOW.window, -3, 1.8, slz - sd / 2 - 0.05, false));
      add(box(1.8, 2.6, 0.15, '#6d4c41', 3, 1.3, slz - sd / 2 - 0.05, false));
      // the canopy over the pumps
      add(box(22, 0.5, 12, '#e8e1d2', 0, 5.2, -14));
      add(box(22.4, 0.5, 12.4, '#c0392b', 0, 5.6, -14));
      for (const [px, pz] of [[-10, -19], [10, -19], [-10, -9], [10, -9]]) add(box(0.6, 5, 0.6, '#9aa0a6', px, 2.5, pz));
      for (const px of [-6, -2, 2, 6]) {
        add(box(0.9, 1.7, 0.7, '#2d3436', px, 0.85, -14));
        add(box(0.95, 0.5, 0.75, ['#e74c3c', '#27ae60', '#f1c40f', '#2980b9'][Math.abs(px / 4 | 0) % 4], px, 1.95, -14));
        add(box(2.4, 0.08, 4.4, '#f4f4f4', px, 0.13, -14, false));          // the marked bay
      }
      for (const x of [-9, 9]) add(box(0.6, 6.5, 0.6, '#5d4037', x, 3.25, -24));
      sign('NAIJA FUEL', 14, 2.4, 6.2, -24, { bg: '#c0392b' });
      add(cyl(1.2, 1.2, 2.6, '#1e1e1e', 0, sh + 1.8, slz));                  // the roof tank
      height = sh + 6;
      break;
    }
    case 'chapel': {
      add(plane(48, 48, '#a8b59c', 0, 0.07, 0));
      const [, hlz, hw, hd, hh] = solids[0];
      add(box(hw, hh, hd, '#f7f3ea', 0, hh / 2, hlz));                              // the hall
      add(box(hw + 1.5, 0.6, hd + 1.5, '#8a4b38', 0, hh + 0.3, hlz));               // the roof
      add(box(4.4, 14, 4.4, '#f7f3ea', 0, 7, hlz - hd / 2 - 1));                     // the steeple
      add(box(5, 0.6, 5, '#8a4b38', 0, 14.3, hlz - hd / 2 - 1));
      add(box(0.3, 2.6, 0.3, '#d4a017', 0, 16, hlz - hd / 2 - 1));                   // the cross
      add(box(1.4, 0.3, 0.3, '#d4a017', 0, 16.4, hlz - hd / 2 - 1));
      add(box(2.6, 3.6, 0.25, '#5d4037', 0, 1.8, hlz - hd / 2 - 0.12, false));       // the doors
      for (const x of [-5, 5]) add(box(1.6, 3, 0.15, '#bfe3ff', x, 4, hlz - hd / 2 - 0.1, false));
      sign('GRACE CHAPEL', 11, 2.2, hh + 1.6, hlz - hd / 2 - 0.3, { bg: '#5d4037' });
      height = 18;
      break;
    }
    case 'library': {
      add(plane(48, 48, '#b0b8a2', 0, 0.07, 0));
      const [, llz, lw, ld, lh] = solids[0];
      add(box(lw, lh, ld, '#e8dcc4', 0, lh / 2, llz));                              // the building
      add(box(lw + 1, 0.5, ld + 1, '#3f51b5', 0, lh + 0.25, llz));
      for (const x of [-8, -4, 0, 4, 8]) add(box(1, lh - 1, 1, '#f4efe2', x, (lh - 1) / 2, llz - ld / 2 - 0.8));   // the front columns
      add(box(lw - 8, 0.4, 2.4, '#f4efe2', 0, lh - 0.8, llz - ld / 2 - 0.8));
      add(box(2.6, 3.4, 0.25, '#37474f', 0, 1.7, llz - ld / 2 - 0.12, false));
      sign('PUBLIC LIBRARY', 14, 2.4, lh + 1.7, llz - ld / 2 - 0.3, { bg: '#3f51b5' });
      height = lh + 5;
      break;
    }
    case 'plaza': {
      add(plane(48, 48, '#b7ad9c', 0, 0.07, 0));
      const [, plz, pw, pd, ph] = solids[0];
      add(box(pw, ph, pd, '#f1e3cf', 0, ph / 2, plz));                              // the market hall
      add(box(pw + 1, 0.5, pd + 1, '#7e57c2', 0, ph + 0.25, plz));
      sign('OJA FASHION PLAZA', 16, 2.6, ph + 1.7, plz - pd / 2 - 0.3, { bg: '#7e57c2' });
      const awn = ['#e74c3c', '#f1c40f', '#27ae60', '#3498db', '#e67e22'];
      for (let i = 0; i < 5; i++) {                                                  // stalls along the front, each with a coloured awning
        const x = -9 + i * 4.5;
        add(box(3.4, 0.2, 2.4, awn[i], x, 3, plz - pd / 2 - 1.4));
        add(box(0.12, 3, 0.12, '#5d4037', x - 1.6, 1.5, plz - pd / 2 - 2.4));
        add(box(0.12, 3, 0.12, '#5d4037', x + 1.6, 1.5, plz - pd / 2 - 2.4));
        add(box(3, 0.9, 1.1, '#8d6e63', x, 0.45, plz - pd / 2 - 1.8));
      }
      height = ph + 6;
      break;
    }
    case 'arcade': {
      add(plane(48, 48, '#8d8fa3', 0, 0.07, 0));
      const [, alz, aw, ad, ah] = solids[0];
      add(box(aw, ah, ad, '#2b2d4a', 0, ah / 2, alz));                              // the hall
      add(box(aw + 0.6, 0.4, ad + 0.6, '#ff3d81', 0, ah + 0.2, alz));
      add(box(aw - 4, 3.2, 0.2, mat('#7df9ff', { transparent: true, opacity: 0.6, roughness: 0.2 }), 0, 2, alz - ad / 2 - 0.1, false));   // the neon glass front
      add(box(2.4, 3.4, 0.25, '#14142a', 0, 1.7, alz - ad / 2 - 0.12, false));
      for (const [i, c] of ['#ff3d81', '#7df9ff', '#ffe066', '#9b5de5'].entries()) add(box(2.4, 0.3, 0.3, c, -4.5 + i * 3, ah + 1, alz - ad / 2 - 0.3, false));   // the neon strips
      sign('PIXEL ARCADE', 12, 2.4, ah + 2.6, alz - ad / 2 - 0.3, { bg: '#14142a' });
      height = ah + 6;
      break;
    }
    case 'clinic': {
      add(plane(48, 48, '#aab3ad', 0, 0.07, 0));
      const [, clz, cw, cd, ch] = solids[0];
      add(box(cw, ch, cd, '#f4f8fb', 0, ch / 2, clz));                              // the clinic
      add(box(cw + 1, 0.5, cd + 1, '#26a69a', 0, ch + 0.25, clz));
      add(box(cw - 6, 3.2, 0.2, mat('#bfe3ff', { transparent: true, opacity: 0.55, roughness: 0.2 }), 0, 2, clz - cd / 2 - 0.1, false));
      add(box(2.4, 3.4, 0.25, '#37474f', 0, 1.7, clz - cd / 2 - 0.12, false));
      add(box(1.2, 4, 0.5, '#e53935', 7, ch + 2.2, clz - cd / 2 - 0.4, false));     // the red cross on the roof
      add(box(4, 1.2, 0.5, '#e53935', 7, ch + 2.2, clz - cd / 2 - 0.4, false));
      sign('LIFELINE CLINIC', 14, 2.4, ch + 1.7, clz - cd / 2 - 0.3, { bg: '#26a69a' });
      height = ch + 6;
      break;
    }
    case 'kart': {
      add(plane(48, 48, '#6b6e75', 0, 0.07, 0));
      const [, klz, kw, kd, kh] = solids[0];
      add(box(kw, kh, kd, '#fafafa', 0, kh / 2, klz));                              // the pit building
      add(box(kw + 1, 0.5, kd + 1, '#e53935', 0, kh + 0.25, klz));
      add(box(2.4, 3.2, 0.25, '#37474f', 0, 1.6, klz - kd / 2 - 0.12, false));
      sign('NAIJA KARTING', 14, 2.4, kh + 1.7, klz - kd / 2 - 0.3, { bg: '#e53935' });
      for (let i = 0; i < 18; i++) {                                                 // the track: a loop of tyres with a chequered start line
        const a = (i / 18) * Math.PI * 2;
        add(cyl(0.7, 0.7, 0.6, i % 2 ? '#212121' : '#e53935', Math.cos(a) * 16, 0.3, -6 + Math.sin(a) * 9, 10));
      }
      for (let i = 0; i < 6; i++) add(box(1, 0.02, 1, i % 2 ? '#fff' : '#222', -2.5 + i, 0.14, -15, false));
      height = kh + 6;
      break;
    }
    case 'dancehall': {
      add(plane(48, 48, '#8d7fa8', 0, 0.07, 0));
      const [, dlz, dw, dd, dh] = solids[0];
      add(box(dw, dh, dd, '#3a2a5e', 0, dh / 2, dlz));                              // the hall
      add(box(dw + 1, 0.5, dd + 1, '#ff3d81', 0, dh + 0.25, dlz));
      add(box(2.8, 3.6, 0.25, '#14142a', 0, 1.8, dlz - dd / 2 - 0.12, false));
      for (const [i, c] of ['#ff3d81', '#7df9ff', '#ffe066', '#9b5de5', '#43e97b'].entries()) add(box(1.6, 5.5, 0.3, c, -8 + i * 4, 4.4, dlz - dd / 2 - 0.35, false));   // neon bars
      const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), mat('#e0e0e0', { roughness: 0.1 }));   // the mirror ball
      ball.position.set(0, dh + 3.2, dlz);
      add(ball);
      sign('AFROBEAT DANCE HALL', 18, 2.6, dh + 1.7, dlz - dd / 2 - 0.3, { bg: '#14142a' });
      height = dh + 7;
      break;
    }
    case 'skate': {
      add(plane(48, 48, '#9a9a9a', 0, 0.07, 0));
      const [, slz, sw, sd, sh] = solids[0];
      add(box(sw, sh, sd, '#37474f', 0, sh / 2, slz));                              // the changing hut
      sign('EKO SKATE PARK', 12, 2.2, sh + 1.4, slz - sd / 2 - 0.3, { bg: '#00acc1' });
      for (const [x, z, c] of [[-12, -8, '#e53935'], [10, -10, '#fdd835'], [-6, -16, '#43a047'], [14, -4, '#1e88e5']]) {   // ramps
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 5), mat(c));
        ramp.position.set(x, 1.1, z);
        ramp.rotation.x = -0.35;
        ramp.castShadow = true;
        add(ramp);
        add(box(6, 1.1, 0.3, '#546e7a', x, 0.55, z + 2.4));
      }
      add(box(12, 0.15, 0.15, '#cfd8dc', 0, 0.9, -2, false));                         // a grind rail
      height = sh + 4;
      break;
    }
    case 'bakery': {
      add(plane(48, 48, '#b9a88a', 0, 0.07, 0));
      const [, blz, bw, bd, bh] = solids[0];
      add(box(bw, bh, bd, '#f6d9a8', 0, bh / 2, blz));                              // the shop
      add(box(bw + 1, 0.5, bd + 1, '#8d5a2b', 0, bh + 0.25, blz));
      for (let i = 0; i < 6; i++) add(box(3, 0.25, 2.2, i % 2 ? '#fff' : '#e57373', -7.5 + i * 3, 3.2, blz - bd / 2 - 1.2));   // the striped awning
      add(box(bw - 6, 2.6, 0.2, mat('#bfe3ff', { transparent: true, opacity: 0.55, roughness: 0.2 }), 0, 1.8, blz - bd / 2 - 0.1, false));
      add(box(2.2, 3.2, 0.25, '#5d4037', 0, 1.6, blz - bd / 2 - 0.12, false));
      add(cyl(0.6, 0.6, 5, '#8d6e63', bw / 2 - 2, bh + 2.5, blz + 2, 10));          // the oven chimney
      sign('SWEET CRUMBS', 12, 2.4, bh + 1.8, blz - bd / 2 - 0.3, { bg: '#8d5a2b' });
      height = bh + 8;
      break;
    }
    case 'waterpark': {
      add(plane(48, 48, '#c9d6a8', 0, 0.07, 0));
      const [, wlz, ww, wd, wh] = solids[0];
      add(box(ww, wh, wd, '#fff3e0', 0, wh / 2, wlz));                              // the changing rooms
      add(box(ww + 1, 0.5, wd + 1, '#039be5', 0, wh + 0.25, wlz));
      sign('LAGOON WATER PARK', 16, 2.4, wh + 1.7, wlz - wd / 2 - 0.3, { bg: '#039be5' });
      add(box(16, 0.3, 9, '#4fc3f7', -4, 0.2, -8));                                  // the pool
      add(box(16.8, 0.45, 9.8, '#eceff1', -4, 0.12, -8));
      for (let i = 0; i < 5; i++) add(box(1.6, 0.2 + i * 0.9, 2.4, i % 2 ? '#ff7043' : '#ffca28', 12 + i * 0.4, 0.1 + (0.2 + i * 0.9) / 2 + i * 0.3, -2 - i * 2.2));   // the slide steps
      height = wh + 6;
      break;
    }
    case 'mart': {
      add(plane(48, 48, '#a9b0a5', 0, 0.07, 0));
      const [, mlz, mw, md, mh] = solids[0];
      add(box(mw, mh, md, '#f4efe2', 0, mh / 2, mlz));                              // the shop
      add(box(mw + 1, 0.5, md + 1, '#2e9e5b', 0, mh + 0.25, mlz));
      add(box(mw - 6, 3.2, 0.2, mat('#bfe3ff', { transparent: true, opacity: 0.55, roughness: 0.2 }), 0, 2, mlz - md / 2 - 0.1, false));   // the glass front
      add(box(2.4, 3.4, 0.25, '#37474f', 0, 1.7, mlz - md / 2 - 0.12, false));
      sign('FRESHMART', 15, 2.6, mh + 1.7, mlz - md / 2 - 0.3, { bg: '#2e9e5b' });
      for (let i = -3; i <= 3; i++) add(box(0.1, 0.02, 4.4, '#f4f4f4', i * 3.4, 0.14, -18, false));   // the car park bays
      for (const x of [-9, -5, 5, 9]) {                                              // shopping trolleys
        add(box(1.1, 0.7, 0.7, '#9aa0a6', x, 0.55, -10));
        add(box(1.1, 0.06, 0.06, '#37474f', x, 1.0, -10.35));
      }
      add(cyl(0.9, 0.9, 2.4, '#27ae60', 12, 1.2, -9, 12));                           // the juice stand's tank
      height = mh + 6;
      break;
    }
    case 'stadium': {
      add(plane(48, 48, '#8f9e8a', 0, 0.07, 0));
      const [, slz, sw, sd, sh] = solids[0];
      add(box(sw, sh * 0.5, sd, '#c9c4b8', 0, sh * 0.25, slz));                      // the stands, a tiered block
      add(box(sw - 6, sh * 0.5, sd - 6, '#b3ada0', 0, sh * 0.5 + sh * 0.25, slz));
      add(box(sw + 1, 0.4, sd + 1, '#37474f', 0, sh + 0.1, slz));
      const pitch = box(sw - 14, 0.06, sd - 14, '#3fa34d', 0, sh + 0.34, slz);       // the pitch, seen from above
      add(pitch);
      add(box(0.15, 0.08, sd - 14, '#f4f4f4', 0, sh + 0.4, slz, false));
      add(cyl(2.4, 2.4, 0.08, '#f4f4f4', 0, sh + 0.4, slz, 24));
      for (const [px, pz] of [[-18, -10], [18, -10], [-18, 14], [18, 14]]) add(box(0.5, 16, 0.5, '#9aa0a6', px, 8, pz));   // floodlights
      for (const [px, pz] of [[-18, -10], [18, -10], [-18, 14], [18, 14]]) add(box(3, 1.2, 0.5, GLOW.window, px, 16.4, pz, false));
      sign('UNITY STADIUM', 16, 2.8, sh + 2.4, slz - sd / 2 - 0.2, { bg: '#2c3e50' });
      add(box(6, 4, 0.3, '#1e1e1e', 0, 2, slz - sd / 2 - 0.15, false));              // the gate
      height = sh + 10;
      break;
    }
    case 'cinema': {
      add(plane(48, 48, '#a9a3b8', 0, 0.07, 0));
      const [, clz, cw, cd, ch] = solids[0];
      add(box(cw, ch, cd, '#4b3f72', 0, ch / 2, clz));
      add(box(cw + 1, 0.5, cd + 1, '#2a2147', 0, ch + 0.25, clz));
      add(box(cw - 2, 1.6, 0.6, '#f1c40f', 0, ch - 1.4, clz - cd / 2 - 0.4));   // the marquee
      sign('GIDI CINEMA', 16, 2.8, ch + 1.6, clz - cd / 2 - 0.2, { bg: '#2a2147' });
      for (const x of [-7, -2.5, 2.5, 7]) {                                      // film posters
        add(box(3, 4.2, 0.12, ['#e63946', '#2a9d8f', '#f4a261', '#457b9d'][Math.abs(Math.round(x / 2.5)) % 4], x, 3.2, clz - cd / 2 - 0.1, false));
        add(box(2.5, 0.5, 0.14, '#fffaf0', x, 1.4, clz - cd / 2 - 0.12, false));
      }
      add(box(2.6, 3.2, 0.15, '#1e1e1e', 0, 1.6, clz - cd / 2 - 0.05, false));  // the doors
      add(box(3.6, 2.6, 2.2, '#8d6e63', -12, 1.3, clz - cd / 2 - 3));            // ticket booth
      for (const x of [-4, 0, 4]) add(cyl(0.12, 0.12, 2.4, '#d4a017', x, 1.2, clz - cd / 2 - 3, 8));   // queue posts
      height = ch + 6;
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
  const tag = label(labelFor ? labelFor(id) : `${p.emoji} ${p.name}`);
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
    this.places = Object.keys(PLACE_LOTS).map((id) => buildPlace(id, hooks.labelFor));
    this.places.forEach((g) => this.scene.add(g));
    this.animators = new WeakMap();   // blended animation, one per figure
    this.quality = new QualityGovernor(Math.min(devicePixelRatio || 1, 1.5));   // drops sharpness if the frame rate stays low
    this.buildRain();
    this.frameDt = 0.016;
    this.homeCx = PLACE_LOTS.home.cx;
    this.estateSale = buildEstateSale();
    this.scene.add(this.estateSale);
    this.buildTraffic();
    this.buildPeople();

    const sim = buildSim(hooks.look ?? {});
    this.sim = sim;
    sim.root.scale.setScalar(SIM_SCALE);
    this.scene.add(sim.root);
    this.remotes = new Map(); // other real players, by id (see lib/multiplayer.ts)
    this.parked = new Map();  // cars you own, by uid: { v3d, model, color }
    this.drive = null;        // the car you are driving, if any
    this.safeUntil = 0;       // a car cannot hit you again until this time (seconds)
    this.hurtUntil = 0;       // the Sim lies flat until this time
    this.estateKey = '';
    this.propKey = '';
    this.extraSolids = [];
    this.brake = false;
    this.player = new THREE.Vector3(DOORS.home.x, 0, DOORS.home.z);
    this.yaw = 0;
    // First-person view: the camera sits at the Sim's eyes and you drag to look around.
    this.fp = false;
    this.fpYaw = 0;
    this.fpPitch = -0.08;
    this.manual = false;

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
    const land = box(LAND_HALF * 2, 1, LAND_HALF * 2, '#4fa85a', 0, -0.5, 0, false);
    S.add(land);
    // Heights are spaced apart so distant surfaces never flicker through each other.
    const L = LAND_HALF * 2;
    S.add(mergedBoxes(LOT_CENTERS.map(([cx, cz]) => ({ w: LOT_HALF * 2, h: 0.04, d: LOT_HALF * 2, x: cx, y: 0.0, z: cz, color: '#6fc468' })), { shadow: false }));
    // Roads (one mesh) and raised pavements (one mesh).
    const roads = [];
    const walks = [];
    for (const r of ROAD_LINES) {
      roads.push({ w: ROAD_HALF * 2, h: 0.04, d: L, x: r, y: 0.08, z: 0, color: '#3b3d43' });
      roads.push({ w: L, h: 0.04, d: ROAD_HALF * 2, x: 0, y: 0.11, z: r, color: '#3b3d43' });
      for (const side of [-1, 1]) {
        walks.push({ w: 1.8, h: 0.18, d: L, x: r + side * (ROAD_HALF + 0.9), y: 0.09, z: 0, color: '#e6e0d2' });
        walks.push({ w: L, h: 0.18, d: 1.8, x: 0, y: 0.09, z: r + side * (ROAD_HALF + 0.9), color: '#e6e0d2' });
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
    const ACCENTS = ['#ff5f6d', '#ffc371', '#2ee6c5', '#9b6bff', '#ff8fb1', '#4aa8ff', '#ffd23d'];
    const trims = [];
    BUILDINGS.forEach((b, i) => {
      const a = ACCENTS[(i * 5) % ACCENTS.length];
      trims.push({ w: b.w + 0.7, h: 0.45, d: b.d + 0.7, x: b.x, y: b.h + 0.22, z: b.z, color: a });   // roof rim
      trims.push({ w: b.w + 0.7, h: 0.3, d: b.d + 0.7, x: b.x, y: 0.15, z: b.z, color: '#cfc8ba' });     // plinth
      if (b.kind === 'house') {
        trims.push({ w: b.w * 0.7, h: 0.35, d: 2.2, x: b.x, y: 3.4, z: b.z + b.d / 2 + 1.1, color: ACCENTS[(i * 3 + 2) % ACCENTS.length] }); // shop awning
        trims.push({ w: 1.6, h: 2.6, d: 0.2, x: b.x - b.w * 0.18, y: 1.3, z: b.z + b.d / 2 + 0.1, color: '#5b4636' });                             // door
      } else {
        trims.push({ w: b.w + 0.2, h: 0.5, d: b.d + 0.2, x: b.x, y: b.h * 0.5, z: b.z, color: a });                                              // tower band
      }
    });
    if (trims.length) S.add(mergedBoxes(trims, { roughness: 0.7 }));
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

  /** Rain: streaks that fall around you, and a thicker, greyer air. Off unless it is raining (see data/weather.ts). */
  buildRain() {
    const n = 900;
    this.rainDrops = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      this.rainDrops[i * 3] = (Math.random() - 0.5) * 80;
      this.rainDrops[i * 3 + 1] = Math.random() * 30;
      this.rainDrops[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
    this.rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#d6e8ff', transparent: true, opacity: 0.4 }));
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    this.scene.add(this.rain);
  }

  updateRain(dt, strength) {
    const on = strength > 0.02;
    this.rain.visible = on && this.mode === 'street';
    this.scene.fog.far = 340 - 140 * strength;
    if (!on) return;
    this.rain.material.opacity = 0.12 + 0.4 * strength;
    this.rain.position.set(this.player.x, 0, this.player.z);
    const pos = this.rain.geometry.attributes.position.array;
    const d = this.rainDrops;
    for (let i = 0; i < d.length / 3; i++) {
      d[i * 3 + 1] -= 28 * dt;
      if (d[i * 3 + 1] < 0) d[i * 3 + 1] += 30;
      const x = d[i * 3], y = d[i * 3 + 1], z = d[i * 3 + 2];
      pos.set([x, y, z, x - 0.12, y + 0.9, z], i * 6);
    }
    this.rain.geometry.attributes.position.needsUpdate = true;
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
      const car = { g, lane, t: -(LAND_HALF - 6) + ((i * 97) % (2 * (LAND_HALF - 6))), speed: kind === 'keke' ? 9 : kind === 'danfo' ? 12 : 14, base: 0, reckless: i % 4 === 1 };   // reckless drivers do not slow down for you
      car.base = car.speed;
      this.cars.push(car);
      this.scene.add(g);
    }
  }

  /** A car hit the Sim: tell the game, throw the Sim to the pavement, and give a few safe seconds. */
  knockDown(car, axis, line, t) {
    this.safeUntil = t + 4;
    this.hurtUntil = t + 1.2;
    const side = (axis === 'x' ? this.player.z - line : this.player.x - line) >= 0 ? 1 : -1;
    const out = line + side * (ROAD_HALF + 2.2);
    if (axis === 'x') this.player.z = out; else this.player.x = out;
    this.route = [];
    this.routeDoor = null;
    car.speed = 0;
    this.hooks.onHit?.();
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
      this.people.push({
        ...p, axis, line: r + side * (ROAD_HALF + 1.1), from: seg - 22, to: seg + 22, t: seg + ((i * 13) % 40) - 20,
        dir: i % 3 ? 1 : -1, speed: 1.6 + (i % 4) * 0.3,
        persona: PERSONAS[(i * 3) % PERSONAS.length].id, lastChat: -999, wasNear: false,
      });
      this.scene.add(p.root);
    }
  }

  // ---------------------------------------------------------------- state

  /** Point the view at the current state: walking outside, or a place's front. */
  setState(state, info) {
    this.state = state;
    this.info = info;
    this.syncEstate(info);
    const a = state.sim.away;
    const mode = a?.kind === 'street' ? 'street' : 'place';
    if (mode === 'street' && (this.mode !== 'street' || this.syncedFrom !== a)) {
      // Entering the street (or a save was loaded): put the Sim where the state says.
      this.player.set(a.x, 0, a.z);
      this.yaw = a.yaw ?? 0;
      this.fpYaw = this.yaw;
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

  // ---------------------------------------------------------------- your property and cars

  /** Redraw the home lot when you build something, and park your cars where they are saved. */
  syncEstate(info) {
    const key = JSON.stringify([info?.property ?? null, info?.vehicles ?? []]);
    if (key === this.estateKey) return;
    this.estateKey = key;
    // Buying land moves your home onto the estate: the old flat stays behind, and the for-sale sign goes
    moveHome(plotTier(info?.property) > 0);
    this.estateSale.visible = plotTier(info?.property) === 0;
    const pk = JSON.stringify(info?.property ?? null);
    if (PLACE_LOTS.home.cx !== this.homeCx) {
      this.homeCx = PLACE_LOTS.home.cx;
      for (const g of this.places) { this.scene.remove(g); g.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
      this.places = Object.keys(PLACE_LOTS).map((id) => buildPlace(id, this.hooks.labelFor, id === 'home' ? info?.property : undefined));
      this.places.forEach((g) => this.scene.add(g));
      this.propKey = pk;
      this.extraSolids = homeSolids(info?.property);
    } else if (pk !== this.propKey) {
      this.propKey = pk;
      const i = this.places.findIndex((g) => g.userData.door === 'home');
      if (i >= 0) {
        const old = this.places[i];
        this.scene.remove(old);
        old.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
        const g = buildPlace('home', this.hooks.labelFor, info?.property);
        this.scene.add(g);
        this.places[i] = g;
      }
      this.extraSolids = homeSolids(info?.property);
    }
    const list = info?.vehicles ?? [];
    for (const [uid, e] of [...this.parked]) {
      if (!list.some((v) => v.uid === uid) && this.drive?.uid !== uid) { this.scene.remove(e.v3d.group); this.parked.delete(uid); }
    }
    for (const v of list) {
      let e = this.parked.get(v.uid);
      if (e && (e.model !== v.model || e.color !== v.color)) {
        this.scene.remove(e.v3d.group);
        this.parked.delete(v.uid);
        e = undefined;
      }
      if (!e) {
        e = { v3d: buildVehicle(v.model, v.color), model: v.model, color: v.color };
        this.scene.add(e.v3d.group);
        this.parked.set(v.uid, e);
      }
      if (this.drive?.uid !== v.uid) {
        e.v3d.group.position.set(v.x, 0, v.z);
        e.v3d.group.rotation.y = v.yaw;
      }
    }
  }

  /** The car of yours parked close enough to get into, or null. */
  nearCar() {
    if (this.drive || this.mode !== 'street') return null;
    let best = null;
    for (const [uid, e] of this.parked) {
      const d = Math.hypot(e.v3d.group.position.x - this.player.x, e.v3d.group.position.z - this.player.z);
      if (d < 6 && (!best || d < best.d)) best = { uid, model: e.model, d };
    }
    return best;
  }

  startDrive(uid) {
    const e = this.parked.get(uid);
    if (!e || this.drive || this.mode !== 'street') return false;
    const g = e.v3d.group;
    this.route = [];
    this.drive = { uid, e, x: g.position.x, z: g.position.z, yaw: g.rotation.y, speed: 0, steer: 0, top: (carById(e.model)?.topKmh ?? 150) / 3.6 * 0.36 };
    this.player.set(g.position.x, 0, g.position.z);
    return true;
  }

  /** Get out. Returns where the car stands, so the game can save it. */
  stopDrive() {
    const d = this.drive;
    if (!d) return null;
    const out = { uid: d.uid, x: d.x, z: d.z, yaw: d.yaw };
    const [px, pz] = resolve(d.x - Math.cos(d.yaw) * 2.7, d.z + Math.sin(d.yaw) * 2.7); // out of the driver's side
    this.player.set(px, 0, pz);
    this.yaw = d.yaw + Math.PI / 2;
    setLights(d.e.v3d, false, false);
    this.drive = null;
    this.frameCamera(this.player, 18, this.yaw);
    return out;
  }

  /** Where a car would hit something: houses and walls, your garage and pool, other cars. */
  carHits(d, x, z) {
    const r = d.e.v3d.width / 2 + 0.1;
    const half = d.e.v3d.length / 2 - 0.4;
    const fx = Math.sin(d.yaw), fz = Math.cos(d.yaw);
    for (const k of [-half, 0, half]) {
      const px = x + fx * k, pz = z + fz * k;
      if (Math.abs(px) > LAND_HALF - 1.5 || Math.abs(pz) > LAND_HALF - 1.5 || blocked(px, pz, r)) return true;
      for (const rect of this.extraSolids) if (inRect(rect, px, pz, r)) return true;
      for (const [uid, o] of this.parked) {
        if (uid === d.uid) continue;
        if (Math.hypot(o.v3d.group.position.x - px, o.v3d.group.position.z - pz) < r + 1.5) return true;
      }
    }
    return false;
  }

  driveStep(dt, paused) {
    const d = this.drive;
    const v3d = d.e.v3d;
    let throttle = 0, steer = 0;
    if (!paused) {
      if (this.keys.has('w') || this.keys.has('arrowup')) throttle += 1;
      if (this.keys.has('s') || this.keys.has('arrowdown')) throttle -= 1;
      if (this.keys.has('d') || this.keys.has('arrowright')) steer -= 1;
      if (this.keys.has('a') || this.keys.has('arrowleft')) steer += 1;
      throttle += this.joy.y;
      steer -= this.joy.x;
      throttle = Math.max(-1, Math.min(1, throttle));
      steer = Math.max(-1, Math.min(1, steer));
    }
    const braking = this.brake || this.keys.has(' ');
    if (braking) d.speed -= Math.sign(d.speed) * Math.min(Math.abs(d.speed), 28 * dt);
    else if (throttle > 0) d.speed += (d.speed < 0 ? 22 : 8 + d.top * 0.45) * throttle * dt;
    else if (throttle < 0) d.speed -= (d.speed > 0 ? 22 : 6) * -throttle * dt;
    else d.speed -= Math.sign(d.speed) * Math.min(Math.abs(d.speed), 5 * dt);
    d.speed = Math.max(-5, Math.min(d.top, d.speed));
    d.steer += (steer - d.steer) * Math.min(1, dt * 8);
    d.yaw += d.steer * 1.7 * Math.max(-1, Math.min(1, d.speed / 4)) * dt;
    const nx = d.x + Math.sin(d.yaw) * d.speed * dt;
    const nz = d.z + Math.cos(d.yaw) * d.speed * dt;
    if (this.carHits(d, nx, nz)) d.speed *= -0.25; // bump and stop
    else { d.x = nx; d.z = nz; }
    const g = v3d.group;
    g.position.set(d.x, 0, d.z);
    g.rotation.y = d.yaw;
    for (const w of v3d.wheels) w.rotation.x += (d.speed * dt) / v3d.wheelR;
    for (const w of v3d.front) w.rotation.y = d.steer * 0.5;
    const night = daylight(this.info?.hour ?? 12) < 0.4;
    setLights(v3d, night, braking || (throttle < 0 && d.speed > 0.5));
    this.player.set(d.x, 0, d.z);
    this.yaw = d.yaw;
    this.hooks.onEngine?.(Math.abs(d.speed) / d.top, throttle);
    // chase camera: behind the car and a little above, easing round as it turns
    const want = new THREE.Vector3(d.x - Math.sin(d.yaw) * 10, 7.2, d.z - Math.cos(d.yaw) * 10);
    this.camera.position.lerp(want, Math.min(1, dt * 4));
    this.controls.target.set(d.x + Math.sin(d.yaw) * 3, 1.2, d.z + Math.cos(d.yaw) * 3);
    this.camera.lookAt(this.controls.target);
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

  /** Switch between the overhead camera and the Sim's own eyes. @param {boolean} on */
  setFirstPerson(on) {
    if (on === this.fp) return;
    this.fp = on;
    this.camera.fov = on ? 72 : 52;
    this.camera.near = on ? 0.1 : 1;
    this.camera.updateProjectionMatrix();
    if (on) {
      this.fpYaw = this.yaw;
      this.fpPitch = -0.08;
    } else if (this.mode === 'street') {
      this.frameCamera(this.player, 18, this.yaw);
    }
  }

  /** Drag to look around in first person. @param {number} dx @param {number} dy */
  look(dx, dy) {
    if (!this.fp) return;
    this.fpYaw -= dx * 0.006;
    this.fpPitch = Math.max(-1.0, Math.min(0.7, this.fpPitch - dy * 0.005));
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
    this.frameDt = Math.min(dt, 0.1);
    if (this.quality.sample(dt * 1000)) {
      const size = this.renderer.getSize(new THREE.Vector2());
      this.renderer.setPixelRatio(this.quality.pixelRatio);
      this.renderer.setSize(size.x, size.y);
      this.sun.castShadow = this.quality.shadows;
    }
    this.updateRain(dt, this.info?.rain ?? 0);
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
    const driving = !!this.drive && this.mode === 'street';
    if (driving) this.driveStep(dt, paused);
    const moving = !driving && this.mode === 'street' && !paused ? this.step(dt) : false;
    this.moving = moving;
    const firstPerson = this.fp && this.mode === 'street' && !driving;
    this.sim.root.visible = this.mode === 'street' && !firstPerson && !driving;
    this.sim.root.position.copy(this.player);
    this.sim.root.rotation.y = this.yaw;
    this.sim.root.rotation.z = t < this.hurtUntil ? 1.4 : 0;   // knocked flat for a moment
    this.animate(this.sim, moving ? (this.running ? 16 : 11) : 0, t, moving);
    this.updateRemotes(dt, t);

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
        blockedAhead = !c.reckless && ahead > 0 && ahead < 9 && Math.abs(across) < 2.6;
        // A moving car that reaches you hits you (not while you are driving, or just after a hit)
        if (!driving && !paused && t > this.safeUntil && c.speed > 3 && ahead > -2.2 && ahead < 2.2 && Math.abs(across) < 1.5) this.knockDown(c, axis, line, t);
      }
      c.speed += ((blockedAhead || paused ? 0 : c.base) - c.speed) * Math.min(1, dt * 4);
      c.t += dir * c.speed * dt;
      if (c.t > LAND_HALF + 10) c.t = -(LAND_HALF + 10);
      if (c.t < -(LAND_HALF + 10)) c.t = LAND_HALF + 10;
      if (axis === 'x') c.g.position.set(c.t, 0, line + offset);
      else c.g.position.set(line + offset, 0, c.t);
      c.g.rotation.y = axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
    }

    // Someone nearby might say something as you pass (see data/chatter.ts).
    this.chatter(t, paused);

    // People on the pavements.
    for (const p of this.people) {
      const talking = this.bubble?.p === p && this.bubble.until > t;
      if (talking) {
        // stop and face you while talking
        p.root.rotation.y = Math.atan2(this.player.x - p.root.position.x, this.player.z - p.root.position.z);
        p.legL.rotation.x = 0;
        p.legR.rotation.x = 0;
        continue;
      }
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

    // Camera follows the Sim: from behind and above, or from its eyes.
    if (driving) {
      // the chase camera was set in driveStep
    } else if (firstPerson) {
      // Walking a tapped route turns your head the way you're going.
      if (moving && !this.manual) {
        let d = this.yaw - this.fpYaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        this.fpYaw += d * Math.min(1, dt * 4);
      }
      const eye = this.player.clone().setY(1.72);
      const dir = new THREE.Vector3(Math.sin(this.fpYaw) * Math.cos(this.fpPitch), Math.sin(this.fpPitch), Math.cos(this.fpYaw) * Math.cos(this.fpPitch));
      // A step behind the eyes, so walls you walk up to don't fill the screen
      const flat = new THREE.Vector3(Math.sin(this.fpYaw), 0, Math.cos(this.fpYaw));
      this.camera.position.copy(eye).addScaledVector(flat, -0.6);
      this.camera.lookAt(eye.clone().add(dir));
      this.controls.target.copy(this.player).setY(1.8); // shadows follow the Sim
    } else {
      if (this.mode === 'street') {
        const want = this.player.clone().setY(1.8);
        const delta = want.sub(this.controls.target);
        this.controls.target.add(delta);
        this.camera.position.add(delta);
      }
      this.controls.update();
    }

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
    this.manual = manual;
    let dx = 0;
    let dz = 0;
    this.running = this.run || this.shift || Math.hypot(this.joy.x, this.joy.y) > 0.92;
    const speed = this.running ? RUN_SPEED : WALK_SPEED;
    if (manual) {
      this.route = [];
      this.routeDoor = null;
      // Relative to the camera: "up" walks away from it (in first person: the way you're looking).
      const fwd = this.fp
        ? new THREE.Vector3(Math.sin(this.fpYaw), 0, Math.cos(this.fpYaw))
        : new THREE.Vector3().subVectors(this.controls.target, this.camera.position).setY(0).normalize();
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

  /** Maybe start a short chat with a passer-by close to you, and keep its bubble's screen spot up to date. */
  chatter(t, paused) {
    if (this.bubble && this.bubble.until <= t) this.bubble = null;
    if (this.mode === 'street' && !paused && !this.bubble && t - (this.lastChat ?? -999) > 6) {
      for (const p of this.people) {
        const d = Math.hypot(p.root.position.x - this.player.x, p.root.position.z - this.player.z);
        let near = d < 5;
        if (near) {
          // only people you can actually see on screen
          const v = p.root.position.clone();
          v.y += 2;
          v.project(this.camera);
          near = v.z < 1 && Math.abs(v.x) < 0.8 && v.y > -0.6 && v.y < 0.8;
        }
        // Only when someone comes close (not every frame you stand next to them), and not too often
        if (near && !p.wasNear && t - p.lastChat > 40 && Math.random() < 0.65) {
          const text = this.hooks.onChatter?.(p.persona);
          if (text) {
            this.bubble = { p, id: (this.bubble?.id ?? 0) + Math.random(), until: t + 4.5, ...text };
            p.lastChat = t;
            this.lastChat = t;
          }
        }
        p.wasNear = near;
        if (this.bubble) break;
      }
    }
    // Where the bubble goes on screen (above the person's head)
    if (this.bubble && this.size) {
      const v = this.bubble.p.root.position.clone();
      v.y += 2.6;
      v.project(this.camera);
      // Kept on screen even if the person walks towards the edge
      const x = Math.max(130, Math.min(this.size.w - 130, (v.x * 0.5 + 0.5) * this.size.w));
      const y = Math.max(190, Math.min(this.size.h - 160, (-v.y * 0.5 + 0.5) * this.size.h));
      this.bubble.screen = { x, y, visible: v.z < 1 };
    }
  }

  // ---------------------------------------------------- other real players

  /** Show another player. Their look comes from the server (colours only). */
  addRemote(p) {
    this.removeRemote(p.id);
    const fig = buildSim(p.look ?? {});
    fig.root.scale.setScalar(SIM_SCALE);
    const tag = nameTag(p.name);
    tag.position.set(0, 1.3, 0);
    fig.root.add(tag);
    fig.root.position.set(p.x, 0, p.z);
    fig.root.rotation.y = p.yaw;
    this.scene.add(fig.root);
    this.remotes.set(p.id, { fig, tag, x: p.x, z: p.z, yaw: p.yaw, tx: p.x, tz: p.z, tyaw: p.yaw, anim: p.anim ?? 0, car: null, v3d: null });
    if (p.car) this.setRemoteCar(p.id, p.car);
  }

  /** Another player got into (or out of) a car: show the car, with their name over it, instead of the walking figure. */
  setRemoteCar(id, car) {
    const r = this.remotes.get(id);
    if (!r) return;
    if (r.v3d) { this.scene.remove(r.v3d.group); r.v3d = null; }
    r.car = car;
    for (const c of r.fig.root.children) if (c !== r.tag) c.visible = !car;
    r.tag.position.y = car ? 2.2 / SIM_SCALE : 1.3;
    if (!car) return;
    r.v3d = buildVehicle(car.model, car.color);
    this.scene.add(r.v3d.group);
  }

  /** Where the server says a player now is: they glide there rather than jump. */
  moveRemote(id, x, z, yaw, anim) {
    const r = this.remotes.get(id);
    if (!r) return;
    r.tx = x; r.tz = z; r.tyaw = yaw; r.anim = anim;
  }

  removeRemote(id) {
    const r = this.remotes.get(id);
    if (!r) return;
    this.scene.remove(r.fig.root);
    if (r.v3d) this.scene.remove(r.v3d.group);
    r.tag.material.map?.dispose();
    r.tag.material.dispose();
    this.remotes.delete(id);
  }

  clearRemotes() {
    for (const id of [...this.remotes.keys()]) this.removeRemote(id);
  }

  updateRemotes(dt, t) {
    const k = 1 - Math.exp(-dt * 12);
    for (const r of this.remotes.values()) {
      const dx = r.tx - r.x;
      const dz = r.tz - r.z;
      if (Math.hypot(dx, dz) > 30) { r.x = r.tx; r.z = r.tz; } // a long jump (they came back from a trip): do not slide across town
      else { r.x += dx * k; r.z += dz * k; }
      let dy = r.tyaw - r.yaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy)); // the short way round
      r.yaw += dy * k;
      const g = r.fig.root;
      g.visible = this.mode === 'street';
      g.position.set(r.x, 0, r.z);
      g.rotation.y = r.yaw;
      const moving = r.anim > 0 || Math.hypot(dx, dz) > 0.05;
      if (r.v3d) {
        const c = r.v3d.group;
        c.visible = g.visible;
        c.position.set(r.x, 0, r.z);
        c.rotation.y = r.yaw;
        for (const w of r.v3d.wheels) w.rotation.x += Math.hypot(dx, dz) * k * 4 / r.v3d.wheelR;
        continue;
      }
      this.animate(r.fig, moving ? (r.anim === 2 ? 16 : 11) : 0, t, moving);
    }
  }

  /** Poses a figure with blending: it eases between standing, walking and running instead of snapping. `rate` 16 is a run. */
  animate(figure, rate, t, moving) {
    let a = this.animators.get(figure);
    if (!a) { a = new Animator(figure); this.animators.set(figure, a); }
    a.update(this.frameDt ?? 0.016, moving ? (rate >= 16 ? 'run' : 'walk') : 'idle', t);
  }
}
