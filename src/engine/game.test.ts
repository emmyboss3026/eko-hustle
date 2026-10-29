import { describe, it, expect } from "vitest";
import { newGame, reduce, passTime, shiftPay, mood, earnings, upgrade, type GameState } from "./game";
import { actionById } from "../data/actions";
import { missions } from "../data/missions";
import { RENT } from "./economy";
import { HOME, CATALOG } from "../data/home";
import { canPlace, findPath, wallBetween } from "./path";

const sim = { name: "Ada", trait: "hustler" as const, avatar: "👩🏾" };
const fresh = (patch: Partial<GameState> = {}): GameState => ({ ...newGame(sim), ...patch });

describe("time and rent", () => {
  it("drains needs as time passes", () => {
    const s = passTime(fresh(), 60);
    expect(s.needs.hunger).toBeLessThan(fresh().needs.hunger);
    expect(s.time).toBe(fresh().time + 60);
  });

  it("charges rent at the start of day 8", () => {
    const s = passTime(fresh({ time: 7 * 1440 - 10, money: 20_000 }), 20);
    expect(s.money).toBe(20_000 - RENT);
    expect(s.ending).toBeNull();
  });

  it("a short rent week becomes arrears, the next one gets you evicted", () => {
    const first = passTime(fresh({ time: 7 * 1440 - 10, money: 1_000 }), 20);
    expect(first.ending).toBeNull();
    expect(first.money).toBe(0);
    expect(first.rentOwed).toBe(RENT - 1_000);
    const second = passTime({ ...first, time: 14 * 1440 - 10 }, 20);
    expect(second.ending?.kind).toBe("evicted");
  });

  it("paying the landlord clears arrears", () => {
    const s = reduce(fresh({ rentOwed: 5_000, money: 8_000 }), { type: "payRent" });
    expect(s.rentOwed).toBe(0);
    expect(s.money).toBe(3_000);
  });

  it("you collapse when health hits 0", () => {
    const empty = { hunger: 0, energy: 0, fun: 0, social: 0, hygiene: 0, bladder: 0 };
    const s = passTime(fresh({ needs: empty, health: 5 }), 60);
    expect(s.ending?.kind).toBe("collapsed");
  });
});

describe("actions and travel", () => {
  it("won't let you sleep away from home", () => {
    const s = reduce(fresh({ location: "yaba" }), { type: "act", id: "sleep" });
    expect(s.time).toBe(fresh().time);
    expect(s.log[0]).toContain("Go to Mushin");
  });

  it("travel moves you, costs money and time", () => {
    const s = reduce(fresh(), { type: "travel", to: "yaba", mode: "okada" });
    expect(s.location).toBe("yaba");
    expect(s.money).toBeLessThan(10_000);
    expect(s.time).toBeGreaterThan(fresh().time);
  });

  it("sharp guy pays 30% less fare", () => {
    const normal = reduce(fresh(), { type: "travel", to: "yaba", mode: "okada" });
    const sharp = reduce(fresh({ sim: { ...sim, trait: "sharp" } }), { type: "travel", to: "yaba", mode: "okada" });
    expect(10_000 - sharp.money).toBe(Math.round((10_000 - normal.money) * 0.7));
  });
});

describe("careers", () => {
  it("tech needs study 3 to apply", () => {
    const s = reduce(fresh(), { type: "apply", career: "tech" });
    expect(s.career).toBeNull();
    const ok = reduce(fresh({ skills: { ...fresh().skills, study: 3 } }), { type: "apply", career: "tech" });
    expect(ok.career?.id).toBe("tech");
  });

  it("a shift pays (with hustler bonus) and promotion comes after enough shifts + skill", () => {
    let s = reduce(fresh({ location: "yaba" }), { type: "apply", career: "pos" });
    const pay = shiftPay(s);
    expect(pay).toBe(8_250); // 6,000 × 1.25 hustler × 1.1 good mood
    s = reduce({ ...s, mission: 99 }, { type: "work" });
    expect(s.money).toBe(10_000 + pay);
    // Make the Sim skilled and rested, then work until promotion
    for (let i = 0; i < 5; i++) {
      s = { ...s, needs: fresh().needs, skills: { ...s.skills, hustle: 5 } };
      s = reduce(s, { type: "work" });
    }
    expect(s.career?.level).toBeGreaterThanOrEqual(1);
    expect(s.stats.promotions).toBeGreaterThanOrEqual(1);
  });

  it("refuses work when exhausted", () => {
    let s = reduce(fresh({ location: "yaba" }), { type: "apply", career: "pos" });
    s = reduce({ ...s, needs: { ...s.needs, energy: 5 } }, { type: "work" });
    expect(s.stats.shifts).toBe(0);
  });
});

