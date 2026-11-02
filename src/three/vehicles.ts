// The vehicles you can buy, built from shapes in code. They face +z (the headlights are at the front).
// Each one returns its wheels (to spin and steer), its lights (to switch on) and its size.

import * as THREE from "three";
import { box, mat } from "./pieces";
import type { CarId } from "../data/estate";

export type Vehicle3D = {
  group: THREE.Group;
  wheels: THREE.Group[];        // spin about x
  front: THREE.Group[];         // the front wheels (steer about y)
  head: THREE.MeshStandardMaterial[];
  brake: THREE.MeshStandardMaterial[];
  length: number;
  width: number;
  wheelR: number;
};

const glass = () => mat("#1f2d3a", { roughness: 0.15, metalness: 0.4 });
const dark = () => mat("#15161b", { roughness: 0.5 });
const chrome = () => mat("#d8dde3", { roughness: 0.2, metalness: 0.9 });

function wheel(r: number, w: number, rim = "#cfd4da") {
  const pivot = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 18), mat("#16171c", { roughness: 0.9 }));
  tyre.rotation.z = Math.PI / 2;
  tyre.castShadow = true;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, w + 0.02, 10), mat(rim, { roughness: 0.25, metalness: 0.8 }));
  hub.rotation.z = Math.PI / 2;
  pivot.add(tyre, hub);
  return pivot;
}

