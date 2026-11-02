// The furniture and the Sim, built from simple shapes in code (no model files to download).
// Ported from Gidi Hustle v0.5 (all original shapes).
/* eslint-disable */
import * as THREE from "three";
import type { FurnitureType } from "../data/home";
import type { Look } from "../data/characters";

const BASE_LOOK: Look = { skin: "#7b4a2d", hair: "short", hairColor: "#1e1e1e", outfit: "#2ecc71", bottom: "#34495e", build: "m" };

export type Tick = (dt: number, t: number) => void;

/** 0 at night, 1 at midday: sunrise 06:00, sunset 19:00. */
export function daylight(h: number) {
  return Math.max(0, Math.min(1, Math.sin((Math.PI * (h - 6)) / 13) * 1.6));
}

// ---------------------------------------------------------------- builders

export function mat(color: string, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
}

export function box(w: number, h: number, d: number, material: string | THREE.Material, x = 0, y = h / 2, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rTop: number, rBottom: number, h: number, material: string | THREE.Material, x = 0, y = h / 2, z = 0, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function legs(g: THREE.Group, w: number, d: number, h: number, color: string, inset = 0.06, r = 0.03) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(cyl(r, r, h, color, sx * (w / 2 - inset), h / 2, sz * (d / 2 - inset), 8));
  }
}

/** Build one piece, centred on the origin, front facing +z. Returns the group
 *  and an optional per-frame `tick(dt, t)`. */
