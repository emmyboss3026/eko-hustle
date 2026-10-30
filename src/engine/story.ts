// The story engine: which mission you're on, how far its tasks are, choices and their consequences,
// deadlines, side missions, daily challenges and weekly events. Pure functions, like the rest of the engine.
// game.ts calls `syncStory` after every command and `storyStep` for story commands.

import type { GameState } from "./game";
import type { Kit } from "./phone";
import { addMessage, addRep, bond, contactState } from "./phone";
import { dayNumber, netWorth, portfolioValue, seedOf } from "./progress";
import { rand } from "./rng";
import { careers } from "../data/careers";
import { meets } from "../data/skills";
import { STORY, storyById, CHALLENGES, WEEKS, type Challenge } from "../data/story";
import { castById } from "../data/story/cast";
import type { Cond, Effect, RouteId, StoryMission, Task } from "../data/story/types";
import { taskKind } from "../data/story/types";
import { text } from "../i18n/text";

export type Progress = { id: string; t: number; day: number; base: Record<string, number>; paid?: number[] };

export type StoryState = {
  done: string[];                    // finished missions, in order
  route?: RouteId;
  flags: string[];
  picks: Record<string, number>;     // the choice you made in each mission
  cur?: Progress;                    // the main mission you're on
  sides?: Progress[];                // side missions you've started
  fails?: Record<string, number>;    // how often a mission's deadline passed
  xp?: number;
  challenges?: { day: number; ids: string[]; base: Record<string, number>; claimed: string[] };
  week?: { n: number; base: Record<string, number>; claimed: boolean };
};

export const MAX_SIDES = 3;
export const MAIN = STORY.filter(m => !m.side);
export const SIDES = STORY.filter(m => m.side);

// The 15 beginner missions of earlier versions, in their old order (for upgrading saves).
const OLD_ORDER = ["bath", "cook", "first-naira", "groceries", "job", "ride", "shift", "streets", "skill", "furniture", "rent"];

export function storyOf(s: GameState): StoryState {
  if (s.story) return s.story;
  // An older save: the missions you finished count, as far as they still line up.
  const done = OLD_ORDER.slice(0, Math.min(s.mission ?? 0, OLD_ORDER.length)).filter(id => storyById(id));
  return { done, flags: [], picks: {} };
}

const asList = (x: string | string[] | undefined) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);

export function condOk(flags: string[], c: Cond): boolean {
  return asList(c.if).every(f => flags.includes(f)) && asList(c.unless).every(f => !flags.includes(f));
}

/** Can this mission be part of your story right now (route and flags)? */
export function fits(st: Pick<StoryState, "route" | "flags">, m: StoryMission): boolean {
  if (m.route && m.route !== st.route) return false;
  return condOk(st.flags, m);
}

/** The main mission you're on now, or null when the story is finished. */
export function currentStory(st: StoryState): StoryMission | null {
  // Continue after the last main mission you finished (missions you passed by are skipped for good).
  let from = 0;
  for (let i = st.done.length - 1; i >= 0; i--) {
    const at = MAIN.findIndex(m => m.id === st.done[i]);
    if (at >= 0) {
      from = at + 1;
      break;
    }
  }
  for (let i = from; i < MAIN.length; i++) {
    const m = MAIN[i];
    if (!st.done.includes(m.id) && fits(st, m)) return m;
  }
  return null;
}

/** The main missions of a full playthrough for a route and a set of flags (used by the tests and the story map). */
export function playthrough(route: RouteId, flags: string[] = []): StoryMission[] {
  return MAIN.filter(m => (!m.route || m.route === route) && condOk(flags, m));
}

export const storyFinished = (s: GameState) => currentStory(storyOf(s)) === null;
export const chapterOf = (s: GameState) => currentStory(storyOf(s))?.ch ?? 10;
export const mainDone = (s: GameState) => storyOf(s).done.filter(id => MAIN.some(m => m.id === id)).length;
export const hasFlag = (s: GameState, f: string) => storyOf(s).flags.includes(f);

// ---------- tasks ----------