describe("events", () => {
  it("an event blocks other commands until you choose", () => {
    const s = fresh({ eventId: "cousin" });
    expect(reduce(s, { type: "act", id: "nap" })).toBe(s);
    const after = reduce(s, { type: "choose", index: 0, roll: 0.5 });
    expect(after.eventId).toBeNull();
    expect(after.money).toBe(8_000);
    expect(after.stats.sentHome).toBe(2_000);
  });

  it("gambles pay out on a lucky roll", () => {
    const s = fresh({ eventId: "investment", money: 20_000 });
    const lucky = reduce(s, { type: "choose", index: 0, roll: 0.1 });
    const unlucky = reduce(s, { type: "choose", index: 0, roll: 0.9 });
    expect(lucky.money).toBe(20_000 - 10_000 + 22_000);
    expect(unlucky.money).toBe(10_000);
  });
});

describe("japa and landlord endings", () => {
  it("full japa path ends the game with a japa ending", () => {
    let s = fresh({ location: "yaba", money: 2_000_000, skills: { ...fresh().skills, study: 10, charisma: 10 } });
    s = reduce(s, { type: "goal", id: "ielts", roll: 0 });
    expect(s.ielts).toBe(true);
    s = reduce({ ...s, location: "island", needs: fresh().needs }, { type: "goal", id: "visa", roll: 0 });
    expect(s.visa).toBe(true);
    s = reduce({ ...s, location: "ikeja" }, { type: "goal", id: "flight", roll: 0 });
    expect(s.ending?.kind).toBe("japa");
  });

  it("visa needs proof of funds", () => {
    const s = fresh({ location: "island", ielts: true, money: 100_000 });
    const after = reduce(s, { type: "goal", id: "visa", roll: 0 });
    expect(after.visa).toBe(false);
    expect(after.log[0]).toContain("Proof of funds");
  });

  it("buying a flat ends with the landlord ending", () => {
    const s = reduce(fresh({ location: "island", money: 1_600_000 }), { type: "goal", id: "house", roll: 0 });
    expect(s.ending?.kind).toBe("landlord");
  });
});

describe("rewarded ads", () => {
  it("pays once per in-game day", () => {
    let s = reduce(fresh(), { type: "reward" });
    expect(s.money).toBe(13_000);
    s = reduce(s, { type: "reward" });
    expect(s.money).toBe(13_000);
    s = reduce({ ...s, time: s.time + 1440 }, { type: "reward" });
    expect(s.money).toBe(16_000);
  });
});

describe("your room", () => {
  it("pathfinding goes through the bathroom door, not the wall", () => {
    expect(wallBetween(HOME, { x: 4, y: 0 }, { x: 5, y: 0 })).toBe(true);
    expect(wallBetween(HOME, { x: 4, y: 1 }, { x: 5, y: 1 })).toBe(false);
    const route = findPath(HOME, [], { x: 4, y: 0 }, { x: 5, y: 0 });
    expect(route?.some(p => p.x === 5 && p.y === 1)).toBe(true);
  });

  it("placement checks edges, overlap, walls and the door", () => {
    const objs = [{ uid: 1, type: "chair" as const, x: 2, y: 2, rot: 0 }];
    expect(canPlace(HOME, objs, { type: "sofa", x: 7, y: 6, rot: 0 })).toBe(false);
    expect(canPlace(HOME, objs, { type: "sofa", x: 1, y: 2, rot: 0 })).toBe(false);
    expect(canPlace(HOME, objs, { type: "sofa", x: 4, y: 0, rot: 0 })).toBe(false);
    expect(canPlace(HOME, objs, { type: "chair", x: HOME.door.x, y: HOME.door.y, rot: 0 })).toBe(false);
    expect(canPlace(HOME, objs, { type: "sofa", x: 2, y: 6, rot: 0 })).toBe(true);
    expect(canPlace(HOME, objs, { type: "rug", x: 1, y: 1, rot: 0 })).toBe(true);
  });

  it("buying furniture costs money and unlocks its actions", () => {
    const rich = fresh({ money: 100_000 });
    expect(reduce(rich, { type: "act", id: "tv" }).log[0]).toContain("Flat-screen TV");
    const s = reduce(rich, { type: "buy", item: "tv", x: 2, y: 6, rot: 0 });
    expect(s.money).toBe(100_000 - CATALOG.tv.price);
    const watched = reduce(s, { type: "act", id: "tv" });
    expect(watched.needs.fun).toBeGreaterThan(s.needs.fun);
  });

  it("you can only arrange your room at home, and selling gives half back", () => {
    const away = reduce(fresh({ money: 100_000, location: "yaba" }), { type: "buy", item: "radio", x: 2, y: 6, rot: 0 });
    expect(away.money).toBe(100_000);
    const chair = fresh().home.objects.find(o => o.type === "chair")!;
    const sold = reduce(fresh(), { type: "sell", uid: chair.uid });
    expect(sold.money).toBe(fresh().money + CATALOG.chair.price / 2);
    const toilet = fresh().home.objects.find(o => o.type === "toilet")!;
    expect(reduce(fresh(), { type: "sell", uid: toilet.uid }).home.objects).toHaveLength(fresh().home.objects.length);
  });

  it("cooking uses a meal pack; no packs, no cooking", () => {
    const s = reduce(fresh(), { type: "act", id: "cook" });
    expect(s.home.food).toBe(fresh().home.food - 1);
    const empty = reduce(fresh({ home: { ...fresh().home, food: 0 } }), { type: "act", id: "cook" });
    expect(empty.log[0]).toContain("groceries");
  });
});

