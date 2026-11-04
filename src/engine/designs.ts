// Putting a furnished design into a flat: every piece goes against a wall or in a corner of its zone, on a free tile, where the
// normal placement rules (canPlace) allow it, so nothing blocks the door, the stairs or another piece. Pure, so it can be tested.

import { CATALOG, flatSize, homePlan, planOf, tidyEdges, upperPlan, type FurnitureType, type HomePlan, type Placed } from "../data/home";
import { DESIGNS, ZONES, designById, type Design, type Zone } from "../data/designs";
import { everyPieceReachable, fitsOnTiles, footprint } from "./path";

export type Layout = { ground: Placed[]; upper: Placed[]; skipped: FurnitureType[]; price: number; value: number };

/** How close the piece sits to its zone's edge: 0 means touching it. Corner pieces and wall pieces come first. */
function edgeGap(rect: [number, number, number, number], x: number, y: number, w: number, d: number) {
  const [x0, y0, x1, y1] = rect;
  return Math.min(x - x0, y - y0, x1 - (x + w), y1 - (y + d));
}

function fill(plan: HomePlan, fixed: Placed[], list: [Zone, FurnitureType[]][], lvl: number, uidStart: number): { placed: Placed[]; skipped: FurnitureType[] } {
  const placed: Placed[] = [];
  const skipped: FurnitureType[] = [];
  let uid = uidStart;
  for (const [zone, items] of list) {
    const [fx0, fy0, fx1, fy1] = ZONES[zone];
    const rect: [number, number, number, number] = [Math.floor(fx0 * plan.size), Math.floor(fy0 * plan.size), Math.ceil(fx1 * plan.size), Math.ceil(fy1 * plan.size)];
    // big pieces first, so small ones fill the gaps
    const ordered = [...items].sort((a, b) => CATALOG[b].w * CATALOG[b].d - CATALOG[a].w * CATALOG[a].d);
    for (const type of ordered) {
      const candidates: { x: number; y: number; rot: number; gap: number }[] = [];
      for (const rot of [0, 1, 2, 3]) {
        const [w, d] = footprint({ type, x: 0, y: 0, rot });
        for (let y = rect[1]; y + d <= rect[3]; y++) for (let x = rect[0]; x + w <= rect[2]; x++) {
          const centre = Math.abs(x + w / 2 - (rect[0] + rect[2]) / 2) + Math.abs(y + d / 2 - (rect[1] + rect[3]) / 2);
          candidates.push({ x, y, rot, gap: CATALOG[type].walkable ? centre : edgeGap(rect, x, y, w, d) });
        }
      }
      candidates.sort((a, b) => a.gap - b.gap || a.rot - b.rot || a.y - b.y || a.x - b.x);
      const all = [...fixed, ...placed];
      const onThis = all.filter(o => (o.lvl ?? 0) === lvl);
      const hit = candidates.find(c => {
        const piece = { type, x: c.x, y: c.y, rot: c.rot };
        return fitsOnTiles(plan, onThis, piece) && (CATALOG[type].walkable || everyPieceReachable(plan, [...onThis, { ...piece, uid: -1 }]));
      });
      if (hit) placed.push({ uid: uid++, type, x: hit.x, y: hit.y, rot: hit.rot, ...(lvl ? { lvl } : {}) });
      else skipped.push(type);
    }
  }
  return { placed, skipped };
}

const cache = new Map<string, Layout>();

/** Where everything in a design goes in a flat of this extension level, with the price (furniture at shop prices + the fee). */
export function layoutFor(d: Design, level: number, floor2: boolean, keep: Placed[] = []): Layout {
  const key = `${d.id}:${level}:${floor2}:${keep.map(k => `${k.type}${k.x},${k.y}`).join(";")}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = flatSize(level);
  const edges = tidyEdges(tidyEdges(d.walls(size), size), size);
  const ground = homePlan(level, edges, undefined, floor2);
  const g = fill(ground, keep.filter(k => (k.lvl ?? 0) === 0), d.ground, 0, 1);
  let upper: Placed[] = [];
  let skipped = g.skipped;
  if (floor2 && d.upper) {
    const u = fill(upperPlan(level), [], d.upper, 1, 1000);
    upper = u.placed;
    skipped = [...skipped, ...u.skipped];
  }
  const value = [...g.placed, ...upper].reduce((sum, o) => sum + CATALOG[o.type].price, 0);
  const out: Layout = { ground: g.placed, upper, skipped, value, price: value + d.fee };
  cache.set(key, out);
  return out;
}

/** The design's walls for this flat size, tidied the way blueprints are. */
export const designEdges = (d: Design, level: number) => tidyEdges(tidyEdges(d.walls(flatSize(level)), flatSize(level)), flatSize(level));

export { DESIGNS, designById, planOf };
