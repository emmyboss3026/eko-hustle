// Invitations that arrive on your phone (💌 Invites app). New ones come in at the start of
// some days; each lasts a couple of days. Accepting takes time (and sometimes money)
// and pays off in needs, skills, reputation, friendships or cash.

import type { Needs } from "../engine/needs";
import type { Skills } from "./skills";
import type { ContactId } from "./contacts";
import type { MoodletId } from "./moodlets";

export type InviteKind = "party" | "business" | "vip" | "career" | "special";
export type InviteId =
  | "owambe" | "birthday" | "naming" | "mixer" | "pitch" | "vip" | "yacht"
  | "interview" | "gig" | "match" | "church" | "concert";

export type InviteType = {
  id: InviteId;
  kind: InviteKind;
  emoji: string;
  from: ContactId | null;   // who sent it (their relationship goes up if you go)
  minutes: number;
  cost: number;
  effect: Partial<Needs>;
  skill?: Partial<Skills>;
  rep: number;              // reputation for going
  bond?: number;            // relationship gain with the sender
  pay?: number;             // money you earn there (gigs)
  mood?: MoodletId;
  minStatus?: number;       // only offered once your status is at least this
  minEnergy?: number;
};

export const INVITES: InviteType[] = [
  { id: "owambe", kind: "party", emoji: "🎉", from: "kunle", minutes: 180, cost: 2_000, effect: { fun: 40, social: 35, hunger: 30, energy: -15 }, rep: 2, bond: 6, mood: "goodGist" },
  { id: "birthday", kind: "party", emoji: "🎂", from: "tunde", minutes: 150, cost: 3_000, effect: { fun: 35, social: 30, hunger: 20, energy: -10 }, rep: 2, bond: 8, mood: "goodGist" },
  { id: "naming", kind: "special", emoji: "👶🏾", from: "funke", minutes: 120, cost: 1_500, effect: { social: 30, hunger: 25, fun: 10 }, rep: 3, bond: 10 },
  { id: "mixer", kind: "business", emoji: "🤝🏾", from: "ify", minutes: 120, cost: 0, effect: { social: 25, energy: -10 }, skill: { charisma: 0.3, hustle: 0.2 }, rep: 3, bond: 6, minStatus: 1 },
  { id: "pitch", kind: "business", emoji: "📊", from: "tunde", minutes: 90, cost: 0, effect: { energy: -10, fun: 5 }, skill: { hustle: 0.5 }, rep: 2, bond: 5, minStatus: 1 },
  { id: "vip", kind: "vip", emoji: "🍾", from: null, minutes: 240, cost: 15_000, effect: { fun: 60, social: 50, energy: -25 }, rep: 6, mood: "bigNight", minStatus: 2, minEnergy: 30 },
  { id: "yacht", kind: "vip", emoji: "🛥️", from: null, minutes: 300, cost: 40_000, effect: { fun: 70, social: 60, energy: -20 }, skill: { charisma: 0.4 }, rep: 10, mood: "bigNight", minStatus: 3, minEnergy: 30 },
  { id: "interview", kind: "career", emoji: "💼", from: "ify", minutes: 90, cost: 0, effect: { energy: -10, fun: -5 }, skill: { charisma: 0.5, study: 0.3 }, rep: 2, bond: 4 },
  { id: "gig", kind: "career", emoji: "🧾", from: "tunde", minutes: 240, cost: 0, effect: { energy: -25, fun: -5 }, skill: { hustle: 0.3 }, rep: 1, bond: 3, pay: 9_000, minEnergy: 30 },
  { id: "match", kind: "special", emoji: "⚽", from: "sule", minutes: 120, cost: 500, effect: { fun: 40, social: 25 }, rep: 1, bond: 6 },
  { id: "church", kind: "special", emoji: "⛪", from: "mummy", minutes: 120, cost: 1_000, effect: { social: 25, fun: 10 }, rep: 3, bond: 8 },
  { id: "concert", kind: "party", emoji: "🎤", from: "kunle", minutes: 240, cost: 8_000, effect: { fun: 60, social: 30, energy: -20 }, rep: 3, bond: 5, mood: "bigNight", minStatus: 1, minEnergy: 25 },
];

export const inviteById = (id: string) => INVITES.find(i => i.id === id);
export const INVITE_DAYS = 2;     // how long an invitation stays open
export const MAX_OPEN_INVITES = 4;
export const INVITE_CHANCE = 0.55; // chance of a new invitation each morning
