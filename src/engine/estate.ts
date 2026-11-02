// Building on your property and buying, painting, selling and parking cars. Pure rules, like the rest of the engine.
// Everything lives in the game save (so it is saved to your account with the rest of your life).

import type { GameState } from "./game";
import type { Kit } from "./phone";
import { FLOOR_PRICE, WALL_PRICE, edgeKey, floorById, homePlan, roomNames, wallsToEdges, wingLevel } from "../data/home";
import { allReachable, footprint } from "./path";
import {
  CARS, CAR_RESALE, REPAINT_PRICE, SLOTS, UPGRADES, carById, freeSlot, slotNear, upgradeById,
  type CarId, type SlotId, type Vehicle,
} from "../data/estate";

export type EstateCommand =
  | { type: "build"; id: string }
  | { type: "wall"; axis: "v" | "h"; at: number; i: number }
  | { type: "floor"; room: string; style: string }
  | { type: "buyCar"; model: string; color: string }
  | { type: "sellCar"; uid: number }
  | { type: "paintCar"; uid: number; color: string }
  | { type: "parkCar"; uid: number; x: number; z: number; yaw: number };

export const MAX_CARS = 4;

/** Why you cannot build this yet (a short sentence), or null. */
export function buildBlocker(s: GameState, id: string): string | null {
  const u = upgradeById(id);
  if (!u) return "Unknown upgrade.";
  if (s.property?.[u.id]) return "You already built this.";
  const missing = u.needs?.filter(n => !s.property?.[n]).map(n => upgradeById(n)!.name);
  if (missing?.length) return `Build first: ${missing.join(", ")}.`;
  if (s.money < u.price) return "Not enough money.";
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
      const next = kit.charge(s, u.price, "home", u.name);
      return kit.say({ ...next, property: { ...next.property, [u.id]: true } }, `🏗️ ${u.name} ${kit.money(u.price)}`);
    }

    case "wall": {
      // Add or take away one piece of wall between two tiles. Removing is free; a new piece costs WALL_PRICE.
      const level = wingLevel(s.property);
      const now = homePlan(level, s.home.walls);
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

    case "floor": {
      // Lay a new floor in one room
      const plan = homePlan(wingLevel(s.property));
      if (!floorById(cmd.style) || !roomNames(plan).includes(cmd.room)) return s;
      if (s.home.floors?.[cmd.room] === cmd.style) return s;
      if (s.money < FLOOR_PRICE) return kit.say(s, "Not enough money for a new floor.");
      const paid = kit.charge(s, FLOOR_PRICE, "home", "Floor");
      return { ...paid, home: { ...paid.home, floors: { ...paid.home.floors, [cmd.room]: cmd.style } } };
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
