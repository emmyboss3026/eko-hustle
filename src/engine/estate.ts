// Building on your property and buying, painting, selling and parking cars. Pure rules, like the rest of the engine.
// Everything lives in the game save (so it is saved to your account with the rest of your life).

import type { GameState } from "./game";
import type { Kit } from "./phone";
import { CATALOG, FLOOR_PRICE, WALL_PRICE, defaultEdges, flatSize, onFloor, stairsFor, edgeKey, floorById, homePlan, roomNames, tidyEdges, wallsToEdges, wingLevel } from "../data/home";
import { blueprintById } from "../data/blueprints";
import { allReachable, footprint, tilesOf } from "./path";
import { HOME_GOALS, homeGoalById, type HomeGoal } from "../data/homeGoals";
import { applyEffect, chapterOf, taskProgress } from "./story";
import {
  CARS, CAR_RESALE, REPAINT_PRICE, SLOTS, UPGRADES, carById, freeSlot, landCost, plotById, plotTier, slotNear, upgradeById,
  type CarId, type SlotId, type Vehicle,
} from "../data/estate";

export type EstateCommand =
  | { type: "build"; id: string }
  | { type: "wall"; axis: "v" | "h"; at: number; i: number }
  | { type: "buyLand"; tier: number }
  | { type: "walls"; edges: string[] }
  | { type: "blueprint"; id: string }
  | { type: "restoreLayout" }
  | { type: "floor"; room: string; style: string }
  | { type: "homeGoal"; id: string }
  | { type: "buyCar"; model: string; color: string }
  | { type: "sellCar"; uid: number }
  | { type: "paintCar"; uid: number; color: string }
  | { type: "parkCar"; uid: number; x: number; z: number; yaw: number };

export const MAX_CARS = 12;           // the parking you have is the real limit (see slotsFor)
export const LAND_FROM_CHAPTER = 3;   // the rent mission in chapter 2 must be behind you before you can leave the flat

/** Where a home goal stands: its tasks, whether the story has opened it, and whether it is done or claimed. */
export function homeGoalState(s: GameState, g: HomeGoal) {
  const tasks = g.tasks.map((t, i) => taskProgress(s, t, undefined, i));
  const open = !g.ch || chapterOf(s) >= g.ch;
  const claimed = !!s.homeGoals?.includes(g.id);
  return { tasks, open, claimed, ready: open && !claimed && tasks.every(t => t.done) };
}

const sizeOf = (s: GameState) => flatSize(wingLevel(s.property));
const edgesNow = (s: GameState) => s.home.walls ?? defaultEdges(wingLevel(s.property));

/** Does a piece of furniture stand across this wall? A wall between its tiles would cut it in two. */
export function straddles(s: GameState, e: string): boolean {
  const [axis, at, i] = e.split(":");
  const a = axis === "v" ? { x: +at - 1, y: +i } : { x: +i, y: +at - 1 };
  const b = axis === "v" ? { x: +at, y: +i } : { x: +i, y: +at };
  return onFloor(s.home.objects, 0).some(o => {
    const [w, d] = footprint(o);
    const covers = (t: { x: number; y: number }) => t.x >= o.x && t.x < o.x + w && t.y >= o.y && t.y < o.y + d;
    return covers(a) && covers(b);
  });
}

/** Why a set of walls cannot be built (a short sentence), or null. */
export function wallsProblem(s: GameState, edges: string[]): string | null {
  if (edges.some(e => straddles(s, e))) return "Furniture is in the way of a wall.";
  if (!allReachable(homePlan(wingLevel(s.property), edges, undefined, !!s.property?.floor2))) return "A wall would shut a room in. Leave a gap for a door.";
  return null;
}

/** What it costs to change from the walls you have to these (negative: you get money back). Moving a wall costs nothing:
 *  each piece taken away pays for one put somewhere else. Extra pieces cost WALL_PRICE; extra pieces removed pay half back. */
