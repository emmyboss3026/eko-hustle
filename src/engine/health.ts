import type { Needs } from "./needs";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

// Health per in-game hour, judged on the needs before AND after the time passed:
// -3 for each empty need; otherwise it slowly recovers (+1, or +3 when every need is above 30).
export function updateHealth(health: number, before: Needs, minutes: number, after: Needs = before): number {
  const emptyCount = (n: Needs) => Object.values(n).filter(v => v <= 0).length;
  const empty = (emptyCount(before) + emptyCount(after)) / 2;
  const lowest = Math.min(...Object.values(after));
  const perHour = empty > 0 ? -3 * empty : lowest > 30 ? 3 : 1;
  return clamp(health + perHour * (minutes / 60));
}
