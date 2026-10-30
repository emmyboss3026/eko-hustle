import { describe, expect, it } from "vitest";
import { newGame, reduce, type GameState } from "./game";
import { currentStory, playthrough, storyOf, tasksDone, choiceState, MAIN, SIDES, condOk } from "./story";
import { STORY, CHALLENGES, WEEKS } from "../data/story";
import { CAST, ROUTES } from "../data/story/cast";
import { taskKind, type Effect, type Task } from "../data/story/types";
import { actionById } from "../data/actions";
import { spots } from "../data/spots";
import { careers } from "../data/careers";
import { BUSINESSES, bizById, MAX_BIZ_LEVEL } from "../data/business";
import { CATALOG } from "../data/home";
import { CONTACTS } from "../data/contacts";
import { netWorth, storyFlag } from "./progress";
import type { RouteId } from "../data/story/types";

const routes = ROUTES.map(r => r.id);
const list = (x: string | string[] | undefined) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
const fxFlags = (fx?: Effect) => list(fx?.flag);

// Every flag that some choice, reward or failure can set
const settable = new Set<string>();
for (const m of STORY) {
  fxFlags(m.reward).forEach(f => settable.add(f));
  fxFlags(m.fail).forEach(f => settable.add(f));
  for (const c of m.choices ?? []) {
    fxFlags(c.fx).forEach(f => settable.add(f));
    fxFlags(c.chance?.winFx).forEach(f => settable.add(f));
  }
}
// Flags used in conditions
const condFlags = new Set<string>();
for (const m of STORY) {
  [...list(m.if), ...list(m.unless)].forEach(f => condFlags.add(f));
  for (const l of m.lines) [...list(l.if), ...list(l.unless)].forEach(f => condFlags.add(f));
  for (const c of m.choices ?? []) [...list(c.if), ...list(c.unless)].forEach(f => condFlags.add(f));
}

