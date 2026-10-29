// Small businesses you can own from the 🏪 Business app. They earn (or lose) money once a game day.
// Takings = base × level bonus × staff bonus × Hustle bonus × a random swing; then wages and upkeep come off.

import type { Skills } from "./skills";

export type BizId = "water" | "suya" | "pos" | "keke" | "salon" | "mart";

export type Business = {
  id: BizId;
  emoji: string;
  price: number;        // to buy it
  base: number;         // takings per day at level 1 with one worker
  upkeep: number;       // rent, stock and repairs per day
  wage: number;         // per worker per day
  maxStaff: number;
  upgrade: number;      // price of each upgrade (× current level)
  req?: Partial<Skills>;
};

export const BUSINESSES: Business[] = [
  { id: "water", emoji: "💧", price: 25_000, base: 2_200, upkeep: 600, wage: 700, maxStaff: 1, upgrade: 15_000 },
  { id: "suya", emoji: "🍢", price: 60_000, base: 5_200, upkeep: 1_500, wage: 1_200, maxStaff: 2, upgrade: 35_000 },
  { id: "pos", emoji: "🏧", price: 120_000, base: 9_500, upkeep: 2_500, wage: 1_800, maxStaff: 2, upgrade: 60_000, req: { hustle: 2 } },
  { id: "keke", emoji: "🛺", price: 250_000, base: 16_000, upkeep: 4_500, wage: 3_000, maxStaff: 3, upgrade: 120_000, req: { hustle: 3 } },
  { id: "salon", emoji: "💇🏾", price: 400_000, base: 24_000, upkeep: 7_000, wage: 3_500, maxStaff: 4, upgrade: 180_000, req: { charisma: 3 } },
  { id: "mart", emoji: "🏬", price: 900_000, base: 52_000, upkeep: 16_000, wage: 4_500, maxStaff: 6, upgrade: 400_000, req: { hustle: 5, charisma: 3 } },
];

export const bizById = (id: string) => BUSINESSES.find(b => b.id === id);
export const MAX_BIZ_LEVEL = 3;
/** Selling a business gets you this share of what you put in. */
export const BIZ_RESALE = 0.6;

export type OwnedBiz = { id: BizId; level: number; staff: number; invested: number; since: number; lastProfit?: number };

/** The day's result before the random swing, for showing "about ₦X a day". */
export function expectedProfit(b: Business, o: Pick<OwnedBiz, "level" | "staff">, hustle: number): number {
  return Math.round(takings(b, o, hustle, 1) - costs(b, o));
}

export function takings(b: Business, o: Pick<OwnedBiz, "level" | "staff">, hustle: number, swing: number): number {
  const level = 1 + 0.45 * (o.level - 1);
  // Nobody minding the shop: you run it yourself on the side, for half the takings.
  const staff = o.staff === 0 ? 0.5 : 1 + 0.35 * (o.staff - 1);
  return b.base * level * staff * (1 + 0.05 * Math.floor(hustle)) * swing;
}

export const costs = (b: Business, o: Pick<OwnedBiz, "staff">) => b.upkeep + b.wage * o.staff;
