import { describe, expect, it } from "vitest";
import { DESIGNS } from "../data/designs";
import { CATALOG, flatSize, homePlan, tidyEdges, upperPlan } from "../data/home";
import { allReachable, canPlace, everyPieceReachable, fitsOnTiles } from "./path";
import { designEdges, layoutFor } from "./designs";

describe("furnished home designs", () => {
  it("there are at least 12, each with a different name key", () => {
    expect(DESIGNS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(DESIGNS.map(d => d.id)).size).toBe(DESIGNS.length);
  });

  for (const d of DESIGNS) {
    for (const level of [...new Set([d.minLevel, 5])]) {
      for (const floor2 of [false, true]) {
        it(`${d.id} fits at level ${level}${floor2 ? " with a second floor" : ""}`, () => {
          const size = flatSize(level);
          const edges = designEdges(d, level);
          expect(tidyEdges(edges, size)).toEqual(edges);
          expect(allReachable(homePlan(level, edges, undefined, floor2))).toBe(true);
          const l = layoutFor(d, level, floor2);
          const wanted = d.ground.reduce((n, [, items]) => n + items.length, 0) + (floor2 ? (d.upper ?? []).reduce((n, [, items]) => n + items.length, 0) : 0);
          expect(l.skipped.length, `skipped ${l.skipped.join(",")}`).toBeLessThanOrEqual(Math.ceil(wanted * 0.15));
          // every piece is legal where it stands, given all the others
          const plan = homePlan(level, edges, undefined, floor2);
          const floors: [typeof plan, typeof l.ground][] = [[plan, l.ground], ...(floor2 ? [[upperPlan(level), l.upper] as [typeof plan, typeof l.ground]] : [])];
          for (const [p, objs] of floors) {
            objs.forEach(o => expect(fitsOnTiles(p, objs, o)).toBe(true));
            expect(everyPieceReachable(p, objs)).toBe(true);
            if (objs.length) expect(canPlace(p, objs, objs[objs.length - 1])).toBe(true);   // the full rule, on the last piece
          }
          expect(l.price).toBe(l.value + d.fee);
          expect(l.value).toBe([...l.ground, ...l.upper].reduce((s, o) => s + CATALOG[o.type].price, 0));
        });
      }
    }
  }
});
