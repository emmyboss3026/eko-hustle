import type { DistrictId } from "./places";

const clamp01 = (n: number) => Math.max(0.05, Math.min(0.95, n));

// Two ways to "win": japa abroad, or become a landlord at home.
export const PROOF_OF_FUNDS = 600_000;

export type GoalStepId = "ielts" | "visa" | "flight" | "house";

export type GoalStep = {
  id: GoalStepId;
  path: "japa" | "home";
  emoji: string;
  name: string;
  desc: string;
  where: DistrictId | "any";
  place: string;
  cost: number;
  minutes: number;
};

export const goalSteps: Record<GoalStepId, GoalStep> = {
  ielts: {
    id: "ielts", path: "japa", emoji: "📝", name: "Pass the IELTS exam",
    desc: "Your chance of passing grows with your 📚 Study skill.",
    where: "yaba", place: "Exam centre, Yaba", cost: 40_000, minutes: 240,
  },
  visa: {
    id: "visa", path: "japa", emoji: "🛂", name: "Visa interview",
    desc: `Needs IELTS and ${"₦" + PROOF_OF_FUNDS.toLocaleString("en-NG")} proof of funds in your account (after the fee). 😎 Charisma and good health help.`,
    where: "island", place: "Embassy, Victoria Island", cost: 60_000, minutes: 300,
  },
  flight: {
    id: "flight", path: "japa", emoji: "✈️", name: "Book your flight and japa",
    desc: "Visa approved? Go to the airport in Ikeja, buy the ticket and start a new life abroad.",
    where: "ikeja", place: "Airport, Ikeja", cost: 250_000, minutes: 120,
  },
  house: {
    id: "house", path: "home", emoji: "🏡", name: "Buy your own flat",
    desc: "No more landlord wahala. Become a big man at home.",
    where: "island", place: "Estate agent, Lekki", cost: 1_500_000, minutes: 180,
  },
};

export const ieltsChance = (study: number) => clamp01(0.1 + study * 0.09);
export const visaChance = (charisma: number, health: number) => clamp01(0.35 + charisma * 0.06 + (health > 70 ? 0.1 : 0));
