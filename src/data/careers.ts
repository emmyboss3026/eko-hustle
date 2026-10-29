import type { Needs } from "../engine/needs";
import type { DistrictId } from "./places";
import type { Skills } from "./skills";

export type CareerId = "pos" | "okada" | "waiter" | "fashion" | "tech" | "aviation";

export type CareerLevel = {
  title: string;
  pay: number;              // per shift, before trait bonus
  req?: Partial<Skills>;    // skills needed to reach this level
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
};

export const careerList = Object.values(careers);
