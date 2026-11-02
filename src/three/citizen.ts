// Skinned "citizen" characters, built on the rig and clips from the character library in public/assets/characters.
//
// What comes from the library: the 17-joint humanoid skeleton (Hips, Spine, Chest, Neck, Head, arms, legs) and its seven clips
// (Idle, Walk, Run, Wave, Sit, Sleep, Dance; used for previews, since Sit and Sleep do not reposition the body). The library's own
// mesh is a set of boxes, so it is not drawn: this file builds a smooth body on the same skeleton instead. Limbs are rounded tubes
// whose vertices blend between two bones at every joint, so elbows, knees and hips bend like real ones, and the torso blends
// down the spine. Outfit, build and height change the shapes, not just the colours. The head, face, hair and accessories come from
// the same code as the small figure (addHead in pieces.ts). In the game the skeleton is driven by the Animator, which blends
// walk, run, sit, sleep, use and drive poses (and bends knees and elbows).

import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { addHead, registerCitizenBuilder, type Sim } from "./pieces";
import type { Look } from "../data/characters";
import { citizenLook } from "../data/citizens";

export const CITIZEN_COUNT = 24;
export type Outfit = "tee" | "long" | "tank" | "shorts" | "dress" | "kaftan";
export const OUTFITS: Outfit[] = ["tee", "long", "tank", "shorts", "dress", "kaftan"];
export type Stature = "short" | "average" | "tall";
export const STATURES: Stature[] = ["short", "average", "tall"];

/** The look of library citizen `n` (1 to 24): its skin tone, shirt colour, trousers and hair, as the library defines them. */
export function citizenPalette(n: number) {
  const l = citizenLook(n);
  return { skin: l.skin!, outfit: l.outfit!, bottom: l.bottom!, hairColor: l.hairColor! };
}

// --------------------------------------------------------------------------------------------- the body, as skinned tubes

export type Role = "skin" | "shirt" | "pants" | "shoes";
export type BonePos = Record<string, [number, number, number]>;
export type Part = { role: Role; positions: number[]; indices: number[]; boneNames: string[][]; weights: number[][] };
type Blend = [string, number][];

const smooth = (t: number) => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };

/** A tube standing upright: rings of ellipses, one above the other. `weights(y)` says which bones each ring follows. */
function loft(rings: { y: number; rx: number; rz?: number; cx?: number; cz?: number }[], role: Role, weights: (y: number) => Blend, seg = 12): Part {
  const part: Part = { role, positions: [], indices: [], boneNames: [], weights: [] };
  const n = rings.length;
  for (const r of rings) {
    const w = weights(r.y);
    for (let k = 0; k < seg; k++) {
      const a = (k / seg) * Math.PI * 2;
      part.positions.push((r.cx ?? 0) + Math.cos(a) * r.rx, r.y, (r.cz ?? 0) + Math.sin(a) * (r.rz ?? r.rx));
      part.boneNames.push(w.map(b => b[0]));
      part.weights.push(w.map(b => b[1]));
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < seg; k++) {
      const a = i * seg + k, b = i * seg + ((k + 1) % seg), c = (i + 1) * seg + k, d = (i + 1) * seg + ((k + 1) % seg);
      part.indices.push(a, c, b, b, c, d);
    }
  }
  // close both ends with a fan
  for (const [ring, up] of [[0, true], [n - 1, false]] as [number, boolean][]) {
    const r = rings[ring], w = weights(r.y);
    const centre = part.positions.length / 3;
    part.positions.push(r.cx ?? 0, r.y, r.cz ?? 0);
    part.boneNames.push(w.map(b => b[0]));
    part.weights.push(w.map(b => b[1]));
    for (let k = 0; k < seg; k++) {
      const a = ring * seg + k, b = ring * seg + ((k + 1) % seg);
      part.indices.push(centre, ...(up ? [b, a] : [a, b]));
    }
  }
  return part;
}

/** A squashed ball, rigid on one bone (feet, hands). */
function ellipsoid(c: [number, number, number], r: [number, number, number], bone: string | Blend, role: Role): Part {
  const blend: Blend = typeof bone === "string" ? [[bone, 1]] : bone;
  const part: Part = { role, positions: [], indices: [], boneNames: [], weights: [] };
  const lat = 8, lon = 12;
  for (let i = 0; i <= lat; i++) {
    const v = (i / lat) * Math.PI;
    for (let j = 0; j < lon; j++) {
      const u = (j / lon) * Math.PI * 2;
      part.positions.push(c[0] + Math.cos(u) * Math.sin(v) * r[0], c[1] + Math.cos(v) * r[1], c[2] + Math.sin(u) * Math.sin(v) * r[2]);
      part.boneNames.push(blend.map(b => b[0]));
      part.weights.push(blend.map(b => b[1]));
    }
  }
  for (let i = 0; i < lat; i++) {
    for (let j = 0; j < lon; j++) {
      const a = i * lon + j, b = i * lon + ((j + 1) % lon), c2 = (i + 1) * lon + j, d = (i + 1) * lon + ((j + 1) % lon);
      part.indices.push(a, c2, b, b, c2, d);
    }
  }
  return part;
}

