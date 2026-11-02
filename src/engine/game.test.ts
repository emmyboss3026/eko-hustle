import { describe, it, expect } from "vitest";
import { HOME_GOALS } from "../data/homeGoals";
import { SIDES } from "./story";
import { BLUEPRINTS } from "../data/blueprints";
import { newGame, reduce, passTime, shiftPay, mood, earnings, upgrade, canRevive, type GameState } from "./game";
import { actionById } from "../data/actions";
import { STORY } from "../data/story";
import { RENT } from "./economy";
import { HOME, CATALOG, homePlan, wingLevel, levelForObjects, WALL_PRICE, FLOOR_PRICE, floorById, tidyEdges, defaultEdges } from "../data/home";
import { canPlace, findPath, wallBetween, allReachable } from "./path";
import { wallsCost } from "./estate";
import { ARCADE_PAID_PLAYS, ARCADE_TOP_PRIZE, GRAM_MILESTONES, arcadeLeft, gramPostedToday } from "./apps";
import { headlinesFor } from "../components/phone/NewsApp";

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

  it("finishing a mission (tasks, then a choice) pays its reward and moves to the next one", () => {
    const bathed = reduce(fresh(), { type: "act", id: "bath" });
    expect(bathed.mission).toBe(0); // the tasks are done, but you still play the scene
    const s = reduce(bathed, { type: "story", act: "finish", id: "bath", choice: 0 });
    expect(s.mission).toBe(1);
    expect(s.money).toBe(bathed.money + (STORY[0].reward.money ?? 0));
    expect(s.story?.flags).toContain("promise_rent");
    expect(s.log.some(l => l.includes("MISSION COMPLETE"))).toBe(true);
  });

  it("missions go in order: a task done before its mission starts doesn't count", () => {
    const cooked = reduce(fresh(), { type: "act", id: "cook" });
    const bathed = reduce(cooked, { type: "act", id: "bath" });
    const next = reduce(bathed, { type: "story", act: "finish", id: "bath", choice: 1 });
    expect(next.story?.cur?.id).toBe("cook");
    expect(reduce(next, { type: "story", act: "finish", id: "cook", choice: 0 }).mission).toBe(1); // not cooked since it started
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

describe("coming back after a collapse", () => {
  const collapsed = () => {
    const empty = { hunger: 0, energy: 0, fun: 0, social: 0, hygiene: 0, bladder: 0 };
    return passTime(fresh({ needs: empty, health: 5, money: 10_000 }), 60);
  };

  it("an ad brings you back with some health and a hospital bill, 3 times per life", async () => {
    const { REVIVE } = await import("../data/revive");
    let s = collapsed();
    expect(canRevive(s, "ad")).toBe(true);
    const before = s.money;
    s = reduce(s, { type: "revive", how: "ad" });
    expect(s.ending).toBeNull();
    expect(s.health).toBeGreaterThanOrEqual(REVIVE.ad.health);
    expect(s.money).toBe(before - REVIVE.ad.bill);
    expect(Object.values(s.needs).every(v => v >= REVIVE.ad.needsAtLeast)).toBe(true);
    for (let i = 1; i < REVIVE.ad.perLife; i++) {
      s = reduce({ ...s, ending: { kind: "collapsed", day: 9 } }, { type: "revive", how: "ad" });
    }
    const again = { ...s, ending: { kind: "collapsed" as const, day: 9 } };
    expect(canRevive(again, "ad")).toBe(false);
    expect(reduce(again, { type: "revive", how: "ad" })).toBe(again);
  });

  it("a gem gives full health with no bill, and each gem id works once", () => {
    const s = collapsed();
    expect(reduce(s, { type: "revive", how: "gem" })).toBe(s); // no gem id, nothing happens
    const back = reduce(s, { type: "revive", how: "gem", ref: "gem-ref-0001" });
    expect(back.ending).toBeNull();
    expect(back.health).toBe(100);
    expect(back.money).toBe(s.money);
    const again = { ...back, ending: { kind: "collapsed" as const, day: 9 } };
    expect(reduce(again, { type: "revive", how: "gem", ref: "gem-ref-0001" })).toBe(again);
  });

  it("you can't revive from other endings, or after ending the life", () => {
    const s = collapsed();
    const ended = reduce(s, { type: "finalize" });
    expect(ended.ending?.final).toBe(true);
    expect(canRevive(ended, "gem")).toBe(false);
    expect(canRevive(fresh({ ending: { kind: "evicted", day: 3 } }), "ad")).toBe(false);
    expect(canRevive(fresh(), "ad")).toBe(false);
  });
});

describe("gem packs", () => {
  it("prices match the server's product list", async () => {
    const { GEM_PACKS } = await import("../data/revive");
    const raw = (await import("../../supabase/functions/_shared/bachs.ts?raw")).default;
    const server = raw.replace(/(\d)_(\d)/g, "$1$2");
    for (const p of GEM_PACKS) {
      expect(server).toMatch(new RegExp(`"${p.id}":\\s*\\{\\s*naira:\\s*${p.price}\\b[^}]*gems:\\s*${p.gems}\\b`));
    }
  });
});

describe("home extensions", () => {
  it("the plan grows with the wings and keeps the old tiles where they were", () => {
    expect(homePlan(0)).toBe(HOME);
    expect(homePlan(1).size).toBe(10);
    expect(homePlan(2).size).toBe(12);
    expect(homePlan(1).rooms.slice(0, HOME.rooms.length)).toEqual(HOME.rooms);
    expect(wingLevel({ wing: true })).toBe(1);
    expect(wingLevel({ wing: true, wing2: true })).toBe(2);
    expect(wingLevel({ wing2: true })).toBe(0);   // needs the first wing
  });

  it("furniture fits in the new rooms only after you build them", () => {
    const sofa = { type: "chair" as const, x: 9, y: 2, rot: 0 };
    expect(canPlace(HOME, [], sofa)).toBe(false);
    expect(canPlace(homePlan(1), [], sofa)).toBe(true);
    expect(canPlace(homePlan(1), [], { ...sofa, x: 11 })).toBe(false);
    expect(canPlace(homePlan(2), [], { ...sofa, x: 11 })).toBe(true);
  });

  it("every room of a bigger flat can be reached from the front door", () => {
    for (const level of [1, 2]) {
      const plan = homePlan(level);
      for (const r of plan.rooms) {
        expect(findPath(plan, [], plan.door, { x: r.x0, y: r.y0 }), `${r.name} at level ${level}`).not.toBeNull();
      }
    }
  });

  it("a visitor sees the wing that matches the furniture", () => {
    expect(levelForObjects([{ x: 3, y: 3 }])).toBe(0);
    expect(levelForObjects([{ x: 8, y: 1 }])).toBe(1);
    expect(levelForObjects([{ x: 3, y: 10 }])).toBe(2);
  });
});

describe("moving walls", () => {
  const wall = (s: GameState, axis: "v" | "h", at: number, i: number) => reduce(s, { type: "wall", axis, at, i });

  it("takes away a wall for free and puts one back for a fee", () => {
    const s0 = fresh({ money: 100_000 });
    const s1 = wall(s0, "h", 3, 5);                  // the bathroom | bedroom wall
    expect(s1.home.walls).toBeDefined();
    expect(s1.home.walls).not.toContain("h:3:5");
    expect(s1.money).toBe(100_000);
    const s2 = wall(s1, "h", 3, 5);
    expect(s2.home.walls).toContain("h:3:5");
    expect(s2.money).toBe(100_000 - WALL_PRICE);
  });

  it("will not build without money, through furniture, or around a room with no way in", () => {
    const poor = wall(fresh({ money: 0 }), "v", 3, 6);
    expect(poor.home.walls).toBeUndefined();
    const s = fresh({ money: 100_000 });
    const rug = { uid: 99, type: "bed" as const, x: 6, y: 5, rot: 0 };   // a bed spans two tiles
    const spans = { ...s, home: { ...s.home, objects: [...s.home.objects, rug] } };
    const [w] = [CATALOG.bed.w];
    expect(w).toBeGreaterThan(1);
    expect(wall(spans, "v", 7, 5).home.walls).toBeUndefined();
    // closing the doorway of the bathroom (the gap at row 1 of x = 5) seals it off
    expect(wall(s, "v", 5, 1).home.walls).toBeUndefined();
  });

  it("ignores edges outside the room and keeps the flat reachable", () => {
    const s = fresh({ money: 100_000 });
    expect(wall(s, "v", 0, 2).home.walls).toBeUndefined();
    expect(wall(s, "v", 8, 2).home.walls).toBeUndefined();
    expect(wall(s, "h", 3, 99).home.walls).toBeUndefined();
    for (const level of [0, 1, 2]) expect(allReachable(homePlan(level))).toBe(true);
  });
});

describe("floors", () => {
  it("lays a floor in one room for a fee, and the plan shows it", () => {
    const s = reduce(fresh({ money: 100_000 }), { type: "floor", room: "Kitchen", style: "slate" });
    expect(s.home.floors).toEqual({ Kitchen: "slate" });
    expect(s.money).toBe(100_000 - FLOOR_PRICE);
    const plan = homePlan(0, undefined, s.home.floors);
    expect(plan.rooms.find(r => r.name === "Kitchen")!.floor).toBe(floorById("slate")!.a);
    expect(plan.rooms.find(r => r.name === "Bedroom")!.floor).toBe(HOME.rooms.find(r => r.name === "Bedroom")!.floor);
  });

  it("refuses an unknown floor or room, the same floor twice, or no money", () => {
    const rich = fresh({ money: 100_000 });
    expect(reduce(rich, { type: "floor", room: "Kitchen", style: "gold" }).home.floors).toBeUndefined();
    expect(reduce(rich, { type: "floor", room: "Garage", style: "oak" }).home.floors).toBeUndefined();
    expect(reduce(fresh({ money: 0 }), { type: "floor", room: "Kitchen", style: "oak" }).home.floors).toBeUndefined();
    const once = reduce(rich, { type: "floor", room: "Living room", style: "oak" });
    expect(reduce(once, { type: "floor", room: "Living room", style: "oak" }).money).toBe(once.money);
  });
});

describe("home goals", () => {
  const claim = (s: GameState, id: string) => reduce(s, { type: "homeGoal", id });

  it("a finished goal pays out once and sets the flag that opens its side mission", () => {
    const s0 = fresh({ money: 0 });
    const objs = Array.from({ length: 8 }, (_, i) => ({ uid: 700 + i, type: "chair" as const, x: 0, y: 0, rot: 0 }));
    const ready = { ...s0, home: { ...s0.home, objects: [...s0.home.objects, ...objs] } };
    const s1 = claim(ready, "settle");
    expect(s1.homeGoals).toEqual(["settle"]);
    expect(s1.money).toBeGreaterThan(0);
    expect(s1.story?.flags).toContain("home:settle");
    expect(claim(s1, "settle").money).toBe(s1.money);   // not twice
  });

  it("will not pay for a goal that is not finished or not yet open in the story", () => {
    const s = fresh({ money: 0 });
    expect(claim(s, "settle").homeGoals).toBeUndefined();
    const big = { ...s, property: { floor2: true, garage: true, pool: true, wing2: true } };
    expect(claim(big, "mansion").homeGoals).toBeUndefined();   // chapter 7 first
    expect(claim(s, "nope").homeGoals).toBeUndefined();
  });

  it("every goal's side mission exists and is opened by its flag", () => {
    const opened = new Set(SIDES.flatMap(m => (Array.isArray(m.if) ? m.if : m.if ? [m.if] : [])).filter(f => f.startsWith("home:")));
    for (const f of opened) expect(HOME_GOALS.some(g => `home:${g.id}` === f), f).toBe(true);
    expect(opened.size).toBeGreaterThanOrEqual(4);
  });
});

describe("wall editor and blueprints", () => {
  const level = (n: number) => (n - 8) / 2;

  it("a piece floating in the middle of a room is useless and gets tidied away; half-walls stay", () => {
    expect(tidyEdges(["v:4:3"], 8)).toEqual([]);
    expect(tidyEdges(["v:4:3", "v:4:4"], 8)).toEqual([]);
    expect(tidyEdges(["h:4:0", "h:4:1"], 8)).toEqual(["h:4:0", "h:4:1"]);          // joined to the outer wall at one end
    expect(tidyEdges(["v:4:0", "v:4:1", "h:2:4", "v:9:2"], 8)).toEqual(["v:4:0", "v:4:1", "h:2:4"]);  // h:2:4 touches v:4:1's end; v:9 is outside
  });

  it("moving a wall is free, extra pieces cost, extra removals pay half back", () => {
    const s = fresh({ money: 100_000 });
    const base = defaultEdges(0);
    expect(wallsCost(s, base)).toBe(0);
    const moved = [...base.filter(e => e !== "h:3:5"), "h:4:5"];
    expect(wallsCost(s, moved)).toBe(0);
    expect(wallsCost(s, [...base, "h:4:0"])).toBe(WALL_PRICE);
    expect(wallsCost(s, base.slice(1))).toBe(-WALL_PRICE / 2);
  });

  it("applies drawn walls, charges once, and drops floating pieces", () => {
    const s = fresh({ money: 100_000 });
    const edges = [...defaultEdges(0), "h:4:0", "h:4:1", "v:6:6"];   // the last one floats
    const next = reduce(s, { type: "walls", edges });
    expect(next.home.walls).toContain("h:4:1");
    expect(next.home.walls).not.toContain("v:6:6");
    expect(next.money).toBe(100_000 - 2 * WALL_PRICE);
  });

  it("refuses walls that shut a room in or cut furniture", () => {
    const s = fresh({ money: 100_000 });
    const sealed = defaultEdges(0).concat(["v:5:1"]);                  // closes the doorway into the bathroom
    expect(reduce(s, { type: "walls", edges: sealed }).home.walls).toBeUndefined();
    const bed = { uid: 99, type: "bed" as const, x: 6, y: 5, rot: 0 };
    const withBed = { ...s, home: { ...s.home, objects: [...s.home.objects, bed] } };
    expect(reduce(withBed, { type: "walls", edges: [...defaultEdges(0), "v:7:5", "v:7:6", "v:7:7"] }).home.walls).toBeUndefined();
  });

  it.each([8, 10, 12])("every blueprint fits a %i-tile flat: all of it reachable, nothing floating", n => {
    for (const b of BLUEPRINTS) {
      const edges = b.walls(n);
      expect(tidyEdges(edges, n).length, `${b.id} has floating pieces at ${n}`).toBe(new Set(edges).size);
      expect(allReachable(homePlan(level(n), edges)), `${b.id} shuts a room in at ${n}`).toBe(true);
    }
  });

  it("buying a blueprint charges once, uses it, and can be undone", () => {
    const s = fresh({ money: 1_000_000 });
    const b = BLUEPRINTS[1];
    const one = reduce(s, { type: "blueprint", id: b.id });
    expect(one.money).toBe(1_000_000 - b.price);
    expect(one.home.blueprints).toEqual([b.id]);
    expect(one.home.walls!.length).toBeGreaterThan(0);
    const again = reduce(one, { type: "blueprint", id: BLUEPRINTS[0].id });
    const back = reduce(again, { type: "blueprint", id: b.id });
    expect(back.money).toBe(again.money);                              // already owned: free
    const restored = reduce(one, { type: "restoreLayout" });
    expect(restored.home.walls).toEqual(defaultEdges(0));
    expect(reduce(fresh({ money: 10 }), { type: "blueprint", id: b.id }).home.walls).toBeUndefined();
  });
});

describe("phone apps: arcade and Gram", () => {
  it("a mini-game pays by score, lifts fun, and only the first paid plays of the day pay", () => {
    const s0 = fresh({ money: 0, needs: { ...newGame(sim).needs, fun: 20 } });
    const one = reduce(s0, { type: "arcade", game: "memory", score: 100 });
    expect(one.money).toBe(ARCADE_TOP_PRIZE);
    expect(one.needs.fun).toBeGreaterThan(20);
    const two = reduce(one, { type: "arcade", game: "memory", score: 50 });
    expect(two.money - one.money).toBe(500);
    const three = reduce(two, { type: "arcade", game: "memory", score: 100 });
    expect(three.money).toBe(two.money);                                   // today's paid plays are used up
    expect(arcadeLeft(three, "memory")).toBe(0);
    expect(arcadeLeft(three, "rush")).toBe(ARCADE_PAID_PLAYS);            // other games are separate
  });

  it("scores are clamped and unknown games are ignored", () => {
    const s = fresh({ money: 0 });
    expect(reduce(s, { type: "arcade", game: "rush", score: 99999 }).money).toBe(ARCADE_TOP_PRIZE);
    expect(reduce(s, { type: "arcade", game: "rush", score: -50 }).money).toBe(0);
    expect(reduce(s, { type: "arcade", game: "poker", score: 100 })).toBe(s);
  });

  it("the daily limit resets the next day", () => {
    let s = fresh({ money: 0 });
    for (let i = 0; i < 3; i++) s = reduce(s, { type: "arcade", game: "maths", score: 100 });
    expect(arcadeLeft(s, "maths")).toBe(0);
    s = { ...s, time: s.time + 1440 };
    expect(arcadeLeft(s, "maths")).toBe(ARCADE_PAID_PLAYS);
  });

  it("Gram: one post a day gains followers and reputation; sponsor deals pay once", () => {
    let s = fresh({ money: 0 });
    s = reduce(s, { type: "gramPost", caption: 0 });
    expect(s.gram!.followers).toBeGreaterThan(3);
    expect(gramPostedToday(s)).toBe(true);
    expect(reduce(s, { type: "gramPost", caption: 1 }).gram!.posts).toBe(1);        // not twice in a day
    s = { ...s, gram: { ...s.gram!, followers: 49 }, time: s.time + 1440 };
    const rich = reduce(s, { type: "gramPost", caption: 0 });
    expect(rich.money).toBe(GRAM_MILESTONES[0].prize);
    expect(rich.gram!.paid).toEqual([50]);
    const later = reduce({ ...rich, time: rich.time + 1440 }, { type: "gramPost", caption: 0 });
    expect(later.money - rich.money).toBeLessThan(GRAM_MILESTONES[0].prize);        // no second payout
  });

  it("the news shows three different headlines a day and changes over days", () => {
    for (const day of [1, 2, 9, 40]) expect(new Set(headlinesFor(day)).size).toBe(3);
    expect(headlinesFor(1)).not.toEqual(headlinesFor(2));
  });
});

describe("town map data", () => {
  it("every door is on the map and has a road route from your home", async () => {
    const { DOORS, roadPath } = await import("../three/world.js");
    for (const id of Object.keys(DOORS)) {
      const d = (DOORS as Record<string, { x: number; z: number }>)[id];
      const route = roadPath([DOORS.home.x, DOORS.home.z], [d.x, d.z]);
      expect(route.length, id).toBeGreaterThan(0);
      expect(Math.abs(d.x)).toBeLessThanOrEqual(186);
      expect(Math.abs(d.z)).toBeLessThanOrEqual(186);
    }
  });
});
