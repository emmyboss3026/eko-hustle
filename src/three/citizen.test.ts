import { describe, it, expect } from "vitest";
import { CITIZEN_COUNT, OUTFITS, bodyParts, citizenPalette, type BonePos } from "./citizen";

// the library's rest positions (from its build script): each joint's world position
const POS: BonePos = {
  Hips: [0, 1.02, 0], Spine: [0, 1.18, 0], Chest: [0, 1.5, 0], Neck: [0, 1.75, 0], Head: [0, 1.9, 0],
  LeftUpperArm: [.29, 1.68, 0], LeftLowerArm: [.29, 1.37, 0], LeftHand: [.29, 1.1, 0],
  RightUpperArm: [-.29, 1.68, 0], RightLowerArm: [-.29, 1.37, 0], RightHand: [-.29, 1.1, 0],
  LeftUpperLeg: [.13, .93, 0], LeftLowerLeg: [.13, .5, 0], LeftFoot: [.13, .08, 0],
  RightUpperLeg: [-.13, .93, 0], RightLowerLeg: [-.13, .5, 0], RightFoot: [-.13, .08, 0],
};

describe("citizen bodies", () => {
  it("every outfit, build and fit makes a closed, well-formed set of parts", () => {
    for (const outfit of OUTFITS) for (const build of ["m", "f"] as const) for (const fit of ["slim", "regular", "strong"] as const) {
      const parts = bodyParts(POS, { fit, build, outfit });
      expect(parts.length, `${outfit}/${build}/${fit}`).toBeGreaterThan(8);
      for (const p of parts) {
        const n = p.positions.length / 3;
        expect(p.boneNames.length).toBe(n);
        expect(Math.max(...p.indices)).toBeLessThan(n);
        for (let v = 0; v < n; v++) {
          expect(p.boneNames[v].length).toBeLessThanOrEqual(4);
          expect(p.boneNames[v].every(b => b in POS), `${p.role} bone`).toBe(true);
          expect(p.weights[v].reduce((a, c) => a + c, 0)).toBeGreaterThan(0.99);
        }
      }
    }
  });

  it("a person is about two metres tall with feet on the floor and arms either side of the body", () => {
    const parts = bodyParts(POS, { fit: "regular", build: "m", outfit: "tee" });
    const ys = parts.flatMap(p => p.positions.filter((_, i) => i % 3 === 1));
    expect(Math.min(...ys)).toBeGreaterThan(-0.02);
    expect(Math.min(...ys)).toBeLessThan(0.05);
    expect(Math.max(...ys)).toBeGreaterThan(1.7);
    expect(Math.max(...ys)).toBeLessThan(1.85);          // the head (about 0.3 more) comes from addHead
    const xs = parts.flatMap(p => p.positions.filter((_, i) => i % 3 === 0));
    expect(Math.max(...xs)).toBeGreaterThan(0.3);
    expect(Math.max(...xs)).toBeLessThan(0.5);
  });

  it("outfits change the shapes: shorts show bare shins, a tank top bare arms, a dress a skirt", () => {
    const roles = (o: (typeof OUTFITS)[number]) => bodyParts(POS, { fit: "regular", build: "m", outfit: o });
    const skinBelow = (o: (typeof OUTFITS)[number], y: number) => roles(o).filter(p => p.role === "skin").some(p => p.positions.some((_, i) => i % 3 === 1 && p.positions[i] < y && Math.abs(p.positions[i - 1]) > 0.08 && Math.abs(p.positions[i - 1]) < 0.2));
    expect(skinBelow("shorts", 0.45)).toBe(true);
    expect(skinBelow("tee", 0.45)).toBe(false);
    expect(roles("dress").some(p => p.role === "shirt" && Math.min(...p.positions.filter((_, i) => i % 3 === 1)) < 0.6)).toBe(true);
    expect(roles("tank").some(p => p.role === "skin" && p.positions.some((_, i) => i % 3 === 1 && p.positions[i] > 1.5 && Math.abs(p.positions[i - 1]) > 0.28))).toBe(true);
  });

  it("the 24 library palettes are all different looks", () => {
    const seen = new Set<string>();
    for (let n = 1; n <= CITIZEN_COUNT; n++) { const p = citizenPalette(n); seen.add(`${p.skin}${p.outfit}${p.bottom}${p.hairColor}`); }
    expect(seen.size).toBe(CITIZEN_COUNT);
  });
});