describe("story content", () => {
  it("has unique mission ids", () => {
    const ids = STORY.map(m => m.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("every mission has a place, cast, intro, goal, tasks, dialogue, choices and a reward", () => {
    const bad: string[] = [];
    for (const m of STORY) {
      if (!spots[m.place]) bad.push(`${m.id}: place ${m.place}`);
      if (!m.cast.length || m.cast.some(c => !CAST.some(p => p.id === c))) bad.push(`${m.id}: cast`);
      if (m.intro.length < 40 || m.goal.length < 8) bad.push(`${m.id}: text`);
      if (!m.tasks.length) bad.push(`${m.id}: tasks`);
      if (m.lines.length < 2 || m.lines.some(l => !CAST.some(p => p.id === l.who))) bad.push(`${m.id}: lines`);
      if ((m.choices ?? []).length < 2) bad.push(`${m.id}: choices`);
      if (!m.reward.xp) bad.push(`${m.id}: reward`);
      if (m.ch < 1 || m.ch > 10) bad.push(`${m.id}: chapter`);
      if (m.deadline && !m.fail) bad.push(`${m.id}: deadline without failure`);
    }
    expect(bad).toEqual([]);
  });

  it("every task points at something that exists", () => {
    const bad: string[] = [];
    const check = (where: string, t: Task) => {
      const x = t as Record<string, unknown>;
      switch (taskKind(t)) {
        case "do": for (const id of (x.do as string).split("|")) if (!actionById(id)) bad.push(`${where}: action ${id}`); break;
        case "visit": if (!spots[x.visit as keyof typeof spots]) bad.push(`${where}: spot`); break;
        case "career": if (!careers[x.career as keyof typeof careers]) bad.push(`${where}: career`); break;
        case "bizId": if (!bizById(x.bizId as string)) bad.push(`${where}: biz`); break;
        case "item": if (!CATALOG[x.item as keyof typeof CATALOG]) bad.push(`${where}: item`); break;
        case "bond": if (!CONTACTS.some(c => c.id === x.bond)) bad.push(`${where}: contact`); break;
        case "flag": bad.push(`${where}: flag tasks are hidden from players, use a choice instead`); break;
      }
    };
    for (const m of STORY) m.tasks.forEach(t => check(m.id, t));
    for (const c of CHALLENGES) check(`challenge ${c.id}`, c.task);
    for (const w of WEEKS) check(`week ${w.id}`, w.task);
    expect(bad).toEqual([]);
  });

  it("every flag a mission, line or choice waits for can actually be set", () => {
    expect([...condFlags].filter(f => !settable.has(f))).toEqual([]);
  });

  it("every qualification a career, business or action needs is given by the story", () => {
    const needed = new Set<string>();
    for (const c of Object.values(careers)) [c.flag, ...c.levels.map(l => l.flag)].forEach(f => f && needed.add(f));
    for (const b of BUSINESSES) if (b.flag) needed.add(b.flag);
    for (const id of ["study-hall", "ward-round", "read-cases", "moot", "pitch-deck", "jam", "host-show", "pool", "dinner-party"]) {
      const f = actionById(id)?.flag;
      if (f) needed.add(f);
    }
    expect([...needed].filter(f => !settable.has(f))).toEqual([]);
  });
});

describe("story structure", () => {
  // The two extremes: no optional flags, and every optional flag
  const flagSets = [[], [...condFlags]];

  it.each(routes)("route %s: a full playthrough has 100 missions, 10 per chapter", route => {
    for (const flags of flagSets) {
      const p = playthrough(route as RouteId, flags);
      expect(p.length).toBe(100);
      for (let ch = 1; ch <= 10; ch++) expect(p.filter(m => m.ch === ch).length).toBe(10);
    }
  });

  it("chapters 1–3 are shared; every route has its own missions from chapter 4", () => {
    expect(MAIN.filter(m => m.ch <= 3 && m.route).length).toBe(0);
    for (const r of routes) expect(MAIN.filter(m => m.route === r).length).toBeGreaterThanOrEqual(28);
  });

  it("alternative missions come in pairs, so nobody misses a slot", () => {
    for (const m of MAIN.filter(x => x.if || x.unless)) {
      const flag = list(m.if)[0] ?? list(m.unless)[0];
      const partner = MAIN.find(x => x !== m && x.ch === m.ch && x.route === m.route && (list(x.if)[0] === flag || list(x.unless)[0] === flag));
      expect(partner, m.id).toBeDefined();
    }
  });

  it("has side missions and they're optional", () => {
    expect(SIDES.length).toBeGreaterThanOrEqual(10);
    expect(SIDES.every(m => m.side)).toBe(true);
  });

  it("conditions work with if and unless", () => {
    expect(condOk(["a"], { if: "a" })).toBe(true);
    expect(condOk([], { if: "a" })).toBe(false);
    expect(condOk(["a"], { unless: "a" })).toBe(false);
  });
});

// ---------- a bot that plays the whole story through the real rules ----------

function satisfy(s: GameState, t: Task, missionId: string, index: number): GameState {
  const x = t as Record<string, unknown>;
  const bump = (st: GameState, key: string, by: number) => ({ ...st, counts: { ...st.counts, [key]: (st.counts[key] ?? 0) + by } });
  const rich = (st: GameState, need: number) => (st.money < need ? { ...st, money: need + 100_000 } : st);
  switch (taskKind(t)) {
    case "do": return bump(s, (x.do as string).split("|")[0], (x.n as number) ?? 1);
    case "count": return bump(s, (x.count as string).split("|")[0], x.n as number);
    case "visit": return bump(s, `at:${x.visit}`, (x.n as number) ?? 1);
    case "total": {
      const key = x.total as string;
      if (key in s.stats) return { ...s, stats: { ...s.stats, [key]: Math.max((s.stats as Record<string, number>)[key], x.n as number) } };
      return { ...s, counts: { ...s.counts, [key]: Math.max(s.counts[key] ?? 0, x.n as number) } };
    }
    case "skill": return { ...s, skills: { ...s.skills, [x.skill as string]: Math.max(s.skills[x.skill as keyof GameState["skills"]], x.min as number) } };
    case "anySkill": return { ...s, skills: { ...s.skills, hustle: Math.max(s.skills.hustle, x.anySkill as number) } };
    case "money": return rich(s, x.money as number);
    case "worth": return netWorth(s) >= (x.worth as number) ? s : { ...s, money: s.money + (x.worth as number) - netWorth(s) + 1 };
    case "rep": return { ...s, rep: Math.max(s.rep ?? 0, x.rep as number) };
    case "bond": return { ...s, contacts: { ...s.contacts, [x.bond as string]: { rel: Math.max(x.min as number, (s.contacts as Record<string, { rel: number }> | undefined)?.[x.bond as string]?.rel ?? 0), last: 0 } } };
    case "career": {
      const id = x.career as keyof typeof careers;
      const level = (x.level as number) ?? 0;
      let next = s.career?.id === id ? s : reduce({ ...s, skills: { hustle: 10, study: 10, charisma: 10, fitness: 10, cooking: 10 } }, { type: "apply", career: id });
      expect(next.career?.id, `${missionId}: can't get the ${id} job (qualification missing?)`).toBe(id);
      for (let l = 1; l <= level; l++) expect(storyFlag(next, careers[id].levels[l].flag), `${missionId}: ${id} level ${l} needs ${careers[id].levels[l].flag}`).toBe(true);
      if (next.career!.level < level) next = { ...next, career: { id, level, shifts: 0 } };
      return next;
    }
    case "anyJob": return s.career ? s : reduce(s, { type: "apply", career: "pos" });
    case "biz": {
      let next = s;
      for (const b of BUSINESSES) {
        if ((next.businesses ?? []).length >= (x.biz as number)) break;
        if ((next.businesses ?? []).some(o => o.id === b.id) || !storyFlag(next, b.flag)) continue;
        next = reduce(rich({ ...next, skills: { hustle: 10, study: 10, charisma: 10, fitness: 10, cooking: 10 } }, b.price), { type: "buyBiz", id: b.id });
      }
      return next;
    }
    case "bizId": {
      const id = x.bizId as typeof BUSINESSES[number]["id"];
      const b = bizById(id)!;
      let next = (s.businesses ?? []).some(o => o.id === id) ? s : reduce(rich({ ...s, skills: { hustle: 10, study: 10, charisma: 10, fitness: 10, cooking: 10 } }, b.price), { type: "buyBiz", id });
      expect((next.businesses ?? []).some(o => o.id === id), `${missionId}: can't buy ${id} (needs ${b.flag})`).toBe(true);
      for (let i = 0; i < 3 && (next.businesses!.find(o => o.id === id)!.level < ((x.level as number) ?? 1)); i++) next = reduce(rich(next, b.upgrade * 3), { type: "upgradeBiz", id });
      return next;
    }
    case "bizLevel": {
      let next = s;
      const total = () => (next.businesses ?? []).reduce((a, o) => a + o.level, 0);
      for (let guard = 0; guard < 40 && total() < (x.bizLevel as number); guard++) {
        const up = (next.businesses ?? []).find(o => o.level < MAX_BIZ_LEVEL);
        if (up) next = reduce(rich(next, bizById(up.id)!.upgrade * 3), { type: "upgradeBiz", id: up.id });
        else next = satisfy(next, { biz: (next.businesses ?? []).length + 1 }, missionId, index);
      }
      return next;
    }
    case "invested": return reduce(rich(s, (x.invested as number) * 2), { type: "invest", fund: "savings", amount: (x.invested as number) * 1.2 });
    case "item": return s.home.objects.some(o => o.type === x.item) ? s : { ...s, home: { ...s.home, objects: [...s.home.objects, { uid: 900 + s.home.objects.length, type: x.item as never, x: 0, y: 0, rot: 0 }] } };
    case "flag": return s;
    case "days": return { ...s, time: s.time + (x.days as number) * 1440 };
    case "pay": return reduce(rich(s, x.pay as number), { type: "story", act: "pay", id: missionId, task: index });
  }
}

function playRoute(route: RouteId, pick: "first" | "last") {
  let s = newGame({ name: "Ada", trait: "hustler", avatar: "👩🏾" }, "en", 42);
  const seen: string[] = [];
  for (let guard = 0; guard < 400; guard++) {
    const st = storyOf(s);
    const m = currentStory(st);
    if (!m) break;
    seen.push(m.id);
    m.tasks.forEach((t, i) => (s = satisfy(s, t, m.id, i)));
    s = { ...s, needs: { hunger: 100, energy: 100, fun: 100, social: 100, hygiene: 100, bladder: 100 }, health: 100 };
    expect(tasksDone(s, m, storyOf(s).cur), `${route}: tasks of ${m.id}`).toBe(true);
    s = { ...s, money: s.money + 2_000_000 };
    const options = choiceState(s, m).filter(c => !c.locked);
    const routeChoice = m.choices?.findIndex(c => c.fx?.route === route);
    const choice = routeChoice !== undefined && routeChoice >= 0 ? routeChoice : (pick === "first" ? options[0] : options[options.length - 1])?.index;
    const before = storyOf(s).done.length;
    s = reduce(s, { type: "story", act: "finish", id: m.id, choice, roll: 0.99 });
    expect(storyOf(s).done.length, `${route}: couldn't finish ${m.id}`).toBe(before + 1);
  }
  return { s, seen };
}

describe("playing the whole story", () => {
  it.each(routes)("route %s can be played from the first mission to the last", route => {
    for (const pick of ["first", "last"] as const) {
      const { s, seen } = playRoute(route as RouteId, pick);
      expect(currentStory(storyOf(s))).toBeNull();
      expect(seen.length).toBe(100);
      expect(storyOf(s).route).toBe(route);
      expect(storyOf(s).flags).toContain("story_done");
      expect(s.mission).toBe(100);
    }
  });

  it("choices are remembered and change later scenes", () => {
    const { s } = playRoute("med", "first");
    const st = storyOf(s);
    expect(Object.keys(st.picks).length).toBe(100);
    expect(st.flags).toContain("mbbs");
    expect(st.flags).toContain("fellowship");
    expect(s.career?.id).toBe("med");
  });
});

describe("deadlines and failure", () => {
  it("missing a deadline costs reputation once, then you can try again without a deadline", () => {
    const deadlined = MAIN.find(m => m.deadline && m.route === "biz")!;
    let s = newGame({ name: "Ada", trait: "hustler", avatar: "👩🏾" }, "en", 7);
    // Jump the story to just before this mission
    const order = playthrough("biz");
    const idx = order.findIndex(m => m.id === deadlined.id);
    s = { ...s, rep: 50, story: { done: order.slice(0, idx).map(m => m.id), route: "biz", flags: ["route_biz"], picks: {} } };
    s = reduce(s, { type: "greet" });
    expect(storyOf(s).cur?.id).toBe(deadlined.id);
    const rep = s.rep ?? 0;
    s = reduce({ ...s, time: s.time + (deadlined.deadline! + 1) * 1440 }, { type: "greet" });
    expect(storyOf(s).fails?.[deadlined.id]).toBe(1);
    expect(s.rep).toBeLessThan(rep);
    s = reduce({ ...s, time: s.time + 30 * 1440 }, { type: "greet" });
    expect(storyOf(s).fails?.[deadlined.id]).toBe(1); // no second failure
  });
});

describe("old saves", () => {
  it("a save from the 15-mission version keeps its finished beginner missions", () => {
    const s = newGame({ name: "Ada", trait: "hustler", avatar: "👩🏾" });
    const old = { ...s, mission: 5, story: undefined } as GameState;
    expect(storyOf(old).done).toEqual(["bath", "cook", "first-naira", "groceries", "job"]);
    expect(currentStory(storyOf(old))?.id).toBe("ride");
  });
});

describe("daily challenges and weekly events", () => {
  it("three challenges a day, claimable once when done", () => {
    let s = newGame({ name: "Ada", trait: "hustler", avatar: "👩🏾" }, "en", 3);
    const ids = storyOf(s).challenges!.ids;
    expect(ids.length).toBe(3);
    const c = CHALLENGES.find(x => x.id === ids[0])!;
    s = satisfy(s, c.task, c.id, 0);
    const money = s.money;
    s = reduce(s, { type: "story", act: "challenge", id: c.id });
    expect(s.money).toBe(money + c.money);
    expect(reduce(s, { type: "story", act: "challenge", id: c.id }).money).toBe(s.money);
  });
});
