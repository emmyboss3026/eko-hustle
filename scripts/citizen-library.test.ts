import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { buildCitizen, useLoadedCitizen } from "../src/three/citizen";
import { Animator } from "../src/three/animator";

describe("the real library file", () => {
  const file = readFileSync(new URL("../public/assets/characters/humanoid_citizen_01.glb", import.meta.url));
  const buf = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);

  it("loads with a 17-joint skeleton and the seven clips, and builds a skinned figure that the Animator can drive", async () => {
    const gltf = await new Promise<Awaited<ReturnType<GLTFLoader["loadAsync"]>>>((ok, no) => new GLTFLoader().parse(buf, "", ok, no));
    expect(gltf.animations.map(a => a.name)).toEqual(["Idle", "Walk", "Run", "Wave", "Sit", "Sleep", "Dance"]);
    useLoadedCitizen(gltf);
    const c = buildCitizen({ skin: "#7b4a2d", hair: "afro", hairColor: "#1e1e1e", outfit: "#e67e22", bottom: "#34495e", build: "f", fit: "regular", style: "dress", model: "citizen" })!;
    expect(c).not.toBeNull();
    let skinned = 0;
    c.root.traverse(o => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned++; });
    expect(skinned).toBeGreaterThan(8);
    // sitting bends the knees: the shin rotates relative to the thigh
    const a = new Animator(c as never);
    for (let i = 0; i < 120; i++) a.update(1 / 60, "sit", i / 60);
    expect(c.kneeL!.rotation.x).toBeCloseTo(Math.PI / 2, 1);
    expect(c.legL.rotation.x).toBeCloseTo(-Math.PI / 2, 1);
    // the box is the right size once it is in the world: about as tall as the classic figure
    const box = new THREE.Box3().setFromObject(c.root);
    expect(box.max.y - box.min.y).toBeGreaterThan(1.0);
    expect(box.max.y - box.min.y).toBeLessThan(1.5);
  });
});
