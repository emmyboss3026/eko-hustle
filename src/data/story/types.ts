// The story: a long, branching path of missions grouped into chapters.
// Missions are plain data. To add one, write an object in a chapter file; the engine
// (src/engine/story.ts) and the 📖 Story phone app read it. The tap-by-tap tutorial
// missions in ../missions.ts are separate and unchanged.

import type { SkillId, Skills } from "../skills";
import type { CareerId } from "../careers";
import type { ContactId } from "../contacts";
import type { MoodletId } from "../moodlets";

/** A test on the game state. Inside a mission's tasks, `do` counts only from the moment the mission began. */
export type Cond =
  | { do: string; n?: number }        // an action id, or a counter (see counts in game.ts): "earned", "work", "apply", "travel", "walk", "enter", "greet", "buy"
  | { money: number }                 // at least this much cash
  | { rep: number }                   // at least this reputation
  | { skill: SkillId; n: number }
  | { job: CareerId | true; level?: number }  // working in this career (true = any)
  | { bond: ContactId; n: number }    // relationship with a contact
  | { flag: string; is?: string }     // a choice you made earlier
  | { done: string }                  // another story mission is finished
  | { day: number }                   // this in-game day or later
  | { biz: number }                   // businesses owned
  | { trades: number };               // investments made

export type Effect = {
  money?: number;                     // negative = it costs you
  rep?: number;
  skill?: Partial<Skills>;
  bond?: [ContactId, number];
  mood?: MoodletId;
  flag?: [string, string];            // remember this choice for later missions
};

export type Option = { label: string; result: string; effect?: Effect };

export type StoryMission = {
  id: string;
  chapter: number;                    // 1-10, see CHAPTERS
  n: number;                          // overall order, 1-100
  alt?: true;                         // one of several branch missions that fill the same slot (you play only one)
  emoji: string;
  title: string;
  place: string;                      // where it happens
  who: string[];                      // who is in it
  intro: string;                      // the scene
  dialogue: [who: string, line: string][];
  requires?: Cond[];                  // all must hold before it is offered
  tasks: { text: string; cond: Cond }[];  // all must hold to finish
  days?: number;                      // fail if not finished within this many days (you can try again)
  fail?: string;                      // what is said when time runs out
  choice?: { prompt: string; options: Option[] };
  reward: Effect;                     // always paid on finishing, on top of the choice
  next?: string;                      // a hint of what this leads to (shown after finishing)
};

export type Chapter = { n: number; emoji: string; title: string; focus: string; planned: [number, number] };
