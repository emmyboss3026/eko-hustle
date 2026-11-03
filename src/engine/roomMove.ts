// Free movement inside a home: the Sim is a circle that glides anywhere on the floor, slides along walls and furniture instead of
// stopping dead, and click-to-move routes are straightened so the Sim cuts corners rather than hopping from tile to tile.
// Positions are in tile units: tile (i, j) covers i..i+1 and j..j+1. Pure functions, so the tests can use them.

import { CATALOG, type HomePlan, type Placed } from "../data/home";
import { footprint, type Tile } from "./path";

export const SIM_RADIUS = 0.24;
const WALL_THICK = 0.05;   // half the thickness of an inside wall

type Rect = { x0: number; z0: number; x1: number; z1: number };

/** Does a circle at (x, z) overlap this rectangle? */
const hits = (r: Rect, x: number, z: number, rad: number) => {
  const cx = Math.max(r.x0, Math.min(x, r.x1));
  const cz = Math.max(r.z0, Math.min(z, r.z1));
  return (x - cx) ** 2 + (z - cz) ** 2 < rad * rad;
};

/** Everything solid on this floor, as rectangles: inside walls, steps and furniture. */
export function solidsOf(plan: HomePlan, objects: Placed[]): Rect[] {
  const out: Rect[] = [];
  for (const w of plan.walls) {
    for (let i = w.from; i < w.to; i++) {
      if (w.doors.includes(i)) continue;
      out.push(w.axis === "v"
        ? { x0: w.at - WALL_THICK, x1: w.at + WALL_THICK, z0: i, z1: i + 1 }
        : { x0: i, x1: i + 1, z0: w.at - WALL_THICK, z1: w.at + WALL_THICK });
    }
  }
  for (const t of plan.stairs?.tiles ?? []) out.push({ x0: t.x, x1: t.x + 1, z0: t.y, z1: t.y + 1 });
  for (const o of objects) {
    if (CATALOG[o.type]?.walkable) continue;          // rugs are walked on
    const [w, d] = footprint(o);
    out.push({ x0: o.x + 0.03, x1: o.x + w - 0.03, z0: o.y + 0.03, z1: o.y + d - 0.03 });
  }
  return out;
}

/** Is a Sim of this size at (x, z) in a wall, on the steps, in furniture or outside the flat? */
export function roomBlocked(plan: HomePlan, solids: Rect[], x: number, z: number, rad = SIM_RADIUS): boolean {
  if (x < rad || z < rad || x > plan.size - rad || z > plan.size - rad) return true;
  return solids.some(r => hits(r, x, z, rad));
}

/** Move by (dx, dz), sliding along whatever is in the way: try the whole move, then each direction on its own.
 *  A Sim that already stands somewhere blocked (furniture was put on top of it) may move freely out of it. */
export function slideMove(plan: HomePlan, solids: Rect[], x: number, z: number, dx: number, dz: number, rad = SIM_RADIUS): [number, number] {
  if (roomBlocked(plan, solids, x, z, rad)) return [x + dx, z + dz];
  if (!roomBlocked(plan, solids, x + dx, z + dz, rad)) return [x + dx, z + dz];
  if (!roomBlocked(plan, solids, x + dx, z, rad)) return [x + dx, z];
  if (!roomBlocked(plan, solids, x, z + dz, rad)) return [x, z + dz];
  return [x, z];
}

/** Can the Sim walk in a straight line from a to b without touching anything? */
export function lineClear(plan: HomePlan, solids: Rect[], a: [number, number], b: [number, number], rad = SIM_RADIUS): boolean {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.ceil(len / 0.15));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (roomBlocked(plan, solids, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, rad)) return false;
  }
  return true;
}

/** Straighten a route of tile centres: keep only the corners the Sim really has to turn at. The last tile is always kept. */
export function smoothPath(plan: HomePlan, objects: Placed[], from: [number, number], route: Tile[]): Tile[] {
  if (route.length < 2) return route;
  const solids = solidsOf(plan, objects);
  const centre = (t: Tile): [number, number] => [t.x + 0.5, t.y + 0.5];
  const out: Tile[] = [];
  let at = from;
  let i = 0;
  while (i < route.length) {
    // the furthest tile ahead (within a few tiles) that can be walked to in a straight line
    let best = i;
    for (let j = Math.min(route.length - 1, i + 8); j > i; j--) {
      if (lineClear(plan, solids, at, centre(route[j]))) { best = j; break; }
    }
    out.push(route[best]);
    at = centre(route[best]);
    i = best + 1;
  }
  return out;
}