export function buildVehicle(model: CarId, color: string): Vehicle3D {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.35, metalness: 0.35 });
  const head: THREE.MeshStandardMaterial[] = [];
  const brake: THREE.MeshStandardMaterial[] = [];
  const wheels: THREE.Group[] = [];
  const front: THREE.Group[] = [];

  const lamp = (x: number, y: number, z: number, w: number, isHead: boolean) => {
    const m = mat(isHead ? "#fff7d1" : "#7a1010", { emissive: isHead ? "#fff3b0" : "#ff2a2a", emissiveIntensity: 0, roughness: 0.2 });
    (isHead ? head : brake).push(m);
    g.add(box(w, 0.16, 0.06, m, x, y, z));
  };
  const addWheels = (xs: number[], zs: number[], r: number, w: number, rim?: string) => {
    for (const z of zs) for (const x of xs) {
      const p = wheel(r, w, rim);
      p.position.set(x, r, z);
      // spin goes on an inner group so steering (outer y) and rolling (inner x) do not fight
      const outer = new THREE.Group();
      outer.position.copy(p.position);
      p.position.set(0, 0, 0);
      outer.add(p);
      g.add(outer);
      wheels.push(p);
      if (z === zs[zs.length - 1]) front.push(outer);
    }
  };

  let length = 4.4, width = 1.9, wheelR = 0.36;
  switch (model) {
    case "compact": {
      length = 3.7; width = 1.7; wheelR = 0.32;
      g.add(box(1.7, 0.62, 3.6, body, 0, 0.66));
      g.add(box(1.5, 0.62, 2.0, glass(), 0, 1.26, -0.25));
      g.add(box(1.52, 0.06, 2.0, body, 0, 1.6, -0.25));
      addWheels([-0.78, 0.78], [-1.15, 1.15], wheelR, 0.22);
      lamp(-0.55, 0.78, 1.8, 0.3, true); lamp(0.55, 0.78, 1.8, 0.3, true);
      lamp(-0.55, 0.78, -1.81, 0.3, false); lamp(0.55, 0.78, -1.81, 0.3, false);
      break;
    }
    case "sedan": {
      length = 4.6; width = 1.85; wheelR = 0.36;
      g.add(box(1.85, 0.68, 4.5, body, 0, 0.7));
      g.add(box(1.65, 0.58, 2.3, glass(), 0, 1.3, -0.3));
      g.add(box(1.68, 0.06, 2.3, body, 0, 1.62, -0.3));
      g.add(box(1.8, 0.05, 0.9, body, 0, 1.06, 1.45)); // bonnet
      addWheels([-0.88, 0.88], [-1.4, 1.4], wheelR, 0.24);
      lamp(-0.62, 0.84, 2.26, 0.34, true); lamp(0.62, 0.84, 2.26, 0.34, true);
      lamp(-0.62, 0.9, -2.26, 0.34, false); lamp(0.62, 0.9, -2.26, 0.34, false);
      break;
    }
    case "suv": {
      length = 4.8; width = 2.0; wheelR = 0.44;
      g.add(box(2.0, 0.95, 4.7, body, 0, 0.95));
      g.add(box(1.9, 0.78, 3.1, glass(), 0, 1.78, -0.35));
      g.add(box(1.92, 0.07, 3.1, body, 0, 2.2, -0.35));
      for (const x of [-0.8, 0.8]) g.add(box(0.07, 0.07, 2.6, chrome(), x, 2.27, -0.35));
      addWheels([-0.95, 0.95], [-1.5, 1.5], wheelR, 0.28);
      lamp(-0.7, 1.15, 2.36, 0.4, true); lamp(0.7, 1.15, 2.36, 0.4, true);
      lamp(-0.7, 1.2, -2.36, 0.4, false); lamp(0.7, 1.2, -2.36, 0.4, false);
      break;
    }
    case "luxury": {
      length = 5.1; width = 1.95; wheelR = 0.4;
      g.add(box(1.95, 0.66, 5.0, body, 0, 0.74));
      g.add(box(1.7, 0.52, 2.5, glass(), 0, 1.33, -0.35));
      g.add(box(1.72, 0.06, 2.5, body, 0, 1.62, -0.35));
      g.add(box(1.2, 0.34, 0.06, chrome(), 0, 0.76, 2.51)); // grille
      g.add(box(1.97, 0.06, 5.02, chrome(), 0, 0.46, 0));  // side trim
      addWheels([-0.93, 0.93], [-1.6, 1.6], wheelR, 0.26, "#e9edf2");
      lamp(-0.7, 0.92, 2.5, 0.36, true); lamp(0.7, 0.92, 2.5, 0.36, true);
      lamp(-0.7, 0.95, -2.51, 0.4, false); lamp(0.7, 0.95, -2.51, 0.4, false);
      break;
    }
    case "sports": {
      length = 4.5; width = 2.0; wheelR = 0.36;
      g.add(box(2.0, 0.5, 4.4, body, 0, 0.5));
      g.add(box(1.5, 0.4, 1.7, glass(), 0, 0.95, -0.35));
      g.add(box(1.52, 0.05, 1.7, body, 0, 1.17, -0.35));
      g.add(box(1.95, 0.05, 1.2, body, 0, 0.78, 1.45)); // long bonnet
      g.add(box(1.9, 0.07, 0.5, dark(), 0, 1.05, -2.1)); // spoiler
      for (const x of [-0.8, 0.8]) g.add(box(0.06, 0.3, 0.06, dark(), x, 0.9, -2.0));
      addWheels([-0.95, 0.95], [-1.4, 1.4], wheelR, 0.3, "#f0f0f0");
      lamp(-0.7, 0.58, 2.2, 0.4, true); lamp(0.7, 0.58, 2.2, 0.4, true);
      lamp(-0.7, 0.7, -2.2, 0.5, false); lamp(0.7, 0.7, -2.2, 0.5, false);
      break;
    }
    case "pickup": {
      length = 5.2; width = 2.0; wheelR = 0.42;
      g.add(box(2.0, 0.75, 5.2, body, 0, 0.9));
      g.add(box(1.95, 0.85, 1.7, body, 0, 1.7, 1.0));       // cab
      g.add(box(1.8, 0.55, 1.4, glass(), 0, 1.78, 1.0));
      g.add(box(1.8, 0.14, 2.3, dark(), 0, 1.3, -1.35));    // bed floor
      for (const x of [-0.93, 0.93]) g.add(box(0.1, 0.55, 2.3, body, x, 1.55, -1.35));
      g.add(box(1.9, 0.55, 0.1, body, 0, 1.55, -2.5));
      addWheels([-0.95, 0.95], [-1.6, 1.6], wheelR, 0.28);
      lamp(-0.7, 1.05, 2.6, 0.38, true); lamp(0.7, 1.05, 2.6, 0.38, true);
      lamp(-0.78, 1.15, -2.61, 0.3, false); lamp(0.78, 1.15, -2.61, 0.3, false);
      break;
    }
    case "bike": {
      length = 2.1; width = 0.8; wheelR = 0.38;
      addWheels([0], [-0.8, 0.8], wheelR, 0.16);
      g.add(box(0.28, 0.3, 0.9, body, 0, 0.78, 0.15));        // tank
      g.add(box(0.26, 0.12, 0.8, dark(), 0, 0.72, -0.5));     // seat
      g.add(box(0.2, 0.3, 0.7, dark(), 0, 0.5, 0));            // engine
      g.add(box(0.7, 0.05, 0.05, dark(), 0, 1.13, 0.62));     // handlebar
      g.add(box(0.05, 0.6, 0.05, chrome(), 0, 0.78, 0.7));    // fork
      lamp(0, 1.0, 0.86, 0.22, true);
      lamp(0, 0.82, -0.98, 0.2, false);
      break;
    }
  }
  g.traverse(o => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return { group: g, wheels, front, head, brake, length, width, wheelR };
}

/** Switch the lamps: headlights on at night or when asked, brake lights while braking. */
export function setLights(v: Vehicle3D, headOn: boolean, brakeOn: boolean) {
  for (const m of v.head) m.emissiveIntensity = headOn ? 2.2 : 0;
  for (const m of v.brake) m.emissiveIntensity = brakeOn ? 2.4 : headOn ? 0.5 : 0;
}
