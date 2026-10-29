// People in your 📇 Contacts. Each has a relationship from 0 to 100.
// Calling, texting and gifts raise it; it fades slowly if you ignore people.
// Close contacts (60+) can help you once a week.

import type { Skills } from "./skills";
import type { Needs } from "../engine/needs";

export type ContactId = "mummy" | "kunle" | "tunde" | "ronke" | "landlord" | "ify" | "sule" | "funke";

export type Help = {
  money?: number;          // they send you money
  food?: number;           // meal packs
  skill?: Partial<Skills>;
  effect?: Partial<Needs>;
};

export type Contact = {
  id: ContactId;
  emoji: string;
  start: number;           // relationship on day 1
  family?: boolean;
  help: Help;              // what "Ask for help" gives you when you're close
};

export const CONTACTS: Contact[] = [
  { id: "mummy", emoji: "👵🏾", start: 70, family: true, help: { money: 5_000, effect: { social: 20 } } },
  { id: "kunle", emoji: "🧑🏾‍🎓", start: 45, family: true, help: { effect: { fun: 20, social: 15 } } },
  { id: "tunde", emoji: "😎", start: 35, help: { skill: { hustle: 0.4 } } },
  { id: "ronke", emoji: "👩🏾‍🍳", start: 25, help: { food: 2, skill: { cooking: 0.3 } } },
  { id: "landlord", emoji: "🧔🏾", start: 20, help: { money: 2_000 } },
  { id: "ify", emoji: "👩🏾‍💻", start: 10, help: { skill: { study: 0.5 } } },
  { id: "sule", emoji: "🏋🏾", start: 10, help: { skill: { fitness: 0.4 }, effect: { energy: 10 } } },
  { id: "funke", emoji: "🧕🏾", start: 15, help: { food: 3 } },
];

export const contactById = (id: string) => CONTACTS.find(c => c.id === id);

export const CLOSE = 60;
export const GIFT_COST = 2_000;
export const HELP_EVERY_DAYS = 7;

/** "Friend", "Close friend"… as a key for the text files. */
export function bondKey(c: Contact, rel: number): string {
  if (c.family) return rel >= CLOSE ? "bond.familyClose" : "bond.family";
  if (rel >= 80) return "bond.best";
  if (rel >= CLOSE) return "bond.close";
  if (rel >= 35) return "bond.friend";
  if (rel >= 15) return "bond.known";
  return "bond.stranger";
}