/** The counters a task reads, if it's a "since the mission started" task ("a|b" counts either). */
function countersOf(t: Task): string[] {
  switch (taskKind(t)) {
    case "do": return (t as { do: string }).do.split("|");
    case "count": return (t as { count: string }).count.split("|");
    case "visit": return [`at:${(t as { visit: string }).visit}`];
    default: return [];
  }
}

const countOf = (s: GameState, key: string) => s.counts?.[key] ?? 0;
const totalOf = (s: GameState, key: string) => s.counts?.[key] ?? (s.stats as Record<string, number>)[key] ?? 0;

function snapshot(s: GameState, tasks: Task[]): Record<string, number> {
  const base: Record<string, number> = {};
  for (const t of tasks) for (const k of countersOf(t)) base[k] = countOf(s, k);
  return base;
}

export const startProgress = (s: GameState, m: { id: string; tasks: Task[] }): Progress =>
  ({ id: m.id, t: s.time, day: dayNumber(s), base: snapshot(s, m.tasks) });

/** How far one task is: have / need (both numbers, so the UI can show 2/3 or ₦40,000/₦50,000). */
export function taskProgress(s: GameState, t: Task, p: Progress | undefined, index: number): { have: number; need: number; done: boolean } {
  const r = (have: number, need: number) => ({ have: Math.min(have, need), need, done: have >= need });
  const since = (keys: string) => keys.split("|").reduce((sum, k) => sum + countOf(s, k) - (p?.base[k] ?? countOf(s, k)), 0);
  const x = t as Record<string, unknown>;
  switch (taskKind(t)) {
    case "do": return r(since(x.do as string), (x.n as number) ?? 1);
    case "count": return r(since(x.count as string), x.n as number);  // "a|b" counts either
    case "visit": return r(since(`at:${x.visit}`), (x.n as number) ?? 1);
    case "total": return r(totalOf(s, x.total as string), x.n as number);
    case "skill": return r(Math.floor(s.skills[x.skill as keyof GameState["skills"]] * 10) / 10, x.min as number);
    case "anySkill": return r(Math.floor(Math.max(...Object.values(s.skills)) * 10) / 10, x.anySkill as number);
    case "money": return r(Math.max(0, s.money), x.money as number);
    case "worth": return r(Math.max(0, netWorth(s)), x.worth as number);
    case "rep": return r(Math.round(s.rep ?? 0), x.rep as number);
    case "bond": return r(Math.round(contactState(s, x.bond as never).rel), x.min as number);
    case "career": {
      const ok = !!s.career && s.career.id === x.career && s.career.level >= ((x.level as number) ?? 0);
      return r(ok ? 1 : 0, 1);
    }
    case "anyJob": return r(s.career ? 1 : 0, 1);
    case "biz": return r((s.businesses ?? []).length, x.biz as number);
    case "bizId": {
      const b = (s.businesses ?? []).find(o => o.id === x.bizId);
      return r(b && b.level >= ((x.level as number) ?? 1) ? 1 : 0, 1);
    }
    case "bizLevel": return r((s.businesses ?? []).reduce((sum, b) => sum + b.level, 0), x.bizLevel as number);
    case "invested": return r(portfolioValue(s), x.invested as number);
    case "item": return r(s.home.objects.some(o => o.type === x.item) ? 1 : 0, 1);
    case "flag": return r(storyOf(s).flags.includes(x.flag as string) ? 1 : 0, 1);
    case "days": return r(dayNumber(s) - (p?.day ?? dayNumber(s)), x.days as number);
    case "pay": return r(p?.paid?.includes(index) ? 1 : 0, 1);
  }
}

export const tasksDone = (s: GameState, m: StoryMission, p: Progress | undefined) =>
  m.tasks.every((t, i) => taskProgress(s, t, p, i).done);

/** Days left before the deadline, or null if there's none (a retry after a failure never has one). */
export function daysLeft(s: GameState, m: StoryMission, p: Progress | undefined): number | null {
  if (!m.deadline || !p || (storyOf(s).fails?.[m.id] ?? 0) > 0) return null;
  return m.deadline - (dayNumber(s) - p.day);
}

