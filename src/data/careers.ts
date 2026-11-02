import type { Needs } from "../engine/needs";
import type { DistrictId } from "./places";
import type { Skills } from "./skills";

export type CareerId = "pos" | "okada" | "waiter" | "fastfood" | "fashion" | "tech" | "aviation" | "med" | "law" | "ent";

export type CareerLevel = {
  title: string;
  pay: number;              // per shift, before trait bonus
  req?: Partial<Skills>;    // skills needed to reach this level
  flag?: string;            // a qualification from the story, e.g. "mbbs" or "bar"
};

export type Career = {
  id: CareerId;
  name: string;
  emoji: string;
  where: DistrictId;
  hours: number;            // length of one shift
  shiftsToPromote: number;  // shifts needed at a level before promotion
  effect: Partial<Needs>;   // what a shift does to your needs (includes toilet and lunch breaks)
  skill: Partial<Skills>;   // skills you gain per shift
  levels: CareerLevel[];
  flag?: string;            // only shown once this has happened in the story
};

export const careers: Record<CareerId, Career> = {
  pos: {
    id: "pos", name: "POS business", emoji: "🏧", where: "yaba", hours: 8, shiftsToPromote: 4,
    effect: { energy: -35, fun: -5, social: 10, bladder: 50, hunger: 15 },
    skill: { hustle: 0.4, charisma: 0.1 },
    levels: [
      { title: "POS attendant", pay: 6_000 },
      { title: "POS agent", pay: 9_000, req: { hustle: 2 } },
      { title: "Kiosk owner", pay: 14_000, req: { hustle: 4 } },
      { title: "Mobile-money boss", pay: 22_000, req: { hustle: 6, charisma: 3 } },
    ],
  },
  okada: {
    id: "okada", name: "Okada & logistics", emoji: "🏍️", where: "yaba", hours: 6, shiftsToPromote: 4,
    effect: { energy: -30, hygiene: -25, bladder: 40, hunger: 10 },
    skill: { fitness: 0.35, hustle: 0.2 },
    levels: [
      { title: "Okada rider", pay: 5_000 },
      { title: "Bike owner", pay: 8_000, req: { fitness: 2 } },
      { title: "Fleet manager", pay: 14_000, req: { fitness: 3, hustle: 4 } },
      { title: "Logistics boss", pay: 25_000, req: { hustle: 6, charisma: 4 } },
    ],
  },
  waiter: {
    id: "waiter", name: "Hospitality", emoji: "🍽️", where: "island", hours: 6, shiftsToPromote: 4,
    effect: { energy: -30, social: 15, hygiene: -10, bladder: 40, hunger: 25 },
    skill: { charisma: 0.4, cooking: 0.1 },
    levels: [
      { title: "Waiter", pay: 7_000, req: { charisma: 1 } },
      { title: "Head waiter", pay: 11_000, req: { charisma: 3 } },
      { title: "Lounge manager", pay: 18_000, req: { charisma: 5, hustle: 3 } },
      { title: "Restaurant owner", pay: 32_000, req: { charisma: 7, hustle: 5 } },
    ],
  },
  fastfood: {
    id: "fastfood", name: "Fast food (Jollof Junction)", emoji: "🍗", where: "yaba", hours: 6, shiftsToPromote: 4,
    effect: { energy: -28, hunger: 35, social: 10, bladder: 40 },   // a free staff meal every shift
    skill: { cooking: 0.25, hustle: 0.15 },
    levels: [
      { title: "Crew member", pay: 5_000 },
      { title: "Shift supervisor", pay: 8_500, req: { cooking: 1.5 } },
      { title: "Restaurant manager", pay: 15_000, req: { cooking: 3, charisma: 2 } },
      { title: "Franchise owner", pay: 28_000, req: { hustle: 5, charisma: 4 } },
    ],
  },
  fashion: {
    id: "fashion", name: "Fashion", emoji: "🧵", where: "yaba", hours: 6, shiftsToPromote: 4,
    effect: { energy: -25, fun: 5, bladder: 40, hunger: 15 },
    skill: { hustle: 0.2, charisma: 0.2 },
    levels: [
      { title: "Tailor apprentice", pay: 4_500 },
      { title: "Tailor", pay: 8_500, req: { hustle: 1.5 } },
      { title: "Fashion designer", pay: 16_000, req: { hustle: 3, charisma: 3 } },
      { title: "Fashion house owner", pay: 30_000, req: { hustle: 5, charisma: 5 } },
    ],
  },
  tech: {
    id: "tech", name: "Tech", emoji: "💻", where: "yaba", hours: 8, shiftsToPromote: 5,
    effect: { energy: -30, fun: -5, bladder: 50, hunger: 15 },
    skill: { study: 0.3 },
    levels: [
      { title: "Tech intern", pay: 9_000, req: { study: 3 } },
      { title: "Junior developer", pay: 16_000, req: { study: 5 } },
      { title: "Software engineer", pay: 30_000, req: { study: 7 } },
      { title: "Senior engineer (remote)", pay: 50_000, req: { study: 9, charisma: 2 } },
    ],
  },
  aviation: {
    id: "aviation", name: "Aviation", emoji: "🛫", where: "ikeja", hours: 8, shiftsToPromote: 5,
    effect: { energy: -35, social: 10, bladder: 50, hunger: 20 },
    skill: { charisma: 0.25, fitness: 0.15 },
    levels: [
      { title: "Airport porter", pay: 5_500, req: { fitness: 1 } },
      { title: "Check-in agent", pay: 10_000, req: { charisma: 3 } },
      { title: "Cabin crew", pay: 20_000, req: { charisma: 5, fitness: 3 } },
      { title: "Flight dispatcher", pay: 35_000, req: { study: 6, charisma: 5 } },
    ],
  },
  // ----- story careers (unlocked by qualifications in the story) -----
  med: {
    id: "med", name: "Medicine (Mainland General)", emoji: "🩺", where: "yaba", hours: 10, shiftsToPromote: 5, flag: "mbbs",
    effect: { energy: -40, social: 10, bladder: 50, hunger: 20, hygiene: -10 },
    skill: { study: 0.2, charisma: 0.15 },
    levels: [
      { title: "House officer", pay: 12_000, flag: "mbbs" },
      { title: "Medical officer", pay: 20_000, flag: "nysc" },
      { title: "Resident doctor", pay: 32_000, req: { study: 6 }, flag: "primaries" },
      { title: "Consultant", pay: 55_000, req: { study: 8, charisma: 4 }, flag: "fellowship" },
    ],
  },
  law: {
    id: "law", name: "Law (Nwosu & Partners)", emoji: "⚖️", where: "island", hours: 8, shiftsToPromote: 5, flag: "bar",
    effect: { energy: -30, fun: -5, bladder: 45, hunger: 15 },
    skill: { study: 0.2, charisma: 0.2 },
    levels: [
      { title: "Junior associate", pay: 11_000, flag: "bar" },
      { title: "Associate", pay: 18_000, req: { study: 5, charisma: 3 } },
      { title: "Senior associate", pay: 30_000, req: { study: 7, charisma: 5 } },
      { title: "Partner", pay: 52_000, req: { study: 8, charisma: 6 }, flag: "partner" },
    ],
  },
  ent: {
    id: "ent", name: "Entertainment (Afrowave)", emoji: "🎤", where: "ikeja", hours: 6, shiftsToPromote: 4, flag: "creator",
    effect: { energy: -25, fun: 15, social: 20, bladder: 40, hunger: 15 },
    skill: { charisma: 0.35 },
    levels: [
      { title: "Content creator", pay: 4_500, flag: "creator" },
      { title: "Performing artist", pay: 9_000, req: { charisma: 3 } },
      { title: "Recording artist", pay: 20_000, req: { charisma: 5 }, flag: "demo" },
      { title: "Headliner", pay: 45_000, req: { charisma: 7 }, flag: "headliner" },
    ],
  },
};

export const careerList = Object.values(careers);
