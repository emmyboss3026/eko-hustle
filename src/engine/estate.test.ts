import { describe, it, expect } from "vitest";
import { newGame, reduce, type GameState } from "./game";
import { buildBlocker, carBlocker, MAX_CARS } from "./estate";
import { CARS, SLOTS, UPGRADES, homeSolids, homeTier, slotsFor } from "../data/estate";

const sim = { name: "Ada", trait: "hustler" as const, avatar: "👩🏾" };
const rich = (patch: Partial<GameState> = {}): GameState => ({ ...newGame(sim), money: 50_000_000, ...patch });

describe("building on your property", () => {
  it("costs money, shows up in the ledger and builds once", () => {
    let s = rich();
    s = reduce(s, { type: "build", id: "driveway" });
    expect(s.property?.driveway).toBe(true);
    expect(s.money).toBe(50_000_000 - 80_000);
    expect(s.bank?.at(-1)).toMatchObject({ amt: -80_000, cat: "home" });
    expect(reduce(s, { type: "build", id: "driveway" })).toBe(s); // not twice
  });

  it("needs the right things first, and enough money", () => {
    const s = rich();
    expect(buildBlocker(s, "garage")).toMatch(/driveway/i);
    expect(buildBlocker(s, "floor2")).toMatch(/balcony/i);
    expect(reduce(s, { type: "build", id: "garage" })).toBe(s);
    expect(buildBlocker(rich({ money: 10 }), "garden")).toMatch(/money/i);
    expect(buildBlocker(s, "nonsense")).toBeTruthy();
  });

  it("grows the home from apartment to mansion", () => {
    expect(homeTier({})).toBe("apartment");
    expect(homeTier({ driveway: true, gate: true })).toBe("house");
    expect(homeTier({ balcony: true, floor2: true })).toBe("duplex");
    expect(homeTier({ garden: true, pool: true, garage: true, driveway: true, balcony: true, floor2: true })).toBe("mansion");
  });

  it("the garage and the pool have solid walls cars cannot drive through", () => {
    expect(homeSolids({})).toEqual([]);
    expect(homeSolids({ garage: true, pool: true, gate: true }).length).toBe(6);
  });

  it("every upgrade can be built in some order", () => {
    let s = rich();
    for (let i = 0; i < UPGRADES.length; i++) {
      const next = UPGRADES.find(u => !s.property?.[u.id] && !buildBlocker(s, u.id));
      if (!next) break;
      s = reduce(s, { type: "build", id: next.id });
    }
    expect(UPGRADES.every(u => s.property?.[u.id])).toBe(true);
  });
});

describe("cars", () => {
  it("buying charges the price and parks the car in the best free space", () => {
    let s = rich();
    s = reduce(s, { type: "buyCar", model: "compact", color: CARS[1].colors[0] });
    const c = CARS.find(x => x.id === "compact")!;
    expect(s.money).toBe(50_000_000 - c.price);
    expect(s.vehicles).toHaveLength(1);
    expect(s.vehicles![0]).toMatchObject({ x: SLOTS.curb.x, z: SLOTS.curb.z }); // only the kerb at first
    s = reduce(s, { type: "build", id: "driveway" });
    s = reduce(s, { type: "buyCar", model: "bike", color: CARS[0].colors[0] });
    expect(s.vehicles![1]).toMatchObject({ x: SLOTS.drive.x, z: SLOTS.drive.z });
  });

  it("needs a free parking space, enough money and a valid colour", () => {
    let s = rich();
    s = reduce(s, { type: "buyCar", model: "sedan", color: "#2d3436" });
    expect(carBlocker(s, "sedan")).toMatch(/parking/i); // the kerb is taken
    expect(reduce(s, { type: "buyCar", model: "sedan", color: "#2d3436" })).toBe(s);
    expect(carBlocker(rich({ money: 100 }), "compact")).toMatch(/money/i);
    expect(reduce(rich(), { type: "buyCar", model: "compact", color: "red; drop table" }).vehicles).toBeUndefined();
    expect(reduce(rich(), { type: "buyCar", model: "rocket", color: "#ffffff" }).vehicles).toBeUndefined();
  });

  it("holds at most the maximum number of vehicles", () => {
    let s = rich();
    for (const id of ["driveway", "gate", "garden", "garage"]) s = reduce(s, { type: "build", id });
    expect(slotsFor(s.property)).toHaveLength(3);
    for (let i = 0; i < 3; i++) s = reduce(s, { type: "buyCar", model: "bike", color: "#e63946" });
    expect(s.vehicles).toHaveLength(3);
    expect(MAX_CARS).toBeGreaterThanOrEqual(3);
  });

  it("selling returns 60% and frees the space", () => {
    let s = reduce(rich(), { type: "buyCar", model: "suv", color: "#1e272e" });
    const money = s.money;
    s = reduce(s, { type: "sellCar", uid: s.vehicles![0].uid });
    expect(s.vehicles).toEqual([]);
    expect(s.money).toBe(money + Math.round(3_000_000 * 0.6));
    expect(reduce(s, { type: "sellCar", uid: 99 })).toBe(s);
  });

  it("repainting costs money and changes the colour", () => {
    let s = reduce(rich(), { type: "buyCar", model: "sports", color: "#ff3b30" });
    const money = s.money;
    s = reduce(s, { type: "paintCar", uid: s.vehicles![0].uid, color: "#ffcc00" });
    expect(s.vehicles![0].color).toBe("#ffcc00");
    expect(s.money).toBe(money - 15_000);
  });

  it("parking saves where the car is, and snaps into your own space when close", () => {
    let s = reduce(rich(), { type: "build", id: "driveway" });
    s = reduce(s, { type: "buyCar", model: "compact", color: "#f1c40f" });
    const uid = s.vehicles![0].uid;
    const free = reduce(s, { type: "parkCar", uid, x: 20, z: -30, yaw: 1.2 });
    expect(free.vehicles![0]).toMatchObject({ x: 20, z: -30, yaw: 1.2 });
    const snapped = reduce(s, { type: "parkCar", uid, x: SLOTS.drive.x + 1.1, z: SLOTS.drive.z - 1, yaw: 0.3 });
    expect(snapped.vehicles![0]).toMatchObject({ x: SLOTS.drive.x, z: SLOTS.drive.z, yaw: SLOTS.drive.yaw });
    expect(reduce(s, { type: "parkCar", uid, x: NaN, z: 0, yaw: 0 })).toBe(s);
    expect(reduce(s, { type: "parkCar", uid, x: 9999, z: 0, yaw: 0 })).toBe(s);
    expect(reduce(s, { type: "parkCar", uid: 42, x: 0, z: 0, yaw: 0 })).toBe(s);
  });

  it("an old save without property or cars still works", () => {
    const s = newGame(sim);
    expect(s.property).toBeUndefined();
    expect(carBlocker(rich(), "compact")).toBeNull();
  });
});
