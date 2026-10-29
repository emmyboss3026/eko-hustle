// Fictional investments for the 📈 Invest app. Nothing here is a real product or real money.
// Each fund's price moves once a game day: a small drift plus a random swing.
// Low risk = small, steady moves. High risk = big swings either way.

import { randNormal } from "../engine/rng";

export type FundId = "savings" | "bonds" | "agric" | "estate" | "tech" | "moon";
export type Risk = 1 | 2 | 3 | 4 | 5;

export type Fund = {
  id: FundId;
  emoji: string;
  risk: Risk;
  drift: number;   // average change per game day (0.002 = +0.2%)
  swing: number;   // typical size of a day's random move (0.01 = 1%)
  start: number;   // price on day 1 (₦ per unit)
  min?: number;    // smallest amount you can put in
};

export const FUNDS: Fund[] = [
  { id: "savings", emoji: "🏦", risk: 1, drift: 0.0015, swing: 0.0005, start: 100 },
  { id: "bonds", emoji: "📜", risk: 2, drift: 0.0025, swing: 0.006, start: 250 },
  { id: "agric", emoji: "🌾", risk: 3, drift: 0.003, swing: 0.018, start: 120 },
  { id: "estate", emoji: "🏘️", risk: 3, drift: 0.0035, swing: 0.022, start: 800, min: 20_000 },
  { id: "tech", emoji: "💻", risk: 4, drift: 0.004, swing: 0.045, start: 60 },
  { id: "moon", emoji: "🚀", risk: 5, drift: 0.002, swing: 0.11, start: 5 },
];

export const fundById = (id: string) => FUNDS.find(f => f.id === id);

/** Money kept when you sell (the rest is the fund's fee). */
export const SELL_KEEP = 0.99;
export const MIN_INVEST = 1_000;

const cache = new Map<string, number[]>();

/** A fund's price at the end of every day up to `day` (index 0 = day 1). */
export function priceHistory(seed: number, fund: Fund, day: number): number[] {
  const key = `${seed}|${fund.id}`;
  let list = cache.get(key);
  if (!list) {
    list = [fund.start];
    cache.set(key, list);
  }
  while (list.length < day) {
    const d = list.length + 1;
    const z = Math.max(-3, Math.min(3, randNormal(seed, "fund", fund.id, d)));
    const next = list[list.length - 1] * Math.exp(fund.drift - (fund.swing * fund.swing) / 2 + fund.swing * z);
    list.push(Math.max(fund.start * 0.02, next));
  }
  if (cache.size > 60) cache.clear(); // many lives in one session: keep memory small
  return list.slice(0, Math.max(1, day));
}

/** Today's price. */
export const priceOn = (seed: number, fund: Fund, day: number) => {
  const h = priceHistory(seed, fund, day);
  return h[h.length - 1];
};