describe("NEPA and the generator", () => {
  const dark = (patch: Partial<GameState> = {}) =>
    fresh({ power: { grid: false, outageEnds: fresh().time + 600 }, ...patch });

  it("a power cut can start on a tick", () => {
    const s = reduce(fresh(), { type: "tick", minutes: 10, roll: 1, pick: 0, power: 0, powerPick: 0 });
    expect(s.power.grid).toBe(false);
    expect(s.power.outageEnds).toBe(s.time + 2 * 60);
  });

  it("electric things don't work in the dark, but a generator with fuel fixes it", () => {
    const withShower = (p: Partial<GameState>) => {
      const base = dark({ money: 200_000, ...p });
      return reduce(base, { type: "buy", item: "shower", x: 6, y: 2, rot: 0 });
    };
    const noGen = reduce(withShower({}), { type: "act", id: "shower" });
    expect(noGen.log[0]).toContain("No power");
    let s = withShower({});
    s = reduce(s, { type: "buy", item: "generator", x: 0, y: 6, rot: 0 });
    s = { ...s, home: { ...s.home, fuel: 5 } };
    const showered = reduce(s, { type: "act", id: "shower" });
    expect(showered.needs.hygiene).toBe(100);
    expect(showered.home.fuel).toBeLessThan(5);
  });

  it("light comes back when the cut ends", () => {
    const s = passTime(dark(), 601);
    expect(s.power.grid).toBe(true);
  });
});

describe("old saves", () => {
  it("a Hustle & Japa save is upgraded with a room", async () => {
    const old = { ...fresh(), version: 2 } as Record<string, unknown>;
    delete old.home; delete old.power; delete old.rentOwed;
    const s = upgrade(old);
    expect(s?.version).toBe(4);
    expect(s?.mission).toBe(0);
    expect(s?.home.objects.length).toBeGreaterThan(0);
    expect(upgrade({ nope: true })).toBeNull();
  });
});