/** A radius profile: linear between (y, r) stops. */
const profile = (stops: [number, number][], y: number) => {
  for (let i = 0; i < stops.length - 1; i++) {
    const [y0, r0] = stops[i], [y1, r1] = stops[i + 1];
    if (y <= y0 && y >= y1) return r0 + ((r1 - r0) * (y0 - y)) / (y0 - y1 || 1);
  }
  return stops[stops.length - 1][1];
};

const linspace = (from: number, to: number, n: number) => Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1));

export type BodyStyle = { fit: "slim" | "regular" | "strong"; build: "m" | "f"; outfit: Outfit };

/** Every part of the body, with the bones each vertex follows and how much. Pure maths on the skeleton's rest positions, so it can be tested. */
export function bodyParts(b: BonePos, style: BodyStyle): Part[] {
  const f = style.fit === "strong" ? 1.14 : style.fit === "slim" ? 0.9 : 1;
  const female = style.build === "f";
  const parts: Part[] = [];
  const Y = (n: string) => b[n][1];
  const { outfit } = style;
  const dress = outfit === "dress", kaftan = outfit === "kaftan";

  // ---- torso and pelvis, blended down the spine
  const spineStops: [string, number][] = [["Hips", Y("Hips")], ["Spine", Y("Spine")], ["Chest", Y("Chest")], ["Neck", Y("Neck")]];
  const along = (y: number): Blend => {
    if (y <= spineStops[0][1]) return [["Hips", 1]];
    for (let i = 0; i < spineStops.length - 1; i++) {
      const [a, ya] = spineStops[i], [c, yc] = spineStops[i + 1];
      if (y <= yc) { const t = (y - ya) / (yc - ya); return [[a, 1 - t], [c, t]]; }
    }
    return [["Neck", 1]];
  };
  const waist = female ? 0.85 : 1, bust = female ? 0.95 : 1, shoulder = female ? 0.9 : 1;
  const torsoStops: [number, number][] = [[1.74, 0.07], [1.69, 0.2 * shoulder], [1.58, 0.245 * shoulder], [1.42, 0.21 * bust], [1.25, 0.18 * waist], [1.12, 0.185], [1.04, 0.19]];
  const hipW = female ? 1.1 : 1;
  parts.push(loft(linspace(1.74, 1.06, 12).map(y => ({ y, rx: profile(torsoStops, y) * f, rz: profile(torsoStops, y) * 0.6 * (female && y > 1.45 ? 1.08 : 1) })), "shirt", along));
  parts.push(loft(linspace(1.12, 0.9, 6).map(y => ({ y, rx: (y > 1.0 ? 0.19 : 0.17 + (y - 0.9) * 0.2) * f * hipW, rz: 0.125 * (y > 1.0 ? 1 : 0.9) })), "pants", () => [["Hips", 1]]));
  // neck
  parts.push(loft(linspace(1.78, 1.62, 4).map(y => ({ y, rx: 0.055 })), "skin", y => (y > Y("Neck") - 0.04 ? [["Neck", 1]] : [["Chest", 0.5], ["Neck", 0.5]])));

  // ---- arms and legs: a tube per limb, bending at the joints
  const limb = (side: 1 | -1, top: string, mid: string, end: string, radii: [number, number, number, number], tube: { top: number; bottom: number }, cut: number, upper: Role, lower: Role, zone = 0.06) => {
    const x = b[top][0] * (side === 1 ? 1 : 1);
    const yMid = Y(mid), yEnd = Y(end);
    const w = (y: number): Blend => {
      if (y > yMid + zone) return [[top, 1]];
      if (y > yMid - zone) { const t = smooth((yMid + zone - y) / (2 * zone)); return [[top, 1 - t], [mid, t]]; }
      if (y > yEnd + zone) return [[mid, 1]];
      if (y > yEnd - zone) { const t = smooth((yEnd + zone - y) / (2 * zone)); return [[mid, 1 - t], [end, t]]; }
      return [[end, 1]];
    };
    const stops = ([[tube.top, radii[0]], [yMid, radii[1]], [yEnd, radii[2]], [tube.bottom, radii[3]]] as [number, number][]).sort((p, q) => q[0] - p[0]);
    const r = (y: number) => profile(stops, y);
    const ys = linspace(tube.top, tube.bottom, 16);
    // split at the sleeve or hem, sharing one ring so there is no gap between the two parts
    const at = ys.findIndex(y => y < cut);
    const upperYs = at < 0 ? ys : ys.slice(0, at + 1);
    const lowerYs = at < 0 ? [] : at === 0 ? ys : ys.slice(at);
    if (upperYs.length > 1 && at !== 0) parts.push(loft(upperYs.map(y => ({ y, rx: r(y) * f * (upper === "skin" ? 1 : 1.12), cx: x })), upper, w));
    if (lowerYs.length > 1) parts.push(loft(lowerYs.map(y => ({ y, rx: r(y) * f, cx: x })), lower, w));
  };
  const sleeveCut = outfit === "tank" ? 9 : outfit === "long" ? Y("LeftHand") + 0.04 : Y("LeftLowerArm") + 0.1;   // above this the arm is in the sleeve
  const armRoleTop: Role = outfit === "tank" ? "skin" : "shirt";
  for (const [side, pre] of [[1, "Left"], [-1, "Right"]] as [1 | -1, string][]) {
    limb(side, `${pre}UpperArm`, `${pre}LowerArm`, `${pre}Hand`, [0.08, 0.062, 0.045, 0.045], { top: Y(`${pre}UpperArm`) + 0.03, bottom: Y(`${pre}Hand`) - 0.04 }, sleeveCut, armRoleTop, "skin");
    parts.push(ellipsoid([b[`${pre}Hand`][0], Y(`${pre}Hand`) - 0.05, 0.01], [0.045 * f, 0.065, 0.034], `${pre}Hand`, "skin"));
    // a rounded shoulder, so the top of the arm is not a flat cap
    parts.push(ellipsoid([b[`${pre}UpperArm`][0] - side * 0.02, Y(`${pre}UpperArm`) - 0.005, 0], [0.1 * f * shoulder, 0.1, 0.095 * f], [[`${pre}UpperArm`, 0.7], ["Chest", 0.3]], armRoleTop));
    // legs
    const legCut = outfit === "shorts" ? Y(`${pre}LowerLeg`) + 0.14 : dress ? 9 : outfit === "long" || outfit === "tee" || outfit === "tank" || kaftan ? -9 : -9;
    const upperRole: Role = dress ? "skin" : "pants";
    limb(side, `${pre}UpperLeg`, `${pre}LowerLeg`, `${pre}Foot`, [0.105, 0.072, 0.056, 0.058], { top: Y(`${pre}UpperLeg`) + 0.05, bottom: Y(`${pre}Foot`) + 0.04 }, legCut, upperRole, outfit === "shorts" || dress ? "skin" : "pants", 0.07);
    // shoes: a rounded toe-box in front of the ankle
    parts.push(ellipsoid([b[`${pre}Foot`][0], 0.07, 0.07], [0.062, 0.062, 0.15], `${pre}Foot`, "shoes"));
  }

  // ---- skirts and long robes (rigid on the hips)
  if (female || dress) {
    const bottom = dress ? 0.5 : 0.62;
    parts.push(loft(linspace(1.02, bottom, 6).map(y => ({ y, rx: 0.2 + (1.02 - y) * 0.45, rz: 0.17 + (1.02 - y) * 0.4 })), dress ? "shirt" : "pants", y => (y > 0.8 ? [["Hips", 1]] : [["Hips", 0.8], ["LeftUpperLeg", 0.1], ["RightUpperLeg", 0.1]])));
  }
  if (kaftan) {
    parts.push(loft(linspace(1.5, 0.42, 9).map(y => ({ y, rx: (0.25 + (1.5 - y) * 0.16) * f, rz: 0.17 + (1.5 - y) * 0.13 })), "shirt", y => (y > 1.2 ? along(y) : [["Hips", 0.8], ["LeftUpperLeg", 0.1], ["RightUpperLeg", 0.1]])));
  }
  return parts;
}

