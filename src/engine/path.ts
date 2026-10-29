// Tile grid helpers for your room: footprints, walls, placement and breadth-first pathfinding.
// Pure functions, no screen code, so the tests can use them too.

import { CATALOG, type HomePlan, type Placed, type FurnitureType } from "../data/home";

export type Tile = { x: number; y: number };
type Shape = { type: FurnitureType; x: number; y: number; rot: number; uid?: number };

/** Footprint of an object after its quarter turns: [w, d]. */
export function footprint(obj: Shape): [number, number] {
  const spec = CATALOG[obj.type];
  const w = spec?.w ?? 1;
  const d = spec?.d ?? 1;
  return (obj.rot ?? 0) % 2 ? [d, w] : [w, d];
}

/** Every tile an object covers. */
export function tilesOf(obj: Shape): Tile[] {
  const [w, d] = footprint(obj);
  const out: Tile[] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push({ x: obj.x + i, y: obj.y + j });
  return out;
}

export function inside(home: HomePlan, x: number, y: number) {
  return x >= 0 && y >= 0 && x < home.size && y < home.size;
}

/** Can the Sim stand on (x, y)? Inside the room, and no solid furniture there. */
export function walkable(home: HomePlan, objects: Placed[], x: number, y: number): boolean {
  if (!inside(home, x, y)) return false;
  for (const o of objects) {
    if (CATALOG[o.type]?.walkable) continue;
    const [w, d] = footprint(o);
    if (x >= o.x && x < o.x + w && y >= o.y && y < o.y + d) return false;
  }
  return true;
}

/** Is there a wall (without a door) between neighbouring tiles a and b? */
export function wallBetween(home: HomePlan, a: Tile, b: Tile): boolean {
  for (const w of home.walls) {
    if (a.y === b.y && Math.abs(a.x - b.x) === 1 && w.axis === "v") {
      if (Math.max(a.x, b.x) === w.at && a.y >= w.from && a.y < w.to && !w.doors.includes(a.y)) return true;
    }
    if (a.x === b.x && Math.abs(a.y - b.y) === 1 && w.axis === "h") {
      if (Math.max(a.y, b.y) === w.at && a.x >= w.from && a.x < w.to && !w.doors.includes(a.x)) return true;
    }
  }
  return false;
}

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/** Shortest route from start to goal (start not included), or null. [] means you're there. */
export function findPath(home: HomePlan, objects: Placed[], start: Tile, goal: Tile): Tile[] | null {
  if (start.x === goal.x && start.y === goal.y) return [];
  if (!walkable(home, objects, goal.x, goal.y)) return null;
  const key = (p: Tile) => p.x * 1000 + p.y;
  const came = new Map<number, Tile | null>([[key(start), null]]);
  const queue: Tile[] = [start];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    for (const [dx, dy] of STEPS) {
      const next = { x: cur.x + dx, y: cur.y + dy };
      const k = key(next);
      if (came.has(k) || !walkable(home, objects, next.x, next.y) || wallBetween(home, cur, next)) continue;
      came.set(k, cur);
      if (next.x === goal.x && next.y === goal.y) {
        const route: Tile[] = [];
        for (let p: Tile | null | undefined = next; p && key(p) !== key(start); p = came.get(key(p))) route.unshift(p);
        return route;
      }
      queue.push(next);
    }
  }
  return null;
}

/** Free tiles touching an object (not through a wall). */
export function tilesAround(home: HomePlan, objects: Placed[], obj: Shape): Tile[] {
  const [w, d] = footprint(obj);
  const out: Tile[] = [];
  const add = (x: number, y: number, from: Tile) => {
    if (walkable(home, objects, x, y) && !wallBetween(home, from, { x, y })) out.push({ x, y });
  };
  for (let i = 0; i < w; i++) {
    add(obj.x + i, obj.y + d, { x: obj.x + i, y: obj.y + d - 1 });
    add(obj.x + i, obj.y - 1, { x: obj.x + i, y: obj.y });
  }
  for (let j = 0; j < d; j++) {
    add(obj.x + w, obj.y + j, { x: obj.x + w - 1, y: obj.y + j });
    add(obj.x - 1, obj.y + j, { x: obj.x, y: obj.y + j });
  }
  return out;
}

/** Route to the nearest reachable tile beside an object, or null. */
export function routeToObject(home: HomePlan, objects: Placed[], start: Tile, obj: Shape) {
  let best: { tile: Tile; route: Tile[] } | null = null;
  for (const t of tilesAround(home, objects, obj)) {
    const r = findPath(home, objects, start, t);
    if (r && (!best || r.length < best.route.length)) best = { tile: t, route: r };
  }
  return best;
}

/** Can this object go at its x/y/rot? Inside, on free tiles, not across a wall,
 *  not blocking the front door, and every usable piece can still be reached. */
export function canPlace(home: HomePlan, objects: Placed[], obj: Shape): boolean {
  const tiles = tilesOf(obj);
  const others = objects.filter(o => o.uid !== obj.uid);
  const solid = !CATALOG[obj.type]?.walkable;
  for (const t of tiles) {
    if (!inside(home, t.x, t.y)) return false;
    if (solid && t.x === home.door.x && t.y === home.door.y) return false;
    for (const o of others) {
      if (CATALOG[o.type]?.walkable !== CATALOG[obj.type]?.walkable) continue; // a rug can sit under furniture
      if (tilesOf(o).some(u => u.x === t.x && u.y === t.y)) return false;
    }
  }
  for (const a of tiles) {
    for (const b of tiles) {
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1 && wallBetween(home, a, b)) return false;
    }
  }
  if (!solid) return true;
  // Don't box anything in: from the door, you must still reach every piece.
  const after = [...others, { ...obj, uid: obj.uid ?? -1 } as Placed];
  return after.every(o => CATALOG[o.type].walkable || routeToObject(home, after, home.door, o) !== null);
}