describe("Eko Hustle 2: places, moods and missions", () => {
  it("places have opening hours", () => {
    const night = fresh({ time: 23 * 60 });
    const s = reduce(night, { type: "act", id: "amala" });
    expect(s.log[0]).toContain("closed");
    const ok = reduce(fresh({ time: 12 * 60 }), { type: "act", id: "amala" });
    expect(ok.needs.hunger).toBeGreaterThan(fresh().needs.hunger);
  });

  it("gigs pay more as your skill grows, and some need a skill first", () => {
    const sprint = actionById("sprint")!;
    expect(reduce(fresh({ location: "yaba", time: 10 * 60 }), { type: "act", id: "sprint" }).log[0]).toContain("Needs");
    const low = earnings(fresh({ skills: { ...fresh().skills, study: 2 } }), sprint);
    const high = earnings(fresh({ skills: { ...fresh().skills, study: 6 } }), sprint);
    expect(high).toBeGreaterThan(low);
  });

  it("actions can give a mood that lifts your mood score", () => {
    const before = mood(fresh());
    const s = reduce(fresh(), { type: "act", id: "bath" });
    expect(s.moodlets.some(m => m.id === "squeaky")).toBe(true);
    expect(mood(s)).toBeGreaterThan(before - 5);
  });

  it("finishing a mission pays its reward and moves to the next one", () => {
    const s = reduce(fresh(), { type: "act", id: "bath" });
    expect(s.mission).toBe(1);
    expect(s.money).toBe(fresh().money + missions[0].reward);
    expect(s.log[0]).toContain("MISSION COMPLETE");
  });

  it("missions go in order: doing a later one first doesn't skip ahead", () => {
    const cooked = reduce(fresh(), { type: "act", id: "cook" });
    expect(cooked.mission).toBe(0);
    const bathed = reduce(cooked, { type: "act", id: "bath" });
    expect(bathed.mission).toBe(2); // bath done, and cook was already done
  });

  it("walking in through a door in the streets moves you to that district", () => {
    const s = reduce(fresh(), { type: "walk", to: "yaba", spot: "hub" });
    expect(s.location).toBe("yaba");
    expect(s.counts.enter).toBe(1);
    expect(s.counts.walk).toBe(1);
  });

  it("an Eko Hustle 1 save keeps bought furniture that fits and refunds the rest", () => {
    const old = {
      ...fresh(), version: 3, money: 1_000,
      home: { objects: [{ uid: 1, type: "mattress", x: 0, y: 3, rot: 0 }, { uid: 6, type: "radio", x: 3, y: 5, rot: 0 }, { uid: 7, type: "sofa", x: 4, y: 4, rot: 0 }], nextUid: 8, food: 2, fuel: 1 },
    } as unknown;
    const s = upgrade(old)!;
    expect(s.version).toBe(4);
    expect(s.home.objects.some(o => o.type === "radio")).toBe(true);
    expect(s.home.objects.some(o => o.type === "sofa")).toBe(false); // it would cross the new bedroom wall
    expect(s.money).toBe(1_000 + 55_000);
    expect(s.home.food).toBe(2);
  });
});

describe("relaxed survival (default) and the classic rules", () => {
  const allEmpty = { hunger: 0, energy: 50, fun: 0, social: 0, hygiene: 0, bladder: 40 };

  it("is on for new games and can be switched off", () => {
    const s = fresh();
    expect(s.relaxed).toBeUndefined(); // undefined = relaxed
    expect(reduce(s, { type: "relaxed", on: false }).relaxed).toBe(false);
  });

  it("empty needs hurt far less when relaxed", () => {
    const relaxed = passTime(fresh({ needs: allEmpty, health: 100 }), 600);
    const classic = passTime(fresh({ needs: allEmpty, health: 100, relaxed: false }), 600);
    expect(relaxed.health).toBeGreaterThanOrEqual(80);  // at most -2 an hour
    expect(classic.health).toBeLessThan(relaxed.health - 50);
  });

  it("needs drain slower when relaxed", () => {
    const relaxed = passTime(fresh(), 120);
    const classic = passTime(fresh({ relaxed: false }), 120);
    expect(relaxed.needs.hunger).toBeGreaterThan(classic.needs.hunger);
  });

  it("an empty bladder is an accident, not damage", () => {
    const s = passTime(fresh({ needs: { ...fresh().needs, bladder: 1, hygiene: 80 } }), 60);
    expect(s.needs.bladder).toBe(100);
    expect(s.needs.hygiene).toBeLessThan(40);
    expect(s.moodlets.some(m => m.id === "accident")).toBe(true);
    expect(s.ending).toBeNull();
  });

  it("running out of energy makes you pass out and wake with some energy", () => {
    const start = fresh({ needs: { ...fresh().needs, energy: 1 } });
    const s = passTime(start, 60);
    expect(s.needs.energy).toBeGreaterThan(15);
    expect(s.time).toBe(start.time + 60 + 120);
    expect(s.moodlets.some(m => m.id === "floorSleeper")).toBe(true);
  });

  it("classic rules keep the old behaviour", () => {
    const s = passTime(fresh({ relaxed: false, needs: { ...fresh().needs, bladder: 1 } }), 60);
    expect(s.needs.bladder).toBe(0);
    expect(s.moodlets.some(m => m.id === "accident")).toBe(false);
  });
});
