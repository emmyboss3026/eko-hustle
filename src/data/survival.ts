// Relaxed survival: help so you don't collapse too fast. Ideas taken from Gidi Hustle,
// where empty needs have consequences but never kill you on their own.
//
// KILL SWITCH: set RELAXED_SURVIVAL to false and the whole feature is gone. Every player
// gets the classic (harder) rules and the setting disappears from 👤 Me.
// Players can also turn it off themselves in 👤 Me → Settings → Survival.
export const RELAXED_SURVIVAL = true;

export const RELAXED = {
  needDrain: 0.6,           // needs drain at 60% of the classic speed
  healthPerEmptyNeed: 1,    // health lost per hour for each empty need (classic: 3)
  maxHealthLossPerHour: 2,  // never lose more than this per hour, however many needs are empty
  minutesPerTick: 5,        // game minutes per real second at 1× (classic: 10)
  passOutHours: 2,          // energy hits 0: you fall asleep where you are
  passOutEnergy: 25,        // and wake up with this much energy
  accidentHygiene: 50,      // bladder hits 0: you have an accident and lose this much hygiene
};

export const CLASSIC = {
  needDrain: 1,
  healthPerEmptyNeed: 3,
  maxHealthLossPerHour: Infinity,
  minutesPerTick: 10,
};

/** Is relaxed survival on for this game? On by default; off when the player chose classic. */
export const isRelaxed = (s: { relaxed?: boolean }) => RELAXED_SURVIVAL && s.relaxed !== false;