export function wallsCost(s: GameState, edges: string[]): number {
  const before = new Set(edgesNow(s));
  const after = new Set(edges);
  const added = [...after].filter(e => !before.has(e)).length;
  const removed = [...before].filter(e => !after.has(e)).length;
  const paired = Math.min(added, removed);
  return (added - paired) * WALL_PRICE - Math.floor(((removed - paired) * WALL_PRICE) / 2);
}

export const homeGoalsDone = (s: GameState) => HOME_GOALS.filter(g => s.homeGoals?.includes(g.id)).length;

/** Why you cannot build this yet (a short sentence), or null. */
export function buildBlocker(s: GameState, id: string): string | null {
  const u = upgradeById(id);
  if (!u) return "Unknown upgrade.";
  if (s.property?.[u.id]) return "You already built this.";
  const missing = u.needs?.filter(n => !s.property?.[n]).map(n => upgradeById(n)!.name);
  if (missing?.length) return `Build first: ${missing.join(", ")}.`;
  if (u.land && plotTier(s.property) < u.land) return `Needs ${plotById(u.land)?.name ?? "more land"} or bigger.`;
  if (s.money < u.price) return "Not enough money.";
  return null;
}

/** Why you cannot buy this plot yet (a short sentence), or null. */
export function landBlocker(s: GameState, tier: number): string | null {
  const plot = plotById(tier);
  if (!plot) return "Unknown plot.";
  if (plotTier(s.property) >= tier) return "You already have this plot or a bigger one.";
  if (chapterOf(s) < LAND_FROM_CHAPTER) return "Not yet: get through the first chapters of your story first.";
  if (s.rentOwed > 0) return "Pay the rent you owe before you leave the flat.";
  if (s.money < landCost(plotTier(s.property), tier)) return "Not enough money.";
  return null;
}

/** Why you cannot buy this car yet, or null. */
export function carBlocker(s: GameState, model: string): string | null {
  const c = carById(model);
  if (!c) return "Unknown car.";
  const mine = s.vehicles ?? [];
  if (mine.length >= MAX_CARS) return `You can own up to ${MAX_CARS} vehicles.`;
  if (s.money < c.price) return "Not enough money.";
  if (!freeSlot(s.property, mine)) return "No free parking space at home. Build a driveway or a garage, or sell a car.";
  return null;
}

const validColor = (c: unknown): c is string => typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c);