// --------------------------------------------------------------------------------------------- loading and building

let loaded: GLTF | null = null;
let loading: Promise<void> | null = null;

/** Fetch the library (one file is enough: all 24 share a skeleton and clips). Safe to call many times. */
export function loadCitizens(): Promise<void> {
  loading ??= new GLTFLoader()
    .loadAsync(`${import.meta.env.BASE_URL}assets/characters/humanoid_citizen_01.glb`)
    .then(g => { loaded = g; });
  return loading;
}

export const citizensReady = () => loaded !== null;

/** Feed a parsed library file in directly (for tests, or when it is loaded some other way). */
export function useLoadedCitizen(g: GLTF) {
  loaded = g;
}

export type Citizen = Sim & {
  mixer: THREE.AnimationMixer;
  clips: Record<string, THREE.AnimationClip>;
  /** Play one of the library's clips on the skeleton (for previews): Idle, Walk, Run, Wave, Sit, Sleep or Dance. */
  playClip: (name: string | null) => void;
};

const HEIGHT_OF: Record<Stature, number> = { short: 0.94, average: 1, tall: 1.07 };
/** The skeleton is about 2 m tall; the game's figures are about 1.2, so a citizen is drawn at this scale. */
const GAME_SCALE = 0.6;

export function buildCitizen(look: Partial<Look>): Citizen | null {
  if (!loaded) return null;
  const l = look;
  const scene = clone(loaded.scene) as THREE.Group;
  const bones: Record<string, THREE.Bone> = {};
  scene.traverse(o => { if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone; });
  const source: THREE.SkinnedMesh[] = [];
  scene.traverse(o => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) source.push(o as THREE.SkinnedMesh); });
  const skeleton = source[0].skeleton;
  const bindMatrix = source[0].bindMatrix.clone();
  const boneIndex = Object.fromEntries(skeleton.bones.map((b, i) => [b.name, i]));
  scene.updateMatrixWorld(true);
  const pos: BonePos = {};
  for (const bone of skeleton.bones) { const v = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld); pos[bone.name] = [v.x, v.y, v.z]; }
  for (const s of source) s.removeFromParent();

  const outfit = (OUTFITS as string[]).includes(l.style ?? "") ? (l.style as Outfit) : "tee";
  const parts = bodyParts(pos, { fit: l.fit ?? "regular", build: l.build ?? "m", outfit });
  const colours: Record<Role, string> = { skin: l.skin ?? "#7b4a2d", shirt: l.outfit ?? "#e67e22", pants: l.bottom ?? "#34495e", shoes: l.shoes ?? "#f4f4f4" };
  const materials: Record<Role, THREE.MeshStandardMaterial> = {
    skin: new THREE.MeshStandardMaterial({ color: colours.skin, roughness: 0.62 }),
    shirt: new THREE.MeshStandardMaterial({ color: colours.shirt, roughness: 0.75, side: THREE.DoubleSide }),
    pants: new THREE.MeshStandardMaterial({ color: colours.pants, roughness: 0.8, side: THREE.DoubleSide }),
    shoes: new THREE.MeshStandardMaterial({ color: colours.shoes, roughness: 0.5 }),
  };
  for (const part of parts) {
    const geo = new THREE.BufferGeometry();
    const count = part.positions.length / 3;
    const si = new Uint16Array(count * 4), sw = new Float32Array(count * 4);
    for (let v = 0; v < count; v++) {
      const names = part.boneNames[v], ws = part.weights[v];
      const total = ws.reduce((a, c) => a + c, 0) || 1;
      names.slice(0, 4).forEach((n, k) => { si[v * 4 + k] = boneIndex[n] ?? 0; sw[v * 4 + k] = ws[k] / total; });
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(part.positions, 3));
    geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
    geo.setIndex(part.indices);
    geo.computeVertexNormals();
    const mesh = new THREE.SkinnedMesh(geo, materials[part.role]);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    mesh.bind(skeleton, bindMatrix);
  }

  // the head: the same face, hair and accessories as the small figure, set on the Head bone
  const headStuff = new THREE.Group();
  addHead(headStuff, { ...(l as Look), hair: l.hair ?? "short" });
  headStuff.position.set(0, -1.03 - 0.1, 0);
  bones.Head.add(headStuff);

  const root = new THREE.Group();
  const body = new THREE.Group();
  const size = new THREE.Group();
  size.scale.setScalar(GAME_SCALE * HEIGHT_OF[(l.stature as Stature) ?? "average"]);
  size.add(scene);
  body.add(size);
  root.add(body);

  const mixer = new THREE.AnimationMixer(scene);
  const clips = Object.fromEntries(loaded.animations.map(c => [c.name, c]));
  let playing: THREE.AnimationAction | null = null;
  return {
    root, body,
    legL: bones.LeftUpperLeg, legR: bones.RightUpperLeg, armL: bones.LeftUpperArm, armR: bones.RightUpperArm, head: bones.Head,
    kneeL: bones.LeftLowerLeg, kneeR: bones.RightLowerLeg, elbowL: bones.LeftLowerArm, elbowR: bones.RightLowerArm,
    mixer, clips,
    playClip(name) {
      playing?.fadeOut(0.25);
      playing = null;
      if (name && clips[name]) playing = mixer.clipAction(clips[name]).reset().fadeIn(0.25).play();
    },
  };
}

registerCitizenBuilder(l => buildCitizen(l));