export function buildPiece(type: FurnitureType, { powered, active }: { powered: boolean; active: boolean }) {
  const g = new THREE.Group();
  let tick: Tick | null = null;
  switch (type) {
    case 'mattress': {
      g.add(box(0.9, 0.18, 1.9, '#ece6f6'));
      g.add(box(0.7, 0.1, 0.3, '#ffffff', 0, 0.23, -0.72));
      g.add(box(0.92, 0.05, 1.0, '#3d7be0', 0, 0.2, 0.4));
      break;
    }
    case 'bed': {
      g.add(box(1.9, 0.3, 1.9, '#7a4b2a'));
      g.add(box(1.8, 0.18, 1.8, '#f7f3ea', 0, 0.39));
      g.add(box(1.9, 0.75, 0.1, '#5e381e', 0, 0.375, -0.95));
      g.add(box(0.6, 0.1, 0.3, '#ffffff', -0.45, 0.53, -0.7));
      g.add(box(0.6, 0.1, 0.3, '#ffffff', 0.45, 0.53, -0.7));
      g.add(box(1.84, 0.06, 1.1, '#b8322a', 0, 0.5, 0.35));
      break;
    }
    case 'bucket': {
      g.add(cyl(0.2, 0.16, 0.36, '#2e86de', 0.1, 0.18, 0.05));
      g.add(cyl(0.18, 0.12, 0.08, '#f39c12', -0.22, 0.04, -0.15));
      g.add(cyl(0.06, 0.06, 0.012, '#555', -0.2, 0.006, 0.25));
      break;
    }
    case 'shower': {
      g.add(box(0.9, 0.06, 0.9, '#f4f6f7'));
      g.add(cyl(0.025, 0.025, 1.4, mat('#bdc3c7', { metalness: 0.7, roughness: 0.3 }), -0.38, 0.7, -0.38, 8));
      g.add(box(0.2, 0.08, 0.2, '#ecf0f1', -0.25, 1.36, -0.3));
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.02),
        new THREE.MeshStandardMaterial({ color: '#d6f0ff', transparent: true, opacity: 0.25 }));
      glass.position.set(0, 0.66, 0.44);
      g.add(glass);
      if (active && powered) {
        const water = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.12, 1.2, 8, 1, true),
          new THREE.MeshBasicMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.35 }));
        water.position.set(-0.25, 0.7, -0.3);
        g.add(water);
      }
      break;
    }
    case 'burner': {
      g.add(box(0.85, 0.05, 0.6, '#8d6e63', 0, 0.62));
      legs(g, 0.85, 0.6, 0.6, '#5d4037');
      g.add(box(0.55, 0.08, 0.35, '#2d3436', 0, 0.69));
      for (const x of [-0.13, 0.13]) g.add(cyl(0.07, 0.07, 0.02, '#636e72', x, 0.74, 0));
      g.add(cyl(0.13, 0.13, 0.42, '#c0392b', 0.18, 0.21, -0.05));
      if (active) {
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 10),
          new THREE.MeshBasicMaterial({ color: '#4fc3f7' }));
        flame.position.set(-0.13, 0.82, 0);
        g.add(flame);
        g.add(cyl(0.12, 0.1, 0.12, mat('#7f8c8d', { metalness: 0.6, roughness: 0.4 }), -0.13, 0.9, 0));
        tick = (_dt, t) => { flame.scale.y = 0.8 + 0.3 * Math.sin(t * 20); };
      }
      break;
    }
    case 'fridge': {
      g.add(box(0.8, 1.35, 0.72, '#dfe6e9'));
      g.add(box(0.81, 0.012, 0.73, '#b2bec3', 0, 0.9));
      g.add(box(0.04, 0.3, 0.04, '#636e72', 0.3, 1.1, 0.37));
      g.add(box(0.04, 0.3, 0.04, '#636e72', 0.3, 0.6, 0.37));
      g.add(box(0.05, 0.05, 0.01, new THREE.MeshBasicMaterial({ color: powered ? '#2ecc71' : '#555' }), -0.3, 1.25, 0.365));
      break;
    }
    case 'tv': {
      g.add(box(1.8, 0.45, 0.5, '#6d4c41'));
      g.add(box(0.1, 0.25, 0.1, '#222', 0, 0.57, -0.05));
      const screenMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.3 });
      if (active && powered) { screenMat.emissive = new THREE.Color('#3fa9ff'); screenMat.emissiveIntensity = 1.2; }
      g.add(box(1.5, 0.85, 0.05, '#1b1b1b', 0, 1.12, -0.08));
      const screen = box(1.42, 0.77, 0.01, screenMat, 0, 1.12, -0.05);
      g.add(screen);
      if (active && powered) tick = (_dt, t) => { screenMat.emissiveIntensity = 0.9 + 0.35 * Math.sin(t * 7) * Math.sin(t * 2.3); };
      break;
    }
    case 'radio': {
      g.add(box(0.5, 0.4, 0.5, '#a1887f'));
      g.add(box(0.42, 0.24, 0.16, '#2d3436', 0, 0.52));
      g.add(cyl(0.06, 0.06, 0.02, '#b2bec3', -0.1, 0.52, 0.09).rotateX(Math.PI / 2));
      g.add(cyl(0.006, 0.006, 0.35, '#b2bec3', 0.16, 0.8, -0.04, 6));
      if (active) {
        const note = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: '#fdcb6e' }));
        g.add(note);
        tick = (_dt, t) => { note.position.set(Math.sin(t * 2) * 0.2, 0.8 + ((t * 0.6) % 0.6), 0); };
      }
      break;
    }
    case 'chair': {
      const red = '#e74c3c';
      g.add(box(0.55, 0.05, 0.5, red, 0, 0.45));
      g.add(box(0.55, 0.5, 0.05, red, 0, 0.72, -0.23));
      legs(g, 0.52, 0.48, 0.45, red, 0.04, 0.025);
      break;
    }
    case 'sofa': {
      const c = '#16a085';
      g.add(box(1.9, 0.38, 0.8, c, 0, 0.19));
      g.add(box(1.9, 0.5, 0.2, c, 0, 0.5, -0.3));
      g.add(box(0.18, 0.55, 0.8, c, -0.86, 0.28));
      g.add(box(0.18, 0.55, 0.8, c, 0.86, 0.28));
      g.add(box(0.75, 0.1, 0.55, '#1abc9c', -0.38, 0.43, 0.08));
      g.add(box(0.75, 0.1, 0.55, '#1abc9c', 0.38, 0.43, 0.08));
      break;
    }
    case 'fan': {
      g.add(cyl(0.22, 0.25, 0.05, '#2d3436'));
      g.add(cyl(0.025, 0.025, 1.0, '#dfe6e9', 0, 0.55, 0, 8));
      const head = new THREE.Group();
      head.position.set(0, 1.08, 0.05);
      head.add(cyl(0.08, 0.08, 0.12, '#dfe6e9', 0, 0, -0.06).rotateX(Math.PI / 2));
      const blades = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const b = box(0.06, 0.24, 0.01, '#74b9ff', 0, 0.12, 0);
        const holder = new THREE.Group();
        holder.add(b);
        holder.rotation.z = (i * Math.PI * 2) / 3;
        blades.add(holder);
      }
      blades.position.z = 0.03;
      head.add(blades);
      const cage = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.01, 6, 24), mat('#b2bec3'));
      cage.position.z = 0.04;
      head.add(cage);
      g.add(head);
      if (active && powered) tick = (dt, t) => { blades.rotation.z += dt * 25; head.rotation.y = Math.sin(t * 0.8) * 0.6; };
      break;
    }
    case 'plant': {
      g.add(cyl(0.2, 0.15, 0.32, '#c0703c'));
      const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), mat('#27ae60', { flatShading: true }));
      leaves.position.y = 0.62;
      leaves.castShadow = true;
      g.add(leaves);
      break;
    }
    case 'generator': {
      const body = new THREE.Group();
      body.add(box(0.8, 0.5, 0.55, '#f1c40f', 0, 0.3));
      body.add(box(0.5, 0.25, 0.02, '#2d3436', 0, 0.33, 0.28));
      body.add(box(0.85, 0.04, 0.6, '#2d3436', 0, 0.04));
      body.add(cyl(0.05, 0.05, 0.12, '#636e72', 0.28, 0.6, -0.12, 8));
      g.add(body);
      const running = powered && active;
      if (running) tick = (_dt, t) => { body.position.x = Math.sin(t * 60) * 0.008; };
      break;
    }
    case 'rug': {
      const rug = box(1.8, 0.02, 1.8, '#8e44ad', 0, 0.011);
      rug.castShadow = false;
      g.add(rug);
      const inner = box(1.4, 0.022, 1.4, '#f39c12', 0, 0.012);
      inner.castShadow = false;
      g.add(inner);
      g.add(Object.assign(box(0.9, 0.024, 0.9, '#8e44ad', 0, 0.013), { castShadow: false }));
      break;
    }
    case 'toilet': {
      const white = mat('#f5f6f7', { roughness: 0.35 });
      g.add(cyl(0.16, 0.12, 0.38, white, 0, 0.19, 0.05));
      g.add(cyl(0.2, 0.2, 0.04, white, 0, 0.4, 0.08));
      g.add(box(0.42, 0.42, 0.16, white, 0, 0.55, -0.24));
      g.add(box(0.12, 0.03, 0.04, '#b2bec3', 0.12, 0.77, -0.22));
      break;
    }
    case 'mirror': {
      g.add(box(0.5, 0.04, 0.3, '#6d4c41', 0, 0.02));
      g.add(box(0.06, 1.3, 0.06, '#6d4c41', -0.25, 0.68, -0.05));
      g.add(box(0.06, 1.3, 0.06, '#6d4c41', 0.25, 0.68, -0.05));
      g.add(box(0.44, 1.15, 0.02, mat('#dff3ff', { metalness: 0.9, roughness: 0.05 }), 0, 0.72, -0.03));
      break;
    }
    case 'dumbbells': {
      g.add(box(0.75, 0.05, 0.4, '#2d3436', 0, 0.42));
      legs(g, 0.75, 0.4, 0.4, '#2d3436', 0.05, 0.025);
      for (const [x, r] of [[-0.24, 0.07], [0, 0.08], [0.24, 0.09]]) {
        const bell = new THREE.Group();
        bell.add(cyl(0.015, 0.015, 0.22, '#b2bec3', 0, 0, 0, 8).rotateZ(Math.PI / 2));
        bell.add(cyl(r, r, 0.05, '#e17055', -0.09, 0, 0).rotateZ(Math.PI / 2));
        bell.add(cyl(r, r, 0.05, '#e17055', 0.09, 0, 0).rotateZ(Math.PI / 2));
        bell.position.set(x, 0.5, 0);
        bell.rotation.y = Math.PI / 2;
        g.add(bell);
      }
      break;
    }
    case 'desk': {
      g.add(box(1.7, 0.05, 0.7, '#a1887f', 0, 0.72));
      legs(g, 1.7, 0.7, 0.72, '#5d4037', 0.06, 0.03);
      const screenMat = new THREE.MeshStandardMaterial({ color: '#1e272e', roughness: 0.3 });
      if (powered) { screenMat.emissive = new THREE.Color(active ? '#55efc4' : '#2f3640'); screenMat.emissiveIntensity = active ? 1 : 0.4; }
      const lid = box(0.5, 0.32, 0.02, screenMat, 0.1, 0.93, -0.12);
      lid.rotation.x = -0.25;
      g.add(lid);
      g.add(box(0.5, 0.02, 0.32, '#636e72', 0.1, 0.76, 0.05));
      g.add(cyl(0.05, 0.04, 0.1, '#fdcb6e', -0.55, 0.8, 0.05));
      // A chair to sit on while working.
      g.add(box(0.42, 0.05, 0.36, '#2d3436', 0.1, 0.45, 0.28));
      g.add(box(0.42, 0.4, 0.05, '#2d3436', 0.1, 0.68, 0.46));
      if (active && powered) tick = (_dt, t) => { screenMat.emissiveIntensity = 0.8 + 0.25 * Math.sin(t * 3); };
      break;
    }
    case 'bookshelf': {
      const wood = '#8d6e63';
      g.add(box(0.8, 1.3, 0.04, wood, 0, 0.65, -0.18));
      for (const x of [-0.38, 0.38]) g.add(box(0.04, 1.3, 0.38, wood, x, 0.65, 0));
      const colours = ['#e17055', '#0984e3', '#00b894', '#fdcb6e', '#6c5ce7', '#d63031'];
      for (const [i, y] of [0.05, 0.47, 0.89, 1.28].entries()) {
        g.add(box(0.8, 0.04, 0.38, wood, 0, y));
        if (i === 3) break;
        for (let k = 0; k < 6; k++) {
          const h = 0.24 + ((k * 7 + i * 3) % 5) * 0.025;
          g.add(box(0.08, h, 0.26, colours[(k + i) % colours.length], -0.28 + k * 0.105, y + 0.02 + h / 2, 0.02));
        }
      }
      break;
    }
    case 'wardrobe': {
      const wood = '#7a4b2a';
      g.add(box(1.8, 1.7, 0.6, wood, 0, 0.85, 0));
      g.add(box(0.86, 1.55, 0.03, '#8d5a35', -0.45, 0.85, 0.32));
      g.add(box(0.86, 1.55, 0.03, '#8d5a35', 0.45, 0.85, 0.32));
      for (const x of [-0.1, 0.1]) g.add(box(0.04, 0.3, 0.05, '#f2c94c', x, 0.85, 0.35));
      g.add(box(1.9, 0.06, 0.7, '#5d3a1f', 0, 1.72, 0));
      break;
    }
    case 'dining': {
      g.add(box(1.6, 0.06, 1.6, '#c8a27a', 0, 0.74));
      legs(g, 1.6, 1.6, 0.74, '#6d4c41', 0.1, 0.05);
      for (const [x, z, ry] of [[0, -1.0, 0], [0, 1.0, Math.PI], [-1.0, 0, Math.PI / 2], [1.0, 0, -Math.PI / 2]] as [number, number, number][]) {
        const c = new THREE.Group();
        c.add(box(0.42, 0.05, 0.42, '#2f6f73', 0, 0.45));
        c.add(box(0.42, 0.45, 0.05, '#2f6f73', 0, 0.7, -0.2));
        legs(c, 0.42, 0.42, 0.45, '#4a3a2a', 0.03, 0.02);
        c.position.set(x * 0.8, 0, z * 0.8);
        c.rotation.y = ry;
        g.add(c);
      }
      g.add(box(0.5, 0.04, 0.5, '#f4f1ea', 0, 0.78));
      g.add(cyl(0.12, 0.1, 0.18, '#27ae60', 0, 0.9, 0, 8));
      break;
    }
    case 'lamp': {
      g.add(cyl(0.2, 0.22, 0.04, '#2d3436'));
      g.add(cyl(0.02, 0.02, 1.4, '#b2b2b2', 0, 0.72, 0, 8));
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.38, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#ffe3b3', side: THREE.DoubleSide, emissive: powered ? '#ffc766' : '#000000', emissiveIntensity: powered ? 1.4 : 0, roughness: 0.8 }));
      shade.position.y = 1.5;
      g.add(shade);
      if (powered) { const pl = new THREE.PointLight('#ffcf8a', 0.9, 4, 1.6); pl.position.y = 1.5; g.add(pl); }
      break;
    }
    case 'art': {
      g.add(box(0.06, 1.05, 0.06, '#5d4037', -0.3, 0.52, 0));
      g.add(box(0.06, 1.05, 0.06, '#5d4037', 0.3, 0.52, 0));
      g.add(box(0.9, 0.7, 0.05, '#3b2f2a', 0, 1.0, 0));
      g.add(box(0.78, 0.58, 0.06, '#f4c27a', 0, 1.0, 0.01));
      g.add(box(0.22, 0.5, 0.07, '#d9435d', -0.22, 1.0, 0.02));
      g.add(box(0.2, 0.34, 0.07, '#1f7a8c', 0.05, 0.92, 0.02));
      g.add(cyl(0.1, 0.1, 0.07, '#2f2a8a', 0.26, 1.12, 0.02, 14)).rotation.x = Math.PI / 2;
      break;
    }
    case 'curtain': {
      g.add(box(1.0, 0.03, 0.05, '#b8860b', 0, 1.45, 0));
      for (let i = 0; i < 8; i++) g.add(box(0.1, 1.35, 0.06, i % 2 ? '#e67e22' : '#c0392b', -0.45 + i * 0.13, 0.75, 0.02 + (i % 2) * 0.02));
      for (let i = 0; i < 4; i++) g.add(box(0.04, 0.9, 0.02, '#f1c40f', -0.4 + i * 0.27, 1.1, 0.07));
      break;
    }
    case 'armchair': {
      g.add(box(0.85, 0.34, 0.8, '#b85c38', 0, 0.2));
      g.add(box(0.85, 0.6, 0.2, '#b85c38', 0, 0.55, -0.3));
      g.add(box(0.16, 0.45, 0.8, '#a04e2e', -0.4, 0.4));
      g.add(box(0.16, 0.45, 0.8, '#a04e2e', 0.4, 0.4));
      g.add(box(0.55, 0.12, 0.5, '#d9895f', 0, 0.42, 0.06));
      break;
    }
    case 'aircon': {
      g.add(box(0.95, 0.3, 0.26, '#f4f6f8', 0, 1.2, -0.3));
      g.add(box(0.85, 0.04, 0.02, active && powered ? '#55efc4' : '#9aa5ad', 0, 1.1, -0.17));
      g.add(box(0.9, 0.05, 0.1, '#e1e6ea', 0, 1.06, -0.16));
      break;
    }
    case 'leathersofa': {
      const c = '#3b2a22';
      g.add(box(2.9, 0.42, 0.9, c, 0, 0.21));
      g.add(box(2.9, 0.62, 0.24, c, 0, 0.62, -0.34));
      g.add(box(0.22, 0.6, 0.9, '#2c1f19', -1.34, 0.32));
      g.add(box(0.22, 0.6, 0.9, '#2c1f19', 1.34, 0.32));
      for (const x of [-0.85, 0, 0.85]) g.add(box(0.8, 0.14, 0.6, '#4d382d', x, 0.48, 0.08));
      for (const x of [-1.0, 1.0]) g.add(box(0.3, 0.3, 0.12, x < 0 ? '#d4a017' : '#1f7a8c', x, 0.7, -0.15));
      break;
    }
    case 'tvstand': {
      g.add(box(1.8, 0.42, 0.5, '#5d4037', 0, 0.23));
      g.add(box(1.9, 0.04, 0.56, '#3e2723', 0, 0.46));
      for (const x of [-0.45, 0.45]) g.add(box(0.8, 0.3, 0.02, '#795548', x, 0.23, 0.26));
      for (const x of [-0.45, 0.45]) g.add(box(0.05, 0.05, 0.03, '#f2c94c', x + 0.3, 0.25, 0.28));
      g.add(box(0.5, 0.06, 0.3, '#212121', -0.6, 0.51));
      break;
    }
    case 'coffeetable': {
      g.add(box(1.5, 0.06, 0.7, '#8d6e63', 0, 0.42));
      g.add(box(1.3, 0.03, 0.5, '#6d4c41', 0, 0.15));
      legs(g, 1.4, 0.6, 0.42, '#5d4037', 0.04, 0.035);
      g.add(cyl(0.07, 0.06, 0.1, '#ffffff', -0.3, 0.5, 0.05, 12));
      g.add(box(0.3, 0.02, 0.2, '#d9435d', 0.3, 0.46, -0.05));
      break;
    }
    case 'sidetable': {
      g.add(box(0.6, 0.5, 0.45, '#a1887f', 0, 0.3));
      g.add(box(0.64, 0.04, 0.5, '#795548', 0, 0.56));
      g.add(box(0.5, 0.16, 0.02, '#8d6e63', 0, 0.38, 0.23));
      g.add(box(0.08, 0.03, 0.03, '#f2c94c', 0, 0.38, 0.25));
      legs(g, 0.52, 0.38, 0.1, '#5d4037', 0.02, 0.025);
      g.add(box(0.14, 0.02, 0.08, '#212121', 0.12, 0.59));
      break;
    }
    case 'kingbed': {
      g.add(box(2.8, 0.3, 1.9, '#5d4037', 0, 0.2));
      g.add(box(2.7, 0.26, 1.8, '#f5f0e6', 0, 0.46));
      g.add(box(2.85, 0.9, 0.12, '#4e342e', 0, 0.62, -0.95));
      g.add(box(2.7, 0.1, 1.15, '#1f7a8c', 0, 0.62, 0.3));
      for (const x of [-0.65, 0.65]) g.add(box(0.9, 0.16, 0.45, '#ffffff', x, 0.64, -0.62));
      g.add(box(2.7, 0.04, 0.5, '#d4a017', 0, 0.66, 0.0));
      break;
    }
    case 'dresser': {
      g.add(box(1.8, 0.9, 0.55, '#8d6e63', 0, 0.45));
      g.add(box(1.86, 0.04, 0.6, '#5d4037', 0, 0.92));
      for (const y of [0.22, 0.45, 0.68]) {
        g.add(box(1.7, 0.2, 0.02, '#a1887f', 0, y, 0.28));
        for (const x of [-0.4, 0.4]) g.add(box(0.1, 0.03, 0.03, '#f2c94c', x, y, 0.3));
      }
      g.add(box(0.6, 0.5, 0.04, '#cfd8dc', 0, 1.2, -0.2));
      g.add(box(0.66, 0.56, 0.03, '#5d4037', 0, 1.2, -0.22));
      break;
    }
    case 'island': {
      g.add(box(1.8, 0.9, 0.7, '#f4f1ea', 0, 0.45));
      g.add(box(1.95, 0.06, 0.82, '#2d3436', 0, 0.93));
      g.add(box(1.7, 0.05, 0.02, '#cfd8dc', 0, 0.5, 0.36));
      for (const x of [-0.45, 0.45]) {
        g.add(cyl(0.17, 0.17, 0.06, '#d9435d', x, 0.66, 0.65, 14));
        g.add(cyl(0.03, 0.03, 0.6, '#b0bec5', x, 0.33, 0.65, 8));
      }
      g.add(cyl(0.1, 0.1, 0.07, '#f1c40f', 0.5, 1.0, 0, 12));
      break;
    }
    case 'shoerack': {
      for (const y of [0.1, 0.4, 0.7]) g.add(box(0.8, 0.04, 0.32, '#8d6e63', 0, y));
      g.add(box(0.04, 0.75, 0.32, '#6d4c41', -0.4, 0.38));
      g.add(box(0.04, 0.75, 0.32, '#6d4c41', 0.4, 0.38));
      for (const [x, y, c] of [[-0.2, 0.14, '#e74c3c'], [0.2, 0.14, '#ecf0f1'], [-0.2, 0.44, '#2d3436'], [0.2, 0.44, '#f1c40f'], [0, 0.74, '#3498db']] as [number, number, string][]) g.add(box(0.26, 0.09, 0.14, c, x, y + 0.07));
      break;
    }
    case 'washer': {
      g.add(box(0.72, 0.86, 0.66, '#eceff1', 0, 0.43));
      g.add(box(0.72, 0.12, 0.66, '#cfd8dc', 0, 0.84));
      const door = cyl(0.22, 0.22, 0.04, '#90a4ae', 0, 0.42, 0.34, 20);
      door.rotation.x = Math.PI / 2;
      g.add(door);
      const glass = cyl(0.17, 0.17, 0.045, '#455a64', 0, 0.42, 0.345, 20);
      glass.rotation.x = Math.PI / 2;
      g.add(glass);
      g.add(box(0.2, 0.05, 0.02, powered && active ? '#55efc4' : '#455a64', 0.2, 0.78, 0.34));
      if (active && powered) tick = (_dt, t) => { glass.rotation.y = t * 8; };
      break;
    }
    case 'ottoman': {
      g.add(cyl(0.36, 0.36, 0.32, '#d9435d', 0, 0.2, 0, 20));
      g.add(cyl(0.38, 0.38, 0.05, '#c0392b', 0, 0.38, 0, 20));
      g.add(cyl(0.34, 0.34, 0.03, '#f1c40f', 0, 0.04, 0, 20));
      break;
    }
    case 'cabinet': {
      g.add(box(0.8, 1.5, 0.4, '#5d4037', 0, 0.75));
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.2, 0.02), new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.35 }));
      glass.position.set(0, 0.85, 0.21);
      g.add(glass);
      for (const y of [0.55, 0.95, 1.3]) g.add(box(0.68, 0.03, 0.34, '#8d6e63', 0, y));
      g.add(cyl(0.07, 0.05, 0.12, '#f1c40f', -0.15, 1.38, 0, 10));
      g.add(box(0.2, 0.14, 0.04, '#ecf0f1', 0.15, 1.03, 0.08));
      g.add(cyl(0.1, 0.1, 0.03, '#ecf0f1', -0.1, 0.62, 0.05, 14));
      break;
    }
    case 'vase': {
      g.add(cyl(0.16, 0.11, 0.62, '#1f7a8c', 0, 0.31, 0, 14));
      g.add(cyl(0.09, 0.14, 0.12, '#1f7a8c', 0, 0.68, 0, 14));
      for (const [x, z, y, c] of [[-0.1, 0, 0.98, '#ff7eb6'], [0.1, 0.05, 1.05, '#f1c40f'], [0, -0.08, 1.12, '#e74c3c']] as [number, number, number, string][]) {
        g.add(cyl(0.012, 0.012, y - 0.7, '#27ae60', x * 0.6, 0.7 + (y - 0.7) / 2, z, 6));
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(c, { flatShading: true }));
        f.position.set(x, y, z);
        g.add(f);
      }
      break;
    }
    case 'grandclock': {
      g.add(box(0.5, 1.7, 0.34, '#6d4c41', 0, 0.85));
      g.add(box(0.58, 0.1, 0.4, '#4e342e', 0, 1.74));
      g.add(box(0.56, 0.1, 0.4, '#4e342e', 0, 0.05));
      const face = cyl(0.19, 0.19, 0.03, '#fffaf0', 0, 1.38, 0.18, 24);
      face.rotation.x = Math.PI / 2;
      g.add(face);
      g.add(box(0.02, 0.14, 0.02, '#212121', 0, 1.43, 0.2));
      g.add(box(0.1, 0.02, 0.02, '#212121', 0.04, 1.38, 0.2));
      g.add(box(0.3, 0.6, 0.02, '#3e2723', 0, 0.7, 0.18));
      const pend = cyl(0.07, 0.07, 0.02, '#f2c94c', 0, 0.55, 0.2, 14);
      pend.rotation.x = Math.PI / 2;
      g.add(pend);
      break;
    }
    case 'frames': {
      g.add(box(0.7, 0.04, 0.4, '#8d6e63', 0, 0.5));
      legs(g, 0.62, 0.32, 0.5, '#5d4037', 0.03, 0.025);
      for (const [x, h, c] of [[-0.22, 0.26, '#ffcc80'], [0, 0.34, '#90caf9'], [0.22, 0.22, '#a5d6a7']] as [number, number, string][]) {
        g.add(box(0.2, h, 0.03, '#3e2723', x, 0.52 + h / 2, -0.02));
        g.add(box(0.15, h - 0.06, 0.035, c, x, 0.52 + h / 2, -0.015));
      }
      break;
    }
    case 'candles': {
      g.add(cyl(0.3, 0.3, 0.03, '#ecf0f1', 0, 0.015, 0, 20));
      for (const [x, z, h] of [[-0.12, 0.04, 0.34], [0.12, -0.04, 0.26], [0.02, 0.14, 0.2]] as [number, number, number][]) {
        g.add(cyl(0.05, 0.05, h, '#fff3d6', x, 0.03 + h / 2, z, 10));
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff9f1c', emissiveIntensity: 1.4 }));
        flame.position.set(x, 0.07 + h, z);
        g.add(flame);
      }
      break;
    }
    case 'basket': {
      g.add(cyl(0.34, 0.26, 0.4, '#b8863b', 0, 0.2, 0, 18));
      g.add(cyl(0.36, 0.34, 0.05, '#8d6e2f', 0, 0.42, 0, 18));
      g.add(cyl(0.3, 0.3, 0.04, '#e67e22', 0, 0.4, 0, 18));
      g.add(box(0.3, 0.06, 0.2, '#c0392b', 0.05, 0.46, 0.02));
      break;
    }
    case 'trophy': {
      g.add(box(0.6, 0.5, 0.4, '#3e2723', 0, 0.25));
      g.add(box(0.66, 0.05, 0.46, '#5d4037', 0, 0.52));
      for (const [x, s] of [[-0.18, 0.8], [0.05, 1.1], [0.24, 0.7]] as [number, number][]) {
        g.add(cyl(0.02, 0.02, 0.12 * s, '#d4a017', x, 0.57 + 0.06 * s, 0, 8));
        g.add(cyl(0.1 * s, 0.04 * s, 0.16 * s, '#f2c94c', x, 0.7 + 0.08 * s, 0, 12));
      }
      break;
    }
    case 'globe': {
      g.add(cyl(0.2, 0.24, 0.05, '#5d4037', 0, 0.03, 0, 16));
      g.add(cyl(0.025, 0.025, 0.5, '#5d4037', 0, 0.3, 0, 8));
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), mat('#2e86c1', { roughness: 0.5 }));
      ball.position.y = 0.78;
      ball.castShadow = true;
      g.add(ball);
      for (const [x, y, z, s] of [[0.12, 0.84, 0.25, 0.1], [-0.18, 0.72, 0.22, 0.12], [0.2, 0.7, -0.2, 0.09]] as [number, number, number, number][]) g.add(box(s, s * 0.8, 0.04, '#58d68d', x, y, z));
      break;
    }
    case 'speaker': {
      g.add(box(0.5, 1.3, 0.45, '#212121', 0, 0.65));
      const woofer = cyl(0.17, 0.17, 0.04, '#424242', 0, 0.4, 0.23, 20);
      woofer.rotation.x = Math.PI / 2;
      g.add(woofer);
      const tweeter = cyl(0.08, 0.08, 0.04, '#616161', 0, 0.95, 0.23, 16);
      tweeter.rotation.x = Math.PI / 2;
      g.add(tweeter);
      g.add(box(0.08, 0.02, 0.02, powered ? '#55efc4' : '#455a64', 0.17, 1.2, 0.23));
      if (powered) tick = (_dt, t) => { woofer.scale.set(1 + Math.sin(t * 14) * 0.04, 1, 1 + Math.sin(t * 14) * 0.04); };
      break;
    }
    case 'lantern': {
      g.add(cyl(0.2, 0.22, 0.04, '#b8860b', 0, 0.02, 0, 8));
      g.add(cyl(0.18, 0.2, 0.5, new THREE.MeshStandardMaterial({ color: '#ffd28a', emissive: '#ff9f1c', emissiveIntensity: 0.9, transparent: true, opacity: 0.85 }), 0, 0.29, 0, 8));
      g.add(cyl(0.02, 0.2, 0.14, '#b8860b', 0, 0.61, 0, 8));
      g.add(cyl(0.04, 0.04, 0.06, '#b8860b', 0, 0.71, 0, 8));
      for (let i = 0; i < 4; i++) g.add(box(0.025, 0.5, 0.025, '#b8860b', Math.cos(i * 1.57) * 0.18, 0.29, Math.sin(i * 1.57) * 0.18));
      break;
    }
    case 'cactus': {
      g.add(cyl(0.2, 0.15, 0.26, '#d98a63', 0, 0.13, 0, 14));
      g.add(cyl(0.11, 0.12, 0.55, '#2e8b57', 0, 0.52, 0, 10));
      g.add(cyl(0.05, 0.06, 0.22, '#2e8b57', 0.15, 0.55, 0, 8));
      g.add(box(0.14, 0.05, 0.05, '#2e8b57', 0.09, 0.45, 0));
      g.add(cyl(0.05, 0.06, 0.2, '#2e8b57', -0.14, 0.62, 0, 8));
      g.add(box(0.12, 0.05, 0.05, '#2e8b57', -0.09, 0.52, 0));
      break;
    }
    case 'runner': {
      const base = box(0.9, 0.02, 2.8, '#1f4e79', 0, 0.011);
      base.castShadow = false;
      g.add(base);
      for (const z of [-1.0, 0, 1.0]) g.add(Object.assign(box(0.7, 0.022, 0.3, '#f4c27a', 0, 0.012, z), { castShadow: false }));
      g.add(Object.assign(box(0.06, 0.024, 2.6, '#d9435d', 0, 0.013), { castShadow: false }));
      break;
    }
    case 'doormat': {
      g.add(Object.assign(box(0.9, 0.025, 0.6, '#6d4c41', 0, 0.013), { castShadow: false }));
      g.add(Object.assign(box(0.8, 0.028, 0.5, '#a1887f', 0, 0.014), { castShadow: false }));
      for (const x of [-0.24, -0.08, 0.08, 0.24]) g.add(Object.assign(box(0.06, 0.03, 0.1, '#3e2723', x, 0.015), { castShadow: false }));
      break;
    }
    default:
      g.add(box(0.8, 0.8, 0.8, '#ff00ff'));
  }
  return { group: g, tick };
}