export function estateStep(s: GameState, cmd: EstateCommand, kit: Kit): GameState {
  const mine = s.vehicles ?? [];
  switch (cmd.type) {
    case "build": {
      if (buildBlocker(s, cmd.id)) return s;
      const u = upgradeById(cmd.id)!;
      let next = kit.charge(s, u.price, "home", u.name);
      next = { ...next, property: { ...next.property, [u.id]: true } };
      if (u.id === "floor2") {
        // The stairs take up three tiles beside the front wall (and the space at their foot): furniture standing there is sold back in full
        const st = stairsFor(sizeOf(next));
        const blocked = [...st.tiles, st.entry];
        const gone = next.home.objects.filter(o => (o.lvl ?? 0) === 0 && !CATALOG[o.type].fixed && tilesOf(o).some(t => blocked.some(b => b.x === t.x && b.y === t.y)));
        for (const o of gone) next = kit.move(next, CATALOG[o.type].price, "home", `${CATALOG[o.type].name} (moved out for the stairs)`);
        next = { ...next, home: { ...next.home, objects: next.home.objects.filter(o => !gone.includes(o)) } };
      }
      return kit.say(next, `🏗️ ${u.name} ${kit.money(u.price)}`);
    }

    case "wall": {
      // Add or take away one piece of wall between two tiles. Removing is free; a new piece costs WALL_PRICE.
      const level = wingLevel(s.property);
      const now = homePlan(level, s.home.walls, undefined, !!s.property?.floor2);
      const { axis, at, i } = cmd;
      if ((axis !== "v" && axis !== "h") || !Number.isInteger(at) || !Number.isInteger(i)) return s;
      if (at < 1 || at >= now.size || i < 0 || i >= now.size) return s;
      const cur = s.home.walls ?? wallsToEdges(now.walls);
      const key = edgeKey(axis, at, i);
      const has = cur.includes(key);
      if (!has) {
        if (s.money < WALL_PRICE) return kit.say(s, "Not enough money for a wall.");
        const a = axis === "v" ? { x: at - 1, y: i } : { x: i, y: at - 1 };
        const b = axis === "v" ? { x: at, y: i } : { x: i, y: at };
        const across = s.home.objects.some(o => {
          const [w, d] = footprint(o);
          const covers = (t: { x: number; y: number }) => t.x >= o.x && t.x < o.x + w && t.y >= o.y && t.y < o.y + d;
          return covers(a) && covers(b);
        });
        if (across) return kit.say(s, "Furniture is in the way of that wall.");
      }
      const next = has ? cur.filter(e => e !== key) : [...cur, key];
      if (!allReachable(homePlan(level, next))) return kit.say(s, "That wall would shut a room in. Leave a gap for a door.");
      const paid = has ? s : kit.charge(s, WALL_PRICE, "home", "Wall");
      return { ...paid, home: { ...paid.home, walls: next } };
    }

    case "buyLand": {
      // Buy a plot and move onto it: rent stops, your things come with you, your cars are parked on the new land
      if (landBlocker(s, cmd.tier)) return s;
      const plot = plotById(cmd.tier)!;
      const first = plotTier(s.property) === 0;
      const paid = kit.charge(s, landCost(plotTier(s.property), cmd.tier), "home", plot.name);
      let next: GameState = { ...paid, property: { ...paid.property, land: cmd.tier }, rentOwed: 0 };
      // park every car again, in the best free spaces of the new land
      const placed: Vehicle[] = [];
      for (const v of next.vehicles ?? []) {
        const slot = freeSlot(next.property, placed);
        placed.push(slot ? { ...v, ...SLOTS[slot] } : v);
      }
      next = { ...next, vehicles: placed };
      return kit.say(next, first ? `${plot.emoji} ${plot.name}: you own your land now, no more rent.` : `${plot.emoji} ${plot.name}`);
    }

    case "walls": {
      // Build the walls you drew in the wall editor, all at once. Useless pieces (floating in the middle of a room) are left out.
      if (!Array.isArray(cmd.edges) || cmd.edges.length > 400) return s;
      const edges = tidyEdges(cmd.edges.filter(e => typeof e === "string"), sizeOf(s));
      const bad = wallsProblem(s, edges);
      if (bad) return kit.say(s, bad);
      const cost = wallsCost(s, edges);
      if (cost > s.money) return kit.say(s, "Not enough money for these walls.");
      const paid = cost > 0 ? kit.charge(s, cost, "home", "Walls") : cost < 0 ? kit.move(s, -cost, "home", "Walls") : s;
      return { ...paid, home: { ...paid.home, walls: edges } };
    }

    case "blueprint": {
      // Buy a blueprint once, then use it whenever you like. It replaces your walls and floors (the old ones can be restored).
      const b = blueprintById(cmd.id);
      if (!b) return s;
      const owned = !!s.home.blueprints?.includes(b.id);
      if (!owned && s.money < b.price) return kit.say(s, "Not enough money for this blueprint.");
      const size = sizeOf(s);
      const edges = tidyEdges(tidyEdges(b.walls(size), size).filter(e => !straddles(s, e)), size);
      const names = roomNames(homePlan(wingLevel(s.property)));
      const floors = Object.fromEntries(Object.entries(b.floors).filter(([room]) => names.includes(room)));
      const paid = owned ? s : kit.charge(s, b.price, "home", b.name);
      return kit.say(
        { ...paid, home: { ...paid.home, walls: edges, floors, blueprints: owned ? paid.home.blueprints : [...(paid.home.blueprints ?? []), b.id], prevWalls: edgesNow(s), prevFloors: s.home.floors } },
        `${b.emoji} ${b.name}`,
      );
    }

    case "restoreLayout": {
      if (!s.home.prevWalls) return s;
      return { ...s, home: { ...s.home, walls: s.home.prevWalls, floors: s.home.prevFloors, prevWalls: edgesNow(s), prevFloors: s.home.floors } };
    }

    case "floor": {
      // Lay a new floor in one room
      const plan = homePlan(wingLevel(s.property));
      if (!floorById(cmd.style) || !roomNames(plan).includes(cmd.room)) return s;
      if (s.home.floors?.[cmd.room] === cmd.style) return s;
      if (s.money < FLOOR_PRICE) return kit.say(s, "Not enough money for a new floor.");
      const paid = kit.charge(s, FLOOR_PRICE, "home", "Floor");
      return { ...paid, home: { ...paid.home, floors: { ...paid.home.floors, [cmd.room]: cmd.style } } };
    }

    case "homeGoal": {
      // Claim a finished goal: its reward, and a story flag that opens the side mission that follows
      const g = homeGoalById(cmd.id);
      if (!g || !homeGoalState(s, g).ready) return s;
      const next = applyEffect({ ...s, homeGoals: [...(s.homeGoals ?? []), g.id] }, { ...g.reward, flag: `home:${g.id}` }, g.name, kit);
      return kit.say(next, `${g.emoji} ${g.name}`);
    }

    case "buyCar": {
      const c = carById(cmd.model);
      if (!c || carBlocker(s, cmd.model) || !validColor(cmd.color)) return s;
      const slot = freeSlot(s.property, mine)!;
      const car: Vehicle = { uid: (s.nextVehicle ?? 1), model: c.id, color: cmd.color, ...SLOTS[slot] };
      const next = kit.charge(s, c.price, "transport", c.name);
      return kit.say({ ...next, vehicles: [...mine, { uid: car.uid, model: car.model, color: car.color, x: car.x, z: car.z, yaw: car.yaw }], nextVehicle: car.uid + 1 }, `${c.emoji} ${c.name} ${kit.money(c.price)}`);
    }

    case "sellCar": {
      const car = mine.find(v => v.uid === cmd.uid);
      if (!car) return s;
      const c = carById(car.model)!;
      const back = Math.round(c.price * CAR_RESALE);
      const next = kit.move({ ...s, vehicles: mine.filter(v => v.uid !== car.uid) }, back, "transport", `Sold ${c.name}`);
      return kit.say(next, `${c.emoji} Sold ${c.name} for ${kit.money(back)}`);
    }

    case "paintCar": {
      const car = mine.find(v => v.uid === cmd.uid);
      if (!car || !validColor(cmd.color) || cmd.color === car.color || s.money < REPAINT_PRICE) return s;
      const next = kit.charge(s, REPAINT_PRICE, "transport", `Repaint ${carById(car.model)!.name}`);
      return { ...next, vehicles: mine.map(v => (v.uid === car.uid ? { ...v, color: cmd.color } : v)) };
    }

    case "parkCar": {
      const car = mine.find(v => v.uid === cmd.uid);
      const ok = [cmd.x, cmd.z, cmd.yaw].every(n => Number.isFinite(n)) && Math.abs(cmd.x) <= 186 && Math.abs(cmd.z) <= 186;
      if (!car || !ok) return s;
      // Near one of your parking spaces, the car settles into it neatly
      const slot: SlotId | null = slotNear(s.property, cmd.x, cmd.z);
      const spot = slot ? SLOTS[slot] : { x: cmd.x, z: cmd.z, yaw: cmd.yaw };
      return { ...s, vehicles: mine.map(v => (v.uid === car.uid ? { ...v, x: spot.x, z: spot.z, yaw: spot.yaw } : v)) };
    }
  }
}

export const estateCatalog = { UPGRADES, CARS };
export type { CarId };
