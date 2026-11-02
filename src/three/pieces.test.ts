import { describe, it, expect } from "vitest";
import { buildPiece } from "./pieces";
import { CATALOG, shopList, type FurnitureType } from "../data/home";

describe("furniture models", () => {
  it("every item in the shop has a real 3D model, not the pink placeholder box", () => {
    for (const type of Object.keys(CATALOG) as FurnitureType[]) {
      const { group } = buildPiece(type, { powered: true, active: false });
      let meshes = 0;
      group.traverse(o => { if ((o as { isMesh?: boolean }).isMesh) meshes++; });
      expect(meshes, type).toBeGreaterThan(1);
    }
  });

  it("the shop sells the new home items", () => {
    for (const t of ["wardrobe", "dining", "lamp", "art", "curtain", "armchair", "aircon", "leathersofa"] as FurnitureType[]) {
      expect(shopList).toContain(t);
      expect(CATALOG[t].price).toBeGreaterThan(0);
    }
  });

  it("lamps and air conditioners need light, and leather sofas are the luxury tier", () => {
    expect(CATALOG.lamp.power).toBe(true);
    expect(CATALOG.aircon.power).toBe(true);
    expect(CATALOG.leathersofa.price).toBeGreaterThan(CATALOG.sofa.price * 5);
  });
});
