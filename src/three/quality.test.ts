import { describe, it, expect } from "vitest";
import { PIXEL_STEPS, QualityGovernor } from "./quality";
import { rainyDay, weatherAt } from "../data/weather";

const run = (g: QualityGovernor, ms: number, seconds: number) => { for (let t = 0; t < seconds * 1000; t += ms) g.sample(ms); };

describe("adaptive quality", () => {
  it("steps down when the game stays slow, and stops at the lowest step with shadows off", () => {
    const g = new QualityGovernor(2);
    expect(g.pixelRatio).toBe(PIXEL_STEPS[0]);
    run(g, 50, 4);                                   // 20 fps for 4 seconds
    expect(g.level).toBeGreaterThan(0);
    run(g, 60, 60);
    expect(g.level).toBe(PIXEL_STEPS.length - 1);
    expect(g.shadows).toBe(false);
  });

  it("creeps back up when it runs smoothly, but never past what the screen can show", () => {
    const g = new QualityGovernor(2);
    run(g, 50, 10);
    const low = g.level;
    expect(low).toBeGreaterThan(0);
    run(g, 16, 60);                                  // a smooth 60 fps for a minute
    expect(g.level).toBeLessThan(low);
    expect(g.level).toBeGreaterThanOrEqual(0);
    expect(new QualityGovernor(1).pixelRatio).toBeLessThanOrEqual(1);   // a 1x screen never starts sharper than 1
  });

  it("ignores a single hiccup", () => {
    const g = new QualityGovernor(2);
    g.sample(2000);
    run(g, 16, 5);
    expect(g.level).toBe(0);
  });
});

describe("weather", () => {
  it("rains on about a quarter of the days, only in the afternoon, and builds up and eases off", () => {
    const days = Array.from({ length: 400 }, (_, i) => i + 1);
    const wet = days.filter(rainyDay).length;
    expect(wet).toBeGreaterThan(70);
    expect(wet).toBeLessThan(130);
    const day = days.find(rainyDay)!;
    const at = (h: number) => weatherAt((day - 1) * 1440 + h * 60);
    expect(at(8).raining).toBe(false);
    expect(at(13.2).strength).toBeLessThan(at(15).strength);
    expect(at(15).strength).toBe(1);
    expect(at(19.5).strength).toBeLessThan(1);
    expect(at(21).raining).toBe(false);
    const dry = days.find(d => !rainyDay(d))!;
    expect(weatherAt((dry - 1) * 1440 + 15 * 60).raining).toBe(false);
  });
});
