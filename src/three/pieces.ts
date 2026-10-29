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
    default:
      g.add(box(0.8, 0.8, 0.8, '#ff00ff'));
  }
  return { group: g, tick };
}

/** The Sim: blocky but friendly, ~1.05 units tall, facing +z. */
/** The Sim: blocky but friendly, ~1.05 units tall, facing +z. The look sets skin, hair and clothes. */
export function buildSim(look: Partial<Look> | string = {}) {
  const l: Look = typeof look === 'string' ? { ...BASE_LOOK, outfit: look } : { ...BASE_LOOK, ...look };
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = mat(l.skin);
  const shirt = mat(l.outfit);
  const trousers = mat(l.bottom);
  const hairMat = mat(l.hairColor);
  const legL = new THREE.Group(); legL.position.set(-0.09, 0.45, 0);
  const legR = new THREE.Group(); legR.position.set(0.09, 0.45, 0);
  legL.add(box(0.13, 0.45, 0.14, trousers, 0, -0.225, 0));
  legR.add(box(0.13, 0.45, 0.14, trousers, 0, -0.225, 0));
  const armL = new THREE.Group(); armL.position.set(-0.24, 0.82, 0);
  const armR = new THREE.Group(); armR.position.set(0.24, 0.82, 0);
  armL.add(box(0.09, 0.36, 0.1, skin, 0, -0.18, 0));
  armR.add(box(0.09, 0.36, 0.1, skin, 0, -0.18, 0));
  armL.add(box(0.11, 0.14, 0.12, shirt, 0, -0.04, 0));
  armR.add(box(0.11, 0.14, 0.12, shirt, 0, -0.04, 0));
  body.add(legL, legR, armL, armR);
  body.add(box(l.build === 'f' ? 0.34 : 0.38, 0.42, 0.2, shirt, 0, 0.66, 0));
  if (l.build === 'f') {
    // A wrapper skirt over the top of the legs
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.36, 12), trousers);
    skirt.position.set(0, 0.32, 0);
    skirt.castShadow = true;
    body.add(skirt);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), skin);
  head.position.set(0, 1.0, 0);
  head.castShadow = true;
  body.add(head);
  const cap = (r: number, part = Math.PI / 2.2) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, part), hairMat);
    m.position.copy(head.position);
    m.castShadow = true;
    return m;
  };
  switch (l.hair) {
    case 'short': body.add(cap(0.145)); break;
    case 'afro': { const a = cap(0.2, Math.PI / 1.8); a.position.y += 0.04; body.add(a); break; }
    case 'braids': {
      body.add(cap(0.148));
      for (let i = 0; i < 6; i++) {
        const ang = 0.15 + (i / 5) * (Math.PI - 0.3); // round the back of the head
        body.add(cyl(0.018, 0.018, 0.26, hairMat, Math.cos(ang) * 0.13, 0.9, -Math.sin(ang) * 0.13, 6));
      }
      break;
    }
    case 'locs': {
      body.add(cap(0.15));
      for (let i = 0; i < 8; i++) {
        const ang = (i / 7) * Math.PI; // round the back of the head
        body.add(cyl(0.022, 0.022, 0.2, hairMat, Math.cos(ang) * 0.14, 0.93, -Math.sin(ang) * 0.14, 6));
      }
      break;
    }
    case 'gele': {
      const g = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.06, 8, 16), hairMat);
      g.rotation.x = Math.PI / 2 - 0.3;
      g.position.set(0, 1.12, -0.02);
      body.add(g);
      body.add(cyl(0.12, 0.16, 0.1, hairMat, 0, 1.2, -0.03, 12));
      break;
    }
    case 'hijab': {
      const h = cap(0.165, Math.PI / 1.6);
      body.add(h);
      body.add(cyl(0.17, 0.22, 0.16, hairMat, 0, 0.84, 0, 14));
      break;
    }
    case 'kufi': body.add(cyl(0.135, 0.14, 0.09, hairMat, 0, 1.11, 0, 14)); break;
    default: break; // bald
  }
  for (const x of [-0.05, 0.05]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: '#111' }));
    eye.position.set(x, 1.02, 0.13);
    body.add(eye);
  }
  return { root, body, legL, legR, armL, armR, head };
}

