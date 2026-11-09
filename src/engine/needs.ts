// The six needs, each from 0 (empty) to 100 (full)
export type Needs = {  // the six needs
  hunger: number;  // food
  energy: number;  // rest
  fun: number;  // enjoyment
  social: number;  // company
  hygiene: number;  // cleanliness
  bladder: number;  // toilet
};

export const startNeeds: Needs = {  // needs at the start of a life
  hunger: 80, energy: 90, fun: 70, social: 60, hygiene: 85, bladder: 75,  // starting values
};

// How many points each need loses per in-game hour
export const decayPerHour: Needs = {  // loss per in-game hour
  hunger: 4.5, energy: 3.5, fun: 3.5, social: 2.5, hygiene: 2.5, bladder: 6,  // loss rates
};

// Keep a number between 0 and 100
const clamp = (n: number) => Math.max(0, Math.min(100, n));  // keep a number between 0 and 100

// Drain all needs for a number of in-game minutes.
// `rate` slows it down, e.g. 0.35 while asleep.
export function decay(needs: Needs, minutes: number, rate = 1): Needs {  // drain needs over some minutes
  const h = (minutes / 60) * rate;  // hours passed, scaled by the rate
  return {
    hunger: clamp(needs.hunger - decayPerHour.hunger * h),  // food drops
    energy: clamp(needs.energy - decayPerHour.energy * h),  // energy drops
    fun: clamp(needs.fun - decayPerHour.fun * h),  // fun drops
    social: clamp(needs.social - decayPerHour.social * h),  // company drops
    hygiene: clamp(needs.hygiene - decayPerHour.hygiene * h),  // cleanliness drops
    bladder: clamp(needs.bladder - decayPerHour.bladder * h),  // toilet need rises
  };
}

// Add an action's effects, e.g. { hunger: +40, fun: +5 }
export function apply(needs: Needs, effect: Partial<Needs>): Needs {  // add an action's effects
  return {
    hunger: clamp(needs.hunger + (effect.hunger ?? 0)),  // food changes
    energy: clamp(needs.energy + (effect.energy ?? 0)),  // energy changes
    fun: clamp(needs.fun + (effect.fun ?? 0)),  // fun changes
    social: clamp(needs.social + (effect.social ?? 0)),  // company changes
    hygiene: clamp(needs.hygiene + (effect.hygiene ?? 0)),  // cleanliness changes
    bladder: clamp(needs.bladder + (effect.bladder ?? 0)),  // toilet changes
  };
}