import { describe, it, expect } from "vitest";
import { HOME, homePlan } from "../data/home";
import { findPath } from "./path";
import { SIM_RADIUS, lineClear, roomBlocked, slideMove, smoothPath, solidsOf } from "./roomMove";

const chair = (x: number, y: number) => ({ uid: 1, type: "chair" as const, x, y, rot: 0 });

describe("free movement in a room", () => {
  const plan = homePlan(0);

  it("the Sim stands in open floor but not in walls, furniture or outside the flat", () => {
    const solids = solidsOf(plan, [chair(2, 2)]);
    expect(roomBlocked(plan, solids, 1.0, 5.0)).toBe(false);          // open floor
    expect(roomBlocked(plan, solids, 2.5, 2.5)).toBe(true);           // in the chair
    expect(roomBlocked(plan, solids, 5.0, 4.5)).toBe(true);           // in the wall between the living room and the bedroom
    expect(roomBlocked(plan, solids, 5.0, 5.5)).toBe(false);          // the doorway in it
    expect(roomBlocked(plan, solids, -0.1, 3)).toBe(true);            // outside
    expect(roomBlocked(plan, solids, plan.size + 0.1, 3)).toBe(true);
  });

  it("slides along a wall instead of stopping, and stops in a corner", () => {
    const solids = solidsOf(plan, []);
    // walking diagonally into the wall at x = 5 (row 4): the Sim keeps its z movement
    const [x, z] = slideMove(plan, solids, 4.6, 4.2, 0.5, 0.3);
    expect(x).toBeCloseTo(4.6);
    expect(z).toBeCloseTo(4.5);
    const [cx, cz] = slideMove(plan, solids, SIM_RADIUS, SIM_RADIUS, -0.3, -0.3);
    expect([cx, cz]).toEqual([SIM_RADIUS, SIM_RADIUS]);
  });

  it("a Sim caught under new furniture can walk out of it", () => {
    const solids = solidsOf(plan, [chair(2, 2)]);
    const [x] = slideMove(plan, solids, 2.5, 2.5, 0.2, 0);
    expect(x).toBeCloseTo(2.7);
  });

  it("straightens a route so the Sim cuts corners but never through a wall", () => {
    const objs = [chair(3, 6)];
    const route = findPath(plan, objs as never, HOME.door, { x: 8, y: 6 })!;
    expect(route).not.toBeNull();
    const smooth = smoothPath(plan, objs as never, [HOME.door.x + 0.5, HOME.door.y + 0.5], route);
    expect(smooth.length).toBeLessThan(route.length);
    expect(smooth.at(-1)).toEqual(route.at(-1));
    // every leg of the straightened route is really clear
    const solids = solidsOf(plan, objs as never);
    let at: [number, number] = [HOME.door.x + 0.5, HOME.door.y + 0.5];
    for (const t of smooth) { const to: [number, number] = [t.x + 0.5, t.y + 0.5]; expect(lineClear(plan, solids, at, to)).toBe(true); at = to; }
  });
});