/** Which choices you can pick now. A choice that needs money or skills you lack is shown but locked. */
export function choiceState(s: GameState, m: StoryMission) {
  const flags = storyOf(s).flags;
  return (m.choices ?? []).map((c, i) => {
    const shown = condOk(flags, c);
    const n = c.need;
    const locked = !!n && ((n.money !== undefined && s.money < n.money) || (n.skill !== undefined && !meets(s.skills, n.skill)) || (n.rep !== undefined && (s.rep ?? 0) < n.rep));
    const cost = c.fx?.cost ?? 0;
    return { index: i, choice: c, shown, locked: locked || s.money < cost };
  }).filter(c => c.shown);
}

/** The lines of the scene you see, for your flags. */
export const sceneLines = (s: GameState, m: StoryMission) =>
  m.lines.map((line, i) => ({ line, i })).filter(x => condOk(storyOf(s).flags, x.line));

// ---------- effects ----------

export function applyEffect(s: GameState, fx: Effect | undefined, label: string, kit: Kit): GameState {
  if (!fx) return s;
  let next = s;
  if (fx.money) next = kit.pay(next, fx.money, "mission", label);
  if (fx.cost) next = kit.charge(next, fx.cost, "other", label);
  if (fx.rep) next = addRep(next, fx.rep);
  for (const [id, by] of Object.entries(fx.bond ?? {})) next = bond(next, id as never, by as number);
  if (fx.skill) next = kit.learn(next, fx.skill);
  if (fx.mood) next = kit.addMood(next, fx.mood);
  const st = storyOf(next);
  let flags = st.flags;
  for (const f of asList(fx.flag)) if (!flags.includes(f)) flags = [...flags, f];
  const off = asList(fx.unflag);
  if (off.length) flags = flags.filter(f => !off.includes(f));
  next = { ...next, story: { ...st, flags, route: fx.route ?? st.route, xp: (st.xp ?? 0) + (fx.xp ?? 0) } };
  if (fx.hire && careers[fx.hire]) next = { ...next, career: { id: fx.hire, level: 0, shifts: 0 } };
  return next;
}

// ---------- notifications ----------

/** A text on your phone from the first person in the new mission. */
function notify(s: GameState, m: StoryMission, kit: Kit): GameState {
  const who = m.cast.find(c => c !== "you");
  const cast = who ? castById(who) : null;
  const from = cast?.contact ?? (cast ? (`cast:${cast.id}` as const) : "club");
  const tx = text(s.lang ?? "en").story(m);
  void kit;
  return addMessage(s, { from: from as never, key: "msg.story.new", vars: { title: tx.title, goal: tx.goal } });
}

// ---------- keeping the story up to date ----------

/** After every command: start the next mission, check deadlines, roll over daily challenges and the week. */
export function syncStory(s: GameState, kit: Kit): GameState {
  if (s.ending) return s;
  let next = s;
  let st = storyOf(next);
  const m = currentStory(st);

  if (m && st.cur?.id !== m.id) {
    st = { ...st, cur: startProgress(next, m) };
    next = { ...next, story: st };
    if (st.done.length > 0) next = notify(next, m, kit);
  }

  // A deadline that passes: the consequences hit, then you try again without a deadline.
  if (m && st.cur) {
    const left = daysLeft(next, m, st.cur);
    if (left !== null && left < 0 && !tasksDone(next, m, st.cur)) {
      const tx = text(next.lang ?? "en").story(m);
      next = applyEffect(next, m.fail, tx.title, kit);
      st = storyOf(next);
      st = { ...st, fails: { ...(st.fails ?? {}), [m.id]: (st.fails?.[m.id] ?? 0) + 1 }, cur: startProgress(next, m) };
      next = kit.say({ ...next, story: st }, `⏰ ${tx.title}: ${tx.fail}`);
    }
  }

  // Daily challenges: three small goals each game day.
  const day = dayNumber(next);
  st = storyOf(next);
  if (st.challenges?.day !== day) {
    const ids = pickChallenges(seedOf(next), day);
    const tasks = ids.map(id => CHALLENGES.find(c => c.id === id)!.task);
    st = { ...st, challenges: { day, ids, base: snapshot(next, tasks), claimed: [] } };
    next = { ...next, story: st };
  }
  // The weekly event: a theme and a bigger goal for the game week.
  const week = weekOf(day);
  if (st.week?.n !== week) {
    st = { ...st, week: { n: week, base: snapshot(next, [weeklyEvent(next, week).task]), claimed: false } };
    next = { ...next, story: st };
  }
  return { ...next, mission: mainDone(next) };
}

export function pickChallenges(seed: number, day: number): string[] {
  const pool = [...CHALLENGES];
  const out: string[] = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const at = Math.floor(rand(seed, "challenge", day, i) * pool.length);
    out.push(pool.splice(at, 1)[0].id);
  }
  return out;
}

export const weekOf = (day: number) => Math.floor((day - 1) / 7);
export const weeklyEvent = (s: GameState, week: number) => WEEKS[Math.floor(rand(seedOf(s), "week", week) * WEEKS.length)];

export function challengeProgress(s: GameState, c: Challenge) {
  const ch = storyOf(s).challenges;
  return taskProgress(s, c.task, ch ? { id: c.id, t: 0, day: ch.day, base: ch.base } : undefined, 0);
}

export function weekProgress(s: GameState) {
  const st = storyOf(s);
  const w = weeklyEvent(s, st.week?.n ?? weekOf(dayNumber(s)));
  return { event: w, ...taskProgress(s, w.task, st.week ? { id: w.id, t: 0, day: 0, base: st.week.base } : undefined, 0), claimed: !!st.week?.claimed };
}

// ---------- commands ----------

export type StoryCommand =
  | { type: "story"; act: "pay"; id: string; task: number }
  | { type: "story"; act: "finish"; id: string; choice?: number; roll?: number }
  | { type: "story"; act: "side"; id: string }
  | { type: "story"; act: "challenge"; id: string }
  | { type: "story"; act: "week" };

/** Side missions you could start now. */
export function availableSides(s: GameState): StoryMission[] {
  const st = storyOf(s);
  const ch = currentStory(st)?.ch ?? 11;
  return SIDES.filter(m => m.ch <= ch && !st.done.includes(m.id) && !st.sides?.some(p => p.id === m.id) && fits(st, m));
}

export const activeSides = (s: GameState) =>
  (storyOf(s).sides ?? []).map(p => ({ p, m: storyById(p.id)! })).filter(x => x.m);

/** Why a story command can't happen (a text key), or null. */
export function storyBlocker(s: GameState, cmd: StoryCommand): string | null {
  const st = storyOf(s);
  if (cmd.act === "pay" || cmd.act === "finish") {
    const m = storyById(cmd.id);
    const p = m && (st.cur?.id === m.id ? st.cur : st.sides?.find(x => x.id === m.id));
    if (!m || !p) return "story.notActive";
    if (cmd.act === "pay") {
      const t = m.tasks[cmd.task] as { pay?: number } | undefined;
      if (!t?.pay) return "story.notActive";
      if (p.paid?.includes(cmd.task)) return "story.paid";
      if (s.money < t.pay) return "problem.noMoney";
      return null;
    }
    if (!tasksDone(s, m, p)) return "story.notYet";
    const cs = choiceState(s, m);
    if (cs.length > 0) {
      const c = cs.find(x => x.index === cmd.choice);
      if (!c) return "story.pick";
      if (c.locked) return "story.locked";
    }
    return null;
  }
  if (cmd.act === "side") {
    if ((st.sides ?? []).length >= MAX_SIDES) return "story.tooMany";
    if (!availableSides(s).some(m => m.id === cmd.id)) return "story.notActive";
    return null;
  }
  if (cmd.act === "challenge") {
    const c = CHALLENGES.find(x => x.id === cmd.id);
    if (!c || !st.challenges?.ids.includes(c.id)) return "story.notActive";
    if (st.challenges.claimed.includes(c.id)) return "story.claimed";
    if (!challengeProgress(s, c).done) return "story.notYet";
    return null;
  }
  const w = weekProgress(s);
  if (w.claimed) return "story.claimed";
  if (!w.done) return "story.notYet";
  return null;
}

export function storyStep(s: GameState, cmd: StoryCommand, kit: Kit): GameState {
  const problem = storyBlocker(s, cmd);
  if (problem) return problem === "story.notActive" ? s : kit.say(s, kit.msg(s, problem));
  let st = storyOf(s);
  const tx = text(s.lang ?? "en");

  switch (cmd.act) {
    case "pay": {
      const m = storyById(cmd.id)!;
      const amount = (m.tasks[cmd.task] as { pay: number }).pay;
      const mark = (p: Progress) => (p.id === m.id ? { ...p, paid: [...(p.paid ?? []), cmd.task] } : p);
      st = { ...st, cur: st.cur && mark(st.cur), sides: st.sides?.map(mark) };
      return kit.charge({ ...s, story: st }, amount, "other", tx.story(m).title);
    }
    case "finish": {
      const m = storyById(cmd.id)!;
      const mt = tx.story(m);
      let next = s;
      let resultLine = "";
      const cs = choiceState(s, m);
      if (cs.length > 0 && cmd.choice !== undefined) {
        const c = m.choices![cmd.choice];
        const won = !!c.chance && (cmd.roll ?? 1) < c.chance.odds;
        next = applyEffect(next, won ? { ...c.fx, ...c.chance!.winFx } : c.fx, mt.title, kit);
        resultLine = won ? mt.win(cmd.choice) : mt.result(cmd.choice);
        st = storyOf(next);
        st = { ...st, picks: { ...st.picks, [m.id]: cmd.choice } };
        next = { ...next, story: st };
      }
      next = applyEffect(next, m.reward, mt.title, kit);
      st = storyOf(next);
      st = {
        ...st,
        done: [...st.done, m.id],
        cur: st.cur?.id === m.id ? undefined : st.cur,
        sides: (st.sides ?? []).filter(p => p.id !== m.id),
      };
      next = kit.addMood(kit.bump({ ...next, story: st }, m.side ? "side" : "story"), "mission");
      if (resultLine) next = kit.say(next, `${m.emoji} ${resultLine}`);
      const money = m.reward.money ? ` +${kit.money(m.reward.money)}` : "";
      next = kit.say(next, kit.msg(next, m.side ? "log.sideDone" : "log.mission", { title: mt.title }) + money);
      return syncStory(next, kit);
    }
    case "side": {
      const m = storyById(cmd.id)!;
      st = { ...st, sides: [...(st.sides ?? []), startProgress(s, m)] };
      return kit.say({ ...s, story: st }, kit.msg(s, "log.sideStart", { title: tx.story(m).title }));
    }
    case "challenge": {
      const c = CHALLENGES.find(x => x.id === cmd.id)!;
      st = { ...st, challenges: { ...st.challenges!, claimed: [...st.challenges!.claimed, c.id] }, xp: (st.xp ?? 0) + c.xp };
      const next = kit.pay(kit.bump({ ...s, story: st }, "challenge"), c.money, "reward", tx.challenge(c));
      return kit.say(next, kit.msg(next, "log.challenge", { title: tx.challenge(c), money: kit.money(c.money) }));
    }
    case "week": {
      const w = weekProgress(s).event;
      st = { ...st, week: { ...st.week!, claimed: true }, xp: (st.xp ?? 0) + w.xp };
      let next = kit.pay({ ...s, story: st }, w.money, "reward", tx.week(w).title);
      if (w.rep) next = addRep(next, w.rep);
      return kit.say(next, kit.msg(next, "log.week", { title: tx.week(w).title, money: kit.money(w.money) }));
    }
  }
}

// ---------- for the UI ----------

/** Where to go for a task: a place, a phone app or a tab. */
export function taskTarget(t: Task): { spot?: string; app?: string; tab?: string } {
  const x = t as Record<string, unknown>;
  switch (taskKind(t)) {
    case "do": return { tab: "do", spot: (x.do as string).split("|")[0] };
    case "visit": return { tab: "do", spot: x.visit as string };
    case "career": case "anyJob": return { tab: "work" };
    case "biz": case "bizId": case "bizLevel": return { app: "business" };
    case "invested": return { app: "invest" };
    case "bond": return { app: "contacts" };
    case "item": return { tab: "home" };
    case "count": return x.count === "invite" ? { app: "invites" } : x.count === "call" ? { app: "contacts" } : x.count === "work" ? { tab: "work" } : { tab: "do" };
    default: return { tab: "do" };
  }
}
