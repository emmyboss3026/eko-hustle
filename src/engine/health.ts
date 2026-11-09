import type { Needs } from "./needs";  // need names and values

const clamp = (n: number) => Math.max(0, Math.min(100, n));  // keep a number between 0 and 100

// Health per in-game hour, judged on the needs before AND after the time passed:
// -3 for each empty need (classic; relaxed survival uses gentler numbers, see data/survival.ts);
// otherwise it slowly recovers (+1, or +3 when every need is above 30).
export function updateHealth(
  health: number, before: Needs, minutes: number, after: Needs = before,
  rules: { healthPerEmptyNeed: number; maxHealthLossPerHour: number } = { healthPerEmptyNeed: 3, maxHealthLossPerHour: Infinity },
): number {
  const emptyCount = (n: Needs) => Object.values(n).filter(v => v <= 0).length;  // count needs that are empty
  const empty = (emptyCount(before) + emptyCount(after)) / 2;  // average of empty needs before and after
  const lowest = Math.min(...Object.values(after));  // the lowest need after the time passed
  const perHour = empty > 0 ? -Math.min(rules.healthPerEmptyNeed * empty, rules.maxHealthLossPerHour) : lowest > 30 ? 3 : 1;  // health change per hour: loss if needs are empty, else recovery
  return clamp(health + perHour * (minutes / 60));  // apply the change for the minutes passed
}
