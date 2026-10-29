// Tips: short hints that react to what's happening right now, plus general advice.
// The most urgent tip is shown in the tip bubble; the player can tap › for more.
// The words live in the translation files under "tip.<id>".

import type { GameState } from "../engine/game";
import { dayOf, powered } from "../engine/game";
import { RENT, RENT_EVERY_DAYS, naira } from "../engine/economy";
import { careers } from "../data/careers";
import type { DistrictId } from "../data/places";

export type Tip = { id: string; emoji: string; key: string; vars?: Record<string, string | number>; place?: DistrictId; urgent?: boolean };

const hourOf = (s: GameState) => (s.time % 1440) / 60;

/** Tips for this moment, most urgent first. */
export function tipsFor(s: GameState): Tip[] {
  const n = s.needs;
  const h = hourOf(s);
  const home = s.location === "mushin";
  const tips: Tip[] = [];
  const add = (id: string, emoji: string, key: string, opts: Partial<Tip> = {}) => tips.push({ id, emoji, key, ...opts });

  // Danger first
  if (s.health < 40) add("health", "❤️", "tip.health", { urgent: true });
  if (s.rentOwed > 0) add("owed", "😬", "tip.owed", { vars: { money: naira(s.rentOwed) }, urgent: true });
  const day = dayOf(s.time);
  const daysToRent = RENT_EVERY_DAYS - ((day - 1) % RENT_EVERY_DAYS);
  if (daysToRent <= 2 && s.money < RENT) {
    add("rent", "🏠", daysToRent > 1 ? "tip.rent" : "tip.rent1", { vars: { rent: naira(RENT), days: daysToRent, money: naira(s.money) }, urgent: true });
  }

  // Needs
  if (n.bladder < 25) add("bladder", "🚻", home ? "tip.bladder.home" : "tip.bladder.out", { urgent: true });
  if (n.hunger < 30) add("hunger", "🍲", home ? "tip.hunger.home" : "tip.hunger.out", { urgent: true });
  if (n.energy < 25) add("energy", "⚡", home ? "tip.energy.home" : "tip.energy.out", { urgent: true });
  if (n.hygiene < 25) add("hygiene", "🛁", home ? "tip.hygiene.home" : "tip.hygiene.out");
  if (n.social < 25) add("social", "💬", "tip.social");
  if (n.fun < 25) add("fun", "🎉", "tip.fun");

  // Situation
  if (!powered(s) && home) add("nepa", "🕯️", "tip.nepa");
  if (s.home.food === 0) add("food", "🧺", "tip.food");
  if (!s.career) add("job", "💼", "tip.job");
  if (s.career) {
    const c = careers[s.career.id];
    if (s.location !== c.where) add("work-far", "🚌", "tip.workFar", { place: c.where });
    else if (n.energy >= 15) add("work-here", "💼", "tip.workHere");
  }
  if (h >= 22 || h < 5) add("late", "🌙", "tip.late");
  if (h >= 6 && h < 9) add("morning", "🌅", "tip.morning");

  // General advice (always there, shown when nothing else is going on)
  for (const [id, emoji] of [
    ["plan", "📅"], ["pause", "⏸️"], ["fastfood", "🍔"], ["mood", "😄"], ["skills", "📈"],
    ["walk", "🚶🏾"], ["diary", "📖"], ["feedback", "💬"], ["save", "💾"], ["help", "❓"],
  ] as const) {
    add(id, emoji, `tip.${id}`);
  }
  return tips;
}
