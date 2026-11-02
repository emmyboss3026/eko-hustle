import { describe, it, expect } from "vitest";
import { newGame, reduce, type GameState } from "./game";
import { offered, storyOf, storyProgress } from "./story";
import { STORY, CHAPTERS } from "../data/story";

const sim = { name: "Ada", trait: "hustler" as const, avatar: "👩🏾" };
const fresh = (patch: Partial<GameState> = {}): GameState => ({ ...newGame(sim), ...patch });

describe("story data", () => {
  it("has unique ids and every reference points at a real mission", () => {
    const ids = STORY.map(m => m.id);
    // the same pattern the database enforces in supabase/update-2026-11-story.sql
    for (const id of ids) expect(id).toMatch(/^s[0-9]{2}[a-z]?-[a-z0-9-]{1,40}$/);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of STORY) {
      for (const c of m.requires ?? []) if ("done" in c) expect(ids).toContain(c.done);
      expect(CHAPTERS.some(c => c.n === m.chapter)).toBe(true);
    }
  });

  it("has 50 missions on one path across chapters 1-5, plus the extra branch versions", () => {
    expect(STORY.length).toBe(70); // 50 slots; mission 13 has 3 versions, 33/35/38/42/45/48 have 4 each
    expect(storyProgress(fresh()).total).toBe(50);
    expect(new Set(STORY.map(m => m.n)).size).toBe(50);
  });

  it("every mission has real content", () => {
    for (const m of STORY) {
      expect(m.intro.length).toBeGreaterThan(40);
      expect(m.dialogue.length).toBeGreaterThan(0);
      expect(m.tasks.length > 0 || !!m.choice).toBe(true);
      for (const o of m.choice?.options ?? []) expect(o.result.length).toBeGreaterThan(10);
    }
  });
});

