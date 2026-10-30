// The story: chapters of missions with tasks, dialogue, choices and consequences.
// Mission text is written in English here; German and Pidgin live in src/i18n (keys mission.<id>.*).
// Tasks are plain data (not functions), so they can be checked, described in any language,
// saved in the database, and played through automatically by the tests.

import type { SkillId, Skills } from "../skills";
import type { ContactId } from "../contacts";
import type { CareerId } from "../careers";
import type { BizId } from "../business";
import type { SpotId } from "../spots";
import type { FurnitureType } from "../home";
import type { MoodletId } from "../moodlets";

/** The five career routes chosen in chapter 4. More can be added (see ROUTES in chapters.ts). */
export type RouteId = "biz" | "med" | "law" | "tech" | "ent";

/** Something the player must do. Counted from the moment the mission starts, unless it's a "have" task. */
export type Task =
  | { do: string; n?: number }              // do this action n times (an id from data/actions.ts; "a|b" = either)
  | { count: string; n: number }            // a counter goes up by n: work, travel, call, invite, buy, greet, invest, business, earned
  | { total: string; n: number }            // a counter (or stat like promotions, shifts, sentHome) is at least n overall
  | { visit: SpotId; n?: number }           // do anything at this place
  | { skill: SkillId; min: number }         // have this skill level
  | { anySkill: number }                    // have any skill at this level
  | { money: number }                       // have at least this much cash
  | { worth: number }                       // net worth at least
  | { rep: number }                         // reputation at least
  | { bond: ContactId; min: number }        // relationship at least
  | { career: CareerId; level?: number }    // work this job (at least this level, 0 = first)
  | { anyJob: true }
  | { biz: number }                         // own this many businesses
  | { bizId: BizId; level?: number }        // own this business
  | { bizLevel: number }                    // your businesses' levels add up to this
  | { invested: number }                    // investments worth at least
  | { item: FurnitureType }                 // own this furniture
  | { flag: string }                        // something that happened in the story
  | { days: number }                        // let this many game days pass
  | { pay: number };                        // pay this much (a button on the mission card)

export type TaskKind = "do" | "count" | "total" | "visit" | "skill" | "anySkill" | "money" | "worth" | "rep" | "bond" | "career" | "anyJob" | "biz" | "bizId" | "bizLevel" | "invested" | "item" | "flag" | "days" | "pay";
export const taskKind = (t: Task): TaskKind => Object.keys(t)[0] as TaskKind;

/** What a choice, a reward or a failure does to your life. */
export type Effect = {
  money?: number;                           // cash in (counts as earnings)
  cost?: number;                            // cash out
  xp?: number;
  rep?: number;                             // reputation (can be negative)
  bond?: Partial<Record<ContactId, number>>;
  skill?: Partial<Skills>;
  flag?: string | string[];                 // remember this (later missions react to it)
  unflag?: string | string[];
  route?: RouteId;                          // choose a career route
  hire?: CareerId;                          // you get this job (first level)
  mood?: MoodletId;
};

/** A condition on story flags. `if`: must have, `unless`: must not have. Several flags: all must hold. */
export type Cond = { if?: string | string[]; unless?: string | string[] };

export type Line = Cond & { who: string; text: string };   // who: a cast id or "you"

export type Choice = Cond & {
  label: string;
  result: string;
  fx?: Effect;
  need?: { money?: number; skill?: Partial<Skills>; rep?: number }; // shown greyed out until you have it
  chance?: { odds: number; win: string; winFx?: Effect };          // a gamble: with `odds` you get `win` instead
};

export type StoryMission = Cond & {
  id: string;
  ch: number;              // chapter 1–10
  route?: RouteId;         // only on this route
  side?: boolean;          // optional: runs alongside the main story
  emoji: string;
  title: string;
  place: SpotId;           // where the story happens
  cast: string[];          // who is in it (cast ids)
  intro: string;           // the story so far
  goal: string;            // one line: what to do
  tasks: Task[];
  lines: Line[];           // the scene when you come back with the tasks done
  choices?: Choice[];      // what you decide (none = just finish)
  reward: Effect;
  deadline?: number;       // game days to finish the tasks
  fail?: Effect & { text: string };   // what happens if the deadline passes (then you try again)
  // Beginner missions keep their tap-by-tap help:
  steps?: string[];
  tab?: "home" | "do" | "go" | "work" | "goals" | "me";
  furniture?: FurnitureType;
  hint?: SpotId;
};

export type Chapter = { n: number; emoji: string; title: string; blurb: string };

export type CastMember = {
  id: string;
  emoji: string;
  name: string;
  role: string;
  contact?: ContactId;     // the same person as a phone contact
};
