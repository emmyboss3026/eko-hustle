import { describe, it, expect } from "vitest";
import { newGame, reduce, type GameState } from "./game";
import { buildBlocker, carBlocker, landBlocker, MAX_CARS } from "./estate";
import { MAIN } from "./story";
import { homePlan, wingLevel } from "../data/home";
import { CARS, LAND_RESALE, PLOTS, SLOTS, UPGRADES, homeSolids, homeTier, landCost, slotsFor } from "../data/estate";

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

  it("every upgrade can be built in some order (the big extensions need land)", () => {
    let s: GameState = { ...rich({ money: 300_000_000 }), property: { land: 4 } };
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

describe("land", () => {
  const atChapter3 = (patch: Partial<GameState> = {}) => {
    const s = rich();
    return { ...s, story: { ...(s.story ?? { route: null, flags: [], done: [], xp: 0 }), done: MAIN.filter(m => m.ch <= 2 && !m.route).map(m => m.id) }, ...patch } as GameState;
  };

  it("the plots get bigger and dearer, and a bigger plot gives you more lawn parking and bigger houses", () => {
    for (let i = 1; i < PLOTS.length; i++) {
      expect(PLOTS[i].price).toBeGreaterThan(PLOTS[i - 1].price);
      expect(PLOTS[i].width).toBeGreaterThan(PLOTS[i - 1].width);
      expect(PLOTS[i].house).toBeGreaterThan(PLOTS[i - 1].house);
    }
    expect(slotsFor({ land: 1 }).filter(id => id.startsWith("lawn")).length).toBe(2);
    expect(slotsFor({ land: 4 }).filter(id => id.startsWith("lawn")).length).toBe(8);
    expect(slotsFor({}).some(id => id.startsWith("lawn"))).toBe(false);
  });

  it("you need to be past the first chapters, pay what you owe, and have the money", () => {
    const early = rich();
    expect(landBlocker(early, 1)).toMatch(/chapters/);
    const s = atChapter3();
    expect(landBlocker({ ...s, rentOwed: 100 }, 1)).toMatch(/rent/);
    expect(landBlocker({ ...s, money: 1000 }, 1)).toMatch(/money/);
    expect(landBlocker(s, 1)).toBeNull();
    expect(landBlocker(s, 9)).toMatch(/Unknown/);
  });

  it("buying land moves you out: it charges, ends rent, and parks your cars on the new lawn", () => {
    let s = { ...atChapter3(), money: 20_000_000 };
    s = reduce(s, { type: "buyCar", model: "compact", color: CARS[1].colors[0] });
    const before = s.money;
    const next = reduce(s, { type: "buyLand", tier: 2 });
    expect(next.property?.land).toBe(2);
    expect(before - next.money).toBe(PLOTS[1].price);
    expect(next.rentOwed).toBe(0);
    expect(next.vehicles).toHaveLength(1);
    expect(reduce(next, { type: "buyLand", tier: 1 })).toBe(next);                 // cannot go back to a smaller plot
    const bigger = reduce({ ...next, money: 100_000_000 }, { type: "buyLand", tier: 3 });
    expect(bigger.money).toBe(100_000_000 - landCost(2, 3));
    expect(landCost(2, 3)).toBe(PLOTS[2].price - Math.round(PLOTS[1].price * LAND_RESALE));
  });

  it("no rent is charged on your own land", () => {
    let s = { ...atChapter3(), money: 5_000_000 };
    s = reduce(s, { type: "buyLand", tier: 1 });
    const later = reduce(s, { type: "tick", minutes: 60 * 24 * 14, roll: 0.5, pick: 0 });
    expect(later.rentOwed).toBe(0);
    expect(later.ending?.kind).not.toBe("evicted");
  });

  it("the big extensions need the right plot", () => {
    const s = { ...rich(), property: { wing: true } };
    expect(buildBlocker(s, "wing")).toMatch(/already/);
    expect(buildBlocker(s, "wing2")).toMatch(/Quarter plot/);
    expect(buildBlocker({ ...s, property: { ...s.property, land: 1 } }, "wing2")).toBeNull();
    expect(buildBlocker({ ...s, property: { ...s.property, land: 1, wing2: true } }, "wing3")).toMatch(/Half plot/);
    expect(wingLevel({ wing: true, wing2: true, wing3: true })).toBe(3);
    expect(homePlan(5).size).toBe(20);
  });
});
