// The six needs, each from 0 (empty) to 100 (full)
export type Needs = {
  hunger: number;
  energy: number;
  fun: number;
  social: number;
  hygiene: number;
  bladder: number;
};

export const startNeeds: Needs = {
  hunger: 80, energy: 90, fun: 70, social: 60, hygiene: 85, bladder: 75,
};

// How many points each need loses per in-game hour
export const decayPerHour: Needs = {
  hunger: 4.5, energy: 3.5, fun: 3.5, social: 2.5, hygiene: 2.5, bladder: 6,
};

// Keep a number between 0 and 100
const clamp = (n: number) => Math.max(0, Math.min(100, n));

// Drain all needs for a number of in-game minutes.
// `rate` slows it down, e.g. 0.35 while asleep.
export function decay(needs: Needs, minutes: number, rate = 1): Needs {
  const h = (minutes / 60) * rate;
  return {
    hunger: clamp(needs.hunger - decayPerHour.hunger * h),
    energy: clamp(needs.energy - decayPerHour.energy * h),
    fun: clamp(needs.fun - decayPerHour.fun * h),
    social: clamp(needs.social - decayPerHour.social * h),
    hygiene: clamp(needs.hygiene - decayPerHour.hygiene * h),
    bladder: clamp(needs.bladder - decayPerHour.bladder * h),
  };
}

// Add an action's effects, e.g. { hunger: +40, fun: +5 }
export function apply(needs: Needs, effect: Partial<Needs>): Needs {
  return {
    hunger: clamp(needs.hunger + (effect.hunger ?? 0)),
    energy: clamp(needs.energy + (effect.energy ?? 0)),
    fun: clamp(needs.fun + (effect.fun ?? 0)),
    social: clamp(needs.social + (effect.social ?? 0)),
    hygiene: clamp(needs.hygiene + (effect.hygiene ?? 0)),
    bladder: clamp(needs.bladder + (effect.bladder ?? 0)),
  };
}