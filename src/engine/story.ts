// The story engine: pure rules for which story missions are offered, how far the active one
// has got, and when it is finished or has run out of time. Applying rewards lives in
// game.ts (it owns the money and diary helpers). Content is in src/data/story.

import type { GameState } from "./game";
import { dayNumber } from "./progress";
import { STORY, storyById } from "../data/story";
import type { Cond, StoryMission } from "../data/story/types";
import { contactState } from "./phone";

export type StoryState = {
  done: string[];                   // finished mission ids, in order
  active: string | null;            // the mission you are on
  base: Record<string, number>;     // counts when the active mission began (tasks count from here)
  startDay: number;
  choosing: boolean;                // tasks are done; waiting for your choice
  choices: Record<string, number>;  // mission id -> option you picked (for the record)
  flags: Record<string, string>;    // what you decided, read by later missions
  failed: string[];                 // missions that ran out of time (you can try again)
  notified: string[];               // missions the phone has already told you about
};

export const newStory = (): StoryState =>
  ({ done: [], active: null, base: {}, startDay: 0, choosing: false, choices: {}, flags: {}, failed: [], notified: [] });

export const storyOf = (s: GameState): StoryState => s.story ?? newStory();

/** Is this test true right now? `base` makes `do` count from when the mission began. */
export function condMet(s: GameState, c: Cond, base: Record<string, number> = {}): boolean {
  const st = storyOf(s);
  if ("do" in c) return (s.counts?.[c.do] ?? 0) - (base[c.do] ?? 0) >= (c.n ?? 1);
  if ("money" in c) return s.money >= c.money;
  if ("rep" in c) return (s.rep ?? 0) >= c.rep;
  if ("skill" in c) return s.skills[c.skill] >= c.n;
  if ("job" in c) return !!s.career && (c.job === true || s.career.id === c.job) && s.career.level >= (c.level ?? 0);
  if ("bond" in c) return contactState(s, c.bond).rel >= c.n;
  if ("flag" in c) return c.is === undefined ? c.flag in st.flags : st.flags[c.flag] === c.is;
  if ("done" in c) return st.done.includes(c.done);
  if ("day" in c) return dayNumber(s) >= c.day;
  if ("biz" in c) return (s.businesses?.length ?? 0) >= c.biz;
  return (s.trades?.length ?? 0) >= c.trades;
}

/** Missions you could start now, in story order. */
export function offered(s: GameState): StoryMission[] {
  const st = storyOf(s);
  // A branch version is hidden once any version of its slot is finished (so changing course never repeats a slot)
  const slotDone = (m: StoryMission) => !!m.alt && STORY.some(o => o.n === m.n && st.done.includes(o.id));
  return STORY.filter(m => !st.done.includes(m.id) && !slotDone(m) && (m.requires ?? []).every(c => condMet(s, c)));
}

export const activeMission = (s: GameState): StoryMission | null => {
  const id = storyOf(s).active;
  return id ? storyById(id) ?? null : null;
};

export function taskStates(s: GameState, m: StoryMission): boolean[] {
  const base = storyOf(s).base;
  return m.tasks.map(t => condMet(s, t.cond, base));
}

export const tasksDone = (s: GameState, m: StoryMission) => taskStates(s, m).every(Boolean);

export const expired = (s: GameState, m: StoryMission) =>
  m.days !== undefined && dayNumber(s) > storyOf(s).startDay + m.days;

/** Can you afford this option? (A negative money effect is a cost.) */
export const affordable = (s: GameState, cost: number | undefined) => s.money >= -(cost ?? 0);

/** How far along the story you are: finished missions out of the missions on one path (branch versions share a slot). */
export function storyProgress(s: GameState) {
  return { done: storyOf(s).done.length, total: new Set(STORY.map(m => m.n)).size };
}
