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

import { newGame, reduce, type GameState } from "./game";
import { START_OBJECTS } from "../data/home";

describe("buying a design", () => {
  const sim = { name: "T", avatar: "🙂" } as never;
  const start = (patch: Partial<GameState> = {}): GameState => ({ ...newGame(sim), ...patch });

  it("replaces walls, floors and furniture, charges the price and pays back the old furniture", () => {
    const s = start({ money: 5_000_000 });
    const d = DESIGNS[0];
    const lay = layoutFor(d, 0, false, s.home.objects.filter(o => CATALOG[o.type].fixed));
    const refund = s.home.objects.filter(o => !CATALOG[o.type].fixed).reduce((n, o) => n + Math.round(CATALOG[o.type].price * 0.5), 0);
    const after = reduce(s, { type: "design", id: d.id });
    expect(after.money).toBe(5_000_000 + refund - lay.price);
    expect(after.home.objects.length).toBe(s.home.objects.filter(o => CATALOG[o.type].fixed).length + lay.ground.length);
    expect(after.home.walls).toEqual(designEdges(d, 0));
    expect(new Set(after.home.objects.map(o => o.uid)).size).toBe(after.home.objects.length);
    expect(START_OBJECTS.length).toBeGreaterThan(0);
  });
  it("refuses when you cannot afford it, or the home is too small", () => {
    expect(reduce(start({ money: 100 }), { type: "design", id: DESIGNS[0].id }).money).toBe(100);
    const big = reduce(start({ money: 99_000_000 }), { type: "design", id: "mansion" });
    expect(big.home.objects).toEqual(start().home.objects);
  });
});

describe("dev unlock", () => {
  it("leaves a furnished 20 x 20 home with a second floor, nothing blocked", () => {
    const sim = { name: "T", avatar: "🙂" } as never;
    const s = reduce(newGame(sim), { type: "devUnlock" });
    const plan = homePlan(5, s.home.walls, undefined, true);
    expect(allReachable(plan)).toBe(true);
    const ground = s.home.objects.filter(o => (o.lvl ?? 0) === 0);
    expect(everyPieceReachable(plan, ground)).toBe(true);
    expect(s.home.objects.some(o => o.lvl === 1)).toBe(true);
    expect(new Set(s.home.objects.map(o => o.uid)).size).toBe(s.home.objects.length);
  });
});
