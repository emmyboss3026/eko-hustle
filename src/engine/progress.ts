// Progress: level, net worth, social status, achievements and score.
// All of these are worked out from the save itself (never stored), so there is one source of truth.
// The same score formula runs on the server (supabase/schema.sql → submit_stats), which recomputes it.

import type { GameState } from "./game";
import { CATALOG, SELL_BACK } from "../data/home";
import { FUNDS, priceOn, SELL_KEEP, type FundId } from "../data/invest";
import { BIZ_RESALE } from "../data/business";
import { CONTACTS, CLOSE } from "../data/contacts";
import { missions } from "../data/missions";
import { careers } from "../data/careers";
import { hash } from "./rng";

export const dayNumber = (s: Pick<GameState, "time">) => Math.floor(s.time / 1440) + 1;
export const seedOf = (s: Pick<GameState, "seed" | "sim">) => s.seed ?? hash(s.sim.name);

/** What your investments would fetch if you sold them all today. */
export function portfolioValue(s: GameState): number {
  const day = dayNumber(s);
  let total = 0;
  for (const f of FUNDS) {
    const h = s.portfolio?.[f.id as FundId];
    if (h && h.units > 0) total += h.units * priceOn(seedOf(s), f, day) * SELL_KEEP;
  }
  return Math.round(total);
}

export const businessValue = (s: GameState) => Math.round((s.businesses ?? []).reduce((sum, b) => sum + b.invested * BIZ_RESALE, 0));

export const furnitureValue = (s: GameState) =>
  Math.round(s.home.objects.reduce((sum, o) => sum + (CATALOG[o.type]?.fixed ? 0 : CATALOG[o.type].price * SELL_BACK), 0));

/** Cash + investments + businesses + furniture − rent you owe. */
export function netWorth(s: GameState): number {
  return Math.round(s.money - s.rentOwed + portfolioValue(s) + businessValue(s) + furnitureValue(s));
}

export const reputation = (s: GameState) => Math.round(s.rep ?? 0);

// ---------- level ----------

export function xp(s: GameState): number {
  const skills = Object.values(s.skills).reduce((a, b) => a + b, 0);
  const bizLevels = (s.businesses ?? []).reduce((a, b) => a + b.level, 0);
  return Math.round(
    skills * 100 + s.stats.promotions * 150 + s.stats.shifts * 15 + (s.mission ?? 0) * 120
    + bizLevels * 100 + (dayNumber(s) - 1) * 10 + achievements(s).length * 80,
  );
}

export const MAX_LEVEL = 99;
/** Level 1 at 0 XP, then each level needs a bit more. */
export const levelFor = (points: number) => Math.min(MAX_LEVEL, Math.floor(Math.sqrt(Math.max(0, points) / 150)) + 1);
export const xpForLevel = (level: number) => (level - 1) ** 2 * 150;
export const level = (s: GameState) => levelFor(xp(s));

// ---------- social status ----------

export const STATUS = [
  { key: "status.0", emoji: "🧳", rep: 0, worth: -Infinity },
  { key: "status.1", emoji: "🌱", rep: 10, worth: 50_000 },
  { key: "status.2", emoji: "👀", rep: 25, worth: 150_000 },
  { key: "status.3", emoji: "🕶️", rep: 45, worth: 400_000 },
  { key: "status.4", emoji: "🦅", rep: 65, worth: 1_000_000 },
  { key: "status.5", emoji: "👑", rep: 85, worth: 3_000_000 },
] as const;

/** 0–5: you need both the reputation and the net worth for a tier. */
export function statusTier(s: GameState): number {
  const rep = reputation(s);
  const worth = netWorth(s);
  let tier = 0;
  STATUS.forEach((t, i) => {
    if (rep >= t.rep && worth >= t.worth) tier = i;
  });
  return tier;
}

// ---------- achievements ----------

export type Achievement = { id: string; emoji: string; done: (s: GameState) => boolean };

const closeFriends = (s: GameState) => CONTACTS.filter(c => !c.family && (s.contacts?.[c.id]?.rel ?? c.start) >= CLOSE).length;
const realised = (s: GameState) => (s.trades ?? []).reduce((a, t) => a + (t.pnl ?? 0), 0);

export const ACHIEVEMENTS: Achievement[] = [
  { id: "firstShift", emoji: "💼", done: s => s.stats.shifts >= 1 },
  { id: "promoted", emoji: "🎉", done: s => s.stats.promotions >= 1 },
  { id: "topCareer", emoji: "👑", done: s => !!s.career && s.career.level >= careers[s.career.id].levels.length - 1 },
  { id: "ielts", emoji: "📝", done: s => s.ielts },
  { id: "visa", emoji: "🛂", done: s => s.visa },
  { id: "worth100k", emoji: "💰", done: s => netWorth(s) >= 100_000 },
  { id: "worth1m", emoji: "💎", done: s => netWorth(s) >= 1_000_000 },
  { id: "firstBiz", emoji: "🏪", done: s => (s.businesses ?? []).length >= 1 },
  { id: "tycoon", emoji: "🏙️", done: s => (s.businesses ?? []).length >= 3 },
  { id: "investor", emoji: "📈", done: s => (s.trades ?? []).some(t => t.side === "buy") },
  { id: "bigWin", emoji: "🤑", done: s => realised(s) >= 50_000 },
  { id: "popular", emoji: "🤝🏾", done: s => closeFriends(s) >= 3 },
  { id: "respected", emoji: "🌟", done: s => reputation(s) >= 50 },
  { id: "socialite", emoji: "💌", done: s => (s.counts?.invite ?? 0) >= 5 },
  { id: "streak7", emoji: "🔥", done: s => (s.daily ?? []).some(d => d.streakDay === 7) },
  { id: "generator", emoji: "⚡", done: s => s.home.objects.some(o => o.type === "generator") },
  { id: "survivor", emoji: "📅", done: s => dayNumber(s) >= 30 },
  { id: "missions", emoji: "🏆", done: s => (s.mission ?? 0) >= missions.length },
];

export const achievements = (s: GameState) => ACHIEVEMENTS.filter(a => a.done(s));

// ---------- score (the leaderboard's main number) ----------

export type ScoreParts = { level: number; rep: number; achievements: number; careerLevel: number; businesses: number; netWorth: number };

export function scoreParts(s: GameState): ScoreParts {
  return {
    level: level(s),
    rep: reputation(s),
    achievements: achievements(s).length,
    careerLevel: s.career ? s.career.level + 1 : 0,
    businesses: (s.businesses ?? []).length,
    netWorth: netWorth(s),
  };
}

/** Keep this in step with submit_stats() in supabase/schema.sql. */
export function scoreFrom(p: ScoreParts): number {
  return Math.floor(
    p.level * 120 + p.rep * 25 + p.achievements * 150 + p.careerLevel * 200 + p.businesses * 250
    + Math.sqrt(Math.max(0, p.netWorth) / 1000) * 30,
  );
}

export const score = (s: GameState) => scoreFrom(scoreParts(s));
