import { describe, it, expect } from "vitest";
import { Animator, CYCLE_RATE, poseValues, type Rig } from "./animator";

const joint = () => {
  const j = { rotation: { x: 0, y: 0, z: 0, set(x: number, y: number, z: number) { Object.assign(this, { x, y, z }); } }, position: { x: 0, y: 0, z: 0, set(x: number, y: number, z: number) { Object.assign(this, { x, y, z }); } } };
  return j;
};
const rig = (): Rig => ({ body: joint(), legL: joint(), legR: joint(), armL: joint(), armR: joint(), head: joint() });

describe("character animation", () => {
  it("running swings the limbs further and faster than walking, and leans forward", () => {
    const walk = poseValues("walk", Math.PI / 2, 0), run = poseValues("run", Math.PI / 2, 0);
    expect(Math.abs(run.legLX)).toBeGreaterThan(Math.abs(walk.legLX));
    expect(run.bodyRotX).toBeGreaterThan(walk.bodyRotX);
    expect(CYCLE_RATE.run).toBeGreaterThan(CYCLE_RATE.walk);
  });

  it("blends into a pose over several frames rather than snapping", () => {
    const r = rig();
    const a = new Animator(r);
    a.update(1 / 60, "sit", 0);
    expect(Math.abs(r.legL.rotation.x)).toBeGreaterThan(0);
    expect(Math.abs(r.legL.rotation.x)).toBeLessThan(Math.PI / 2 - 0.5);     // not there yet after one frame
    for (let i = 0; i < 120; i++) a.update(1 / 60, "sit", i / 60);
    expect(r.legL.rotation.x).toBeCloseTo(-Math.PI / 2, 1);                  // settled after two seconds
  });

  it("changing from walk to run never makes a joint jump", () => {
    const r = rig();
    const a = new Animator(r);
    let last = 0, worst = 0;
    for (let i = 0; i < 300; i++) {
      a.update(1 / 60, i < 120 ? "walk" : "run", i / 60);
      worst = i ? Math.max(worst, Math.abs(r.legL.rotation.x - last)) : 0;
      last = r.legL.rotation.x;
    }
    expect(worst).toBeLessThan(0.3);                                         // no jump between frames
  });

  it("standing still settles to a calm idle", () => {
    const r = rig();
    const a = new Animator(r);
    for (let i = 0; i < 90; i++) a.update(1 / 60, "run", i / 60);
    for (let i = 0; i < 240; i++) a.update(1 / 60, "idle", 2 + i / 60);
    expect(Math.abs(r.legL.rotation.x)).toBeLessThan(0.05);
    expect(Math.abs(r.body.rotation.x)).toBeLessThan(0.05);
  });
});