describe("story engine", () => {
  it("opens with the first mission and nothing else", () => {
    expect(offered(fresh()).map(m => m.id)).toEqual(["s01-keys"]);
  });

  it("starts a mission, finishes it, asks for a choice, then pays once", () => {
    let s = reduce(fresh(), { type: "storyStart", id: "s01-keys" });
    expect(storyOf(s).active).toBe("s01-keys");
    s = reduce(s, { type: "act", id: "cook" });
    expect(storyOf(s).choosing).toBe(true);
    const before = s.money;
    s = reduce(s, { type: "storyChoose", index: 0 });
    expect(storyOf(s).done).toEqual(["s01-keys"]);
    expect(storyOf(s).flags.landlord).toBe("friendly");
    expect(s.money).toBe(before + 500);
    // choosing again does nothing: no duplicate reward
    expect(reduce(s, { type: "storyChoose", index: 0 }).money).toBe(s.money);
    expect(reduce(s, { type: "storyStart", id: "s01-keys" })).toBe(s);
  });

  it("tasks count only from when the mission began", () => {
    const cooked = fresh({ counts: { cook: 5 } });
    let s = reduce(cooked, { type: "storyStart", id: "s01-keys" });
    expect(storyOf(s).choosing).toBe(false);
    s = reduce(s, { type: "act", id: "cook" });
    expect(storyOf(s).choosing).toBe(true);
  });

  it("only one mission at a time, and only an open one can start", () => {
    const s = reduce(fresh(), { type: "storyStart", id: "s01-keys" });
    expect(reduce(s, { type: "storyStart", id: "s02-mummy" })).toBe(s);
    expect(reduce(fresh(), { type: "storyStart", id: "s20-sunset" }).story?.active ?? null).toBeNull();
  });

  it("a choice you cannot afford is refused", () => {
    // s16 costs ₦5,000 for option 0
    const s = fresh({ money: 100, story: { ...storyOf(fresh()), active: "s16-habit", choosing: true } });
    expect(reduce(s, { type: "storyChoose", index: 0 })).toBe(s);
  });

  it("runs out of time, lets you try again and tells you on the phone", () => {
    let s = reduce(fresh(), { type: "storyStart", id: "s01-keys" });
    expect(s.messages?.some(m => m.from === "story")).toBe(true);
    // pretend s03 is active and its deadline has passed
    s = { ...s, story: { ...storyOf(s), active: "s03-small-money", startDay: 1, base: {}, done: ["s01-keys", "s02-mummy"] }, time: 8 * 1440 };
    s = reduce(s, { type: "tick", minutes: 1, roll: 1, pick: 0 });
    expect(storyOf(s).active).toBeNull();
    expect(storyOf(s).failed).toContain("s03-small-money");
    expect(offered(s).map(m => m.id)).toContain("s03-small-money");
  });

  it("an old save without a story still works", () => {
    const old = fresh();
    delete (old as Partial<GameState>).story;
    expect(storyProgress(old).done).toBe(0);
    expect(reduce(old, { type: "act", id: "cook" }).money).toBeLessThanOrEqual(old.money);
  });

  it("the lane picked in Chapter 1 decides which Chapter 2 mission 13 you get", () => {
    const base = { ...storyOf(fresh()), done: ["s01-keys", "s02-mummy", "s03-small-money", "s04-oja", "s05-gate", "s06-cv", "s07-day-one", "s08-rent", "s09-nepa", "s10-friday", "s11-mainland", "s12-hub"] };
    for (const [lane, id] of [["study", "s13a-library"], ["hustle", "s13b-bootcamp"], ["social", "s13c-meetup"]]) {
      const s = fresh({ story: { ...base, flags: { lane } }, career: { id: "pos", level: 0, shifts: 0 } });
      expect(offered(s).map(m => m.id)).toEqual([id]);
    }
  });

  // Walk every mission in order, satisfying each one's tasks and picking option 0 (except the path choice at mission 29).
  const PATHS = [["business", "pos"], ["tech", "tech"], ["creative", "fashion"], ["professional", "pos"]] as const;
  it.each(PATHS)("the whole story to mission 50 can be played on the %s path", (path, job) => {
    let s = fresh({ money: 500_000, rep: 20, career: { id: job, level: 2, shifts: 0 }, time: 60 * 1440, skills: { hustle: 8, study: 8, charisma: 8, fitness: 8, cooking: 8 } });
    s = { ...s, businesses: [{ id: "water", level: 1, staff: 0, invested: 0, since: 1 }, { id: "suya", level: 1, staff: 0, invested: 0, since: 1 }], trades: [{ t: 0, fund: "bank" as never, side: "buy", amount: 1 }], contacts: { mummy: { rel: 90, last: 0 } } };
    const played: string[] = [];
    for (let guard = 0; guard < 80; guard++) {
      const open = offered(s);
      if (!open.length) break;
      const m = open[0];
      played.push(m.id);
      s = reduce(s, { type: "storyStart", id: m.id });
      const counts = { ...s.counts };
      for (const t of m.tasks) if ("do" in t.cond) counts[t.cond.do] = (counts[t.cond.do] ?? 0) + (t.cond.n ?? 1);
      s = reduce({ ...s, counts }, { type: "tick", minutes: 1, roll: 1, pick: 0 });
      if (storyOf(s).choosing) s = reduce(s, { type: "storyChoose", index: m.id === "s29-lane" ? PATHS.findIndex(p => p[0] === path) : 0 });
    }
    expect(storyOf(s).done).toContain("s50-recognition");
    expect(storyOf(s).active).toBeNull();
    expect(played.length).toBe(50); // one mission per slot: no repeats, no skipped slots
    expect(storyOf(s).flags.path).toBe(path);
  });

  it("changing course at mission 38 never repeats a slot and the story still reaches the end", () => {
    let s = fresh({ money: 500_000, rep: 20, career: { id: "pos", level: 2, shifts: 0 }, time: 60 * 1440, skills: { hustle: 8, study: 8, charisma: 8, fitness: 8, cooking: 8 } });
    s = { ...s, businesses: [{ id: "water", level: 1, staff: 0, invested: 0, since: 1 }, { id: "suya", level: 1, staff: 0, invested: 0, since: 1 }], trades: [{ t: 0, fund: "bank" as never, side: "buy", amount: 1 }], contacts: { mummy: { rel: 90, last: 0 } } };
    for (let guard = 0; guard < 80; guard++) {
      const open = offered(s);
      if (!open.length) break;
      s = reduce(s, { type: "storyStart", id: open[0].id });
      const counts = { ...s.counts };
      for (const t of open[0].tasks) if ("do" in t.cond) counts[t.cond.do] = (counts[t.cond.do] ?? 0) + (t.cond.n ?? 1);
      s = reduce({ ...s, counts }, { type: "tick", minutes: 1, roll: 1, pick: 0 });
      if (storyOf(s).choosing) s = reduce(s, { type: "storyChoose", index: open[0].id === "s29-lane" ? 0 : open[0].n === 38 ? 2 : 0 });
      // a player who changes course takes up the new trade
      if (storyOf(s).flags.path === "creative") s = { ...s, career: { id: "fashion", level: 2, shifts: 0 } };
    }
    expect(storyOf(s).done).toContain("s50-recognition");
    expect(storyOf(s).done.filter(id => id.startsWith("s38")).length).toBe(1);
    expect(storyOf(s).flags.path).toBe("creative");
  });
});