/** The head with its face, hair and head accessories, added to `body` with the head centred at (0, 1.03, 0). Used for both kinds of figure:
 *  the little procedural one, and the skinned citizens (which attach this group to their Head bone). Returns the head sphere. */
export function addHead(body: THREE.Group, l: Look): THREE.Mesh {
  const acc = new Set(l.acc ?? []);
  const skin = mat(l.skin, { roughness: 0.65 });
  const hairMat = mat(l.hairColor, { roughness: 0.9 });
  const gold = mat('#f2c94c', { roughness: 0.25, metalness: 0.8 });
  const dark = mat('#14151f', { roughness: 0.3 });
  const part = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };
  const cap = (r: number, h: number) => new THREE.CapsuleGeometry(r, h, 5, 12);
  // head: a face, not a ball
  const head = part(new THREE.SphereGeometry(0.14, 20, 16), skin, 0, 1.03, 0);
  head.scale.set(0.96, 1.05, 0.98);
  body.add(head);
  const face = new THREE.Group();
  face.position.copy(head.position);
  body.add(face);
  const nose = part(new THREE.SphereGeometry(0.02, 8, 6), skin, 0, -0.015, 0.138);
  nose.scale.set(1, 1.1, 1.2);
  face.add(nose);
  for (const x of [-0.14, 0.14]) face.add(part(new THREE.SphereGeometry(0.028, 8, 6), skin, x * 0.95, -0.005, 0));
  for (const x of [-0.05, 0.05]) {
    face.add(part(new THREE.SphereGeometry(0.021, 10, 8), mat('#fffdf7', { roughness: 0.3 }), x, 0.01, 0.12));
    face.add(part(new THREE.SphereGeometry(0.0125, 8, 6), dark, x, 0.01, 0.138));
    const brow = part(new THREE.BoxGeometry(0.05, 0.01, 0.012), hairMat, x, 0.05, 0.128);
    face.add(brow);
  }
  face.add(part(new THREE.BoxGeometry(0.05, 0.011, 0.01), mat('#8a2f3a', { roughness: 0.5 }), 0, -0.065, 0.128));

  const hat = (r: number, part1 = Math.PI / 2.2) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, part1), hairMat);
    m.position.copy(head.position);
    m.scale.copy(head.scale);
    m.castShadow = true;
    return m;
  };
  switch (l.hair) {
    case 'short': body.add(hat(0.15)); break;
    case 'afro': { const a = hat(0.215, Math.PI / 1.7); a.position.y += 0.04; body.add(a); break; }
    case 'braids': {
      body.add(hat(0.152));
      for (let i = 0; i < 7; i++) {
        const ang = 0.1 + (i / 6) * (Math.PI - 0.2); // round the back of the head
        const braid = part(cap(0.02, 0.2), hairMat, Math.cos(ang) * 0.135, 0.9, -Math.sin(ang) * 0.135);
        body.add(braid);
      }
      break;
    }
    case 'locs': {
      body.add(hat(0.155));
      for (let i = 0; i < 9; i++) {
        const ang = (i / 8) * Math.PI;
        body.add(part(cap(0.024, 0.16), hairMat, Math.cos(ang) * 0.14, 0.94, -Math.sin(ang) * 0.14));
      }
      break;
    }
    case 'gele': {
      const g = part(new THREE.TorusGeometry(0.13, 0.065, 10, 20), hairMat, 0, 1.14, -0.02);
      g.rotation.x = Math.PI / 2 - 0.3;
      body.add(g);
      body.add(part(new THREE.CylinderGeometry(0.12, 0.16, 0.1, 14), hairMat, 0, 1.22, -0.03));
      break;
    }
    case 'hijab': {
      body.add(hat(0.168, Math.PI / 1.6));
      body.add(part(new THREE.CylinderGeometry(0.17, 0.23, 0.17, 16), hairMat, 0, 0.85, 0));
      break;
    }
    case 'kufi': body.add(part(new THREE.CylinderGeometry(0.135, 0.14, 0.09, 16), hairMat, 0, 1.13, 0)); break;
    default: break; // bald
  }

  // accessories
  if (acc.has('shades')) {
    for (const x of [-0.053, 0.053]) face.add(part(new THREE.BoxGeometry(0.066, 0.042, 0.016), dark, x, 0.012, 0.135));
    face.add(part(new THREE.BoxGeometry(0.04, 0.01, 0.014), dark, 0, 0.022, 0.135));
  }
  if (acc.has('cap')) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.158, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.1), mat('#e63946', { roughness: 0.6 }));
    c.position.copy(head.position);
    c.position.y += 0.012;
    c.castShadow = true;
    body.add(c);
    body.add(part(new THREE.BoxGeometry(0.2, 0.014, 0.12), mat('#e63946', { roughness: 0.6 }), 0, 1.07, 0.17));
  }
  if (acc.has('earrings')) for (const x of [-0.138, 0.138]) body.add(part(new THREE.TorusGeometry(0.018, 0.005, 6, 12), gold, x, 0.97, 0));

  return head;
}

/** The Sim: a stylised rounded figure about 1.1 units tall, facing +z. The look sets skin, hair, clothes, shoes,
 *  body shape and accessories. Joints (legL, legR, armL, armR, head) are groups, so every pose still works. */
/** What a figure is made of: a body group, the joints the Animator moves, and the root you place in the world. */
export type Sim = {
  root: THREE.Group; body: THREE.Group;
  legL: THREE.Object3D; legR: THREE.Object3D; armL: THREE.Object3D; armR: THREE.Object3D; head: THREE.Object3D;
  kneeL?: THREE.Object3D; kneeR?: THREE.Object3D; elbowL?: THREE.Object3D; elbowR?: THREE.Object3D;   // skinned citizens only
};

let citizenBuilder: ((l: Partial<Look>) => Sim | null) | null = null;
/** The skinned citizens register themselves here (three/citizen.ts), so this file does not need to load their code. */
export function registerCitizenBuilder(fn: (l: Partial<Look>) => Sim | null) {
  citizenBuilder = fn;
}

export function buildSim(look: Partial<Look> | string = {}): Sim {
  const l: Look = typeof look === 'string' ? { ...BASE_LOOK, outfit: look } : { ...BASE_LOOK, ...look };
  if (l.model === 'citizen') {
    const c = citizenBuilder?.(l);   // null until the library has loaded: the classic figure stands in
    if (c) return c;
  }
  const acc = new Set(l.acc ?? []);
  const wide = l.fit === 'strong' ? 1.22 : l.fit === 'slim' ? 0.9 : 1;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = mat(l.skin, { roughness: 0.65 });
  const shirt = mat(l.outfit, { roughness: 0.7 });
  const trousers = mat(l.bottom, { roughness: 0.75 });
  const shoeMat = mat(l.shoes ?? '#f4f4f4', { roughness: 0.5 });
  const gold = mat('#f2c94c', { roughness: 0.25, metalness: 0.8 });

  const part = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };
  const cap = (r: number, h: number) => new THREE.CapsuleGeometry(r, h, 5, 12);

  // legs: thigh + shin in trousers, a shoe at the bottom
  const mkLeg = (x: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.46, 0);
    g.add(part(cap(0.058 * wide, 0.3), trousers, 0, -0.22, 0));
    g.add(part(new THREE.BoxGeometry(0.105 * wide, 0.055, 0.19), shoeMat, 0, -0.455, 0.035));
    g.add(part(new THREE.SphereGeometry(0.052, 10, 8), shoeMat, 0, -0.44, 0.125));
    return g;
  };
  const legL = mkLeg(-0.085 * wide);
  const legR = mkLeg(0.085 * wide);

  // arms: sleeve, bare arm, hand
  const mkArm = (x: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.84, 0);
    g.add(part(cap(0.05 * wide, 0.08), shirt, 0, -0.07, 0));
    g.add(part(cap(0.04 * wide, 0.2), skin, 0, -0.22, 0));
    g.add(part(new THREE.SphereGeometry(0.045, 10, 8), skin, 0, -0.38, 0));
    return g;
  };
  const armL = mkArm(-0.205 * wide);
  const armR = mkArm(0.205 * wide);
  if (acc.has('watch')) armL.add(part(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 12), gold, 0, -0.34, 0));
  body.add(legL, legR, armL, armR);

  // torso with shoulders and hips, neck
  const torso = part(cap(0.115, 0.26), shirt, 0, 0.7, 0);
  torso.scale.set(1.25 * wide, 1, 0.82);
  body.add(torso);
  body.add(part(new THREE.CylinderGeometry(0.04, 0.045, 0.08, 10), skin, 0, 0.9, 0));
  if (l.build === 'f') {
    // a wrapper skirt over the top of the legs
    const skirt = part(new THREE.CylinderGeometry(0.15, 0.25, 0.36, 18), trousers, 0, 0.36, 0);
    body.add(skirt);
  } else {
    body.add(part(cap(0.1, 0.06), trousers, 0, 0.5, 0)).scale.set(1.5 * wide, 1, 0.9);
  }
  if (acc.has('chain')) {
    const c = part(new THREE.TorusGeometry(0.085, 0.012, 8, 20), gold, 0, 0.86, 0.03);
    c.rotation.x = Math.PI / 2 + 0.25;
    body.add(c);
    body.add(part(new THREE.SphereGeometry(0.02, 8, 6), gold, 0, 0.77, 0.1));
  }

  const head = addHead(body, l);

  return { root, body, legL, legR, armL, armR, head };
}


