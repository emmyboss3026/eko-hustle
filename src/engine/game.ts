// The whole game's rules live here. No React, no screen code.
// Every change to the game is a Command passed to `reduce`, which returns a NEW state.
// Random numbers come in through the command, so the rules are fully testable.

import { type Needs, startNeeds, decay, apply } from "./needs";
import { updateHealth } from "./health";
import { RENT, START_MONEY, rentDue, naira } from "./economy";
import { actionById, type Action } from "../data/actions";
import { districts, distanceKm, modes, trip, type DistrictId } from "../data/places";
import { payBonus, fareFor, type Sim, type TraitId } from "../data/traits";
import { careers, type CareerId } from "../data/careers";
import { eventById, pickEvent, EVENT_CHANCE, EVENT_COOLDOWN, type Outcome } from "../data/events";
import { addSkills, meets, describeReq, startSkills, type Skills } from "../data/skills";
import { goalSteps, ieltsChance, visaChance, PROOF_OF_FUNDS, type GoalStepId } from "../data/goals";
import {
  CATALOG, EVICT_AFTER_WEEKS, HOME, POWER, SELL_BACK, START_OBJECTS, START_SUPPLIES,
  type FurnitureType, type Placed,
} from "../data/home";
import { canPlace } from "./path";
import { moodlets as moodInfo, type ActiveMoodlet, type MoodletId } from "../data/moodlets";
import { spots, spotOpen, openText, type SpotId } from "../data/spots";
import { missions } from "../data/missions";

export type EndingKind = "japa" | "landlord" | "evicted" | "collapsed";
export type Ending = { kind: EndingKind; day: number };

export type Stats = {
  earned: number;
  spent: number;
  shifts: number;
  trips: number;
  events: number;
  sentHome: number;
  promotions: number;
};

export type Home = {
  objects: Placed[];   // furniture in your room
  nextUid: number;
  food: number;        // meal packs for cooking
  fuel: number;        // litres of generator fuel
};

export type GameState = {
  version: 4;
  sim: Sim;
  time: number;            // in-game minutes since day 1, 00:00
  money: number;
  needs: Needs;
  health: number;
  location: DistrictId;
  skills: Skills;
  career: { id: CareerId; level: number; shifts: number } | null;
  ielts: boolean;
  visa: boolean;
  eventId: string | null;   // event waiting for a choice
  lastEventAt: number;
  log: string[];
  stats: Stats;
  ending: Ending | null;
  lastRewardDay?: number;   // the in-game day a rewarded ad was last claimed
  home: Home;
  power: { grid: boolean; outageEnds: number };  // grid = NEPA light is on
  rentOwed: number;         // unpaid rent (arrears)
  moodlets: ActiveMoodlet[];  // short moods (see data/moodlets.ts)
  counts: Record<string, number>; // how often you did things (for missions)
  mission: number;          // index of the current mission (see data/missions.ts)
};

export type Command =
  | { type: "tick"; minutes: number; roll: number; pick: number; power?: number; powerPick?: number }
  | { type: "buy"; item: FurnitureType; x: number; y: number; rot: number }
  | { type: "move"; uid: number; x: number; y: number; rot: number }
  | { type: "sell"; uid: number }
  | { type: "payRent" }
  | { type: "act"; id: string }
  | { type: "work" }
  | { type: "apply"; career: CareerId }
  | { type: "quit" }
  | { type: "travel"; to: DistrictId; mode: string }
  | { type: "walk"; to: DistrictId; spot: SpotId }   // walked in through a door in the 3D streets
  | { type: "choose"; index: number; roll: number }
  | { type: "goal"; id: GoalStepId; roll: number }
  | { type: "reward" };   // the player finished watching a rewarded ad

export const AD_REWARD = 3_000;

const LOG_SIZE = 40;

export const dayOf = (time: number) => Math.floor(time / 1440) + 1;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const weekdayOf = (time: number) => WEEKDAYS[Math.floor(time / 1440) % 7];

export function clockOf(time: number) {
  const hh = String(Math.floor((time % 1440) / 60)).padStart(2, "0");
  const mm = String(Math.floor(time % 60)).padStart(2, "0");
  return `${hh}:${mm}`;
}

function startHome(): Home {
  return {
    objects: START_OBJECTS.map((o, i) => ({ ...o, uid: i + 1 })),
    nextUid: START_OBJECTS.length + 1,
    ...START_SUPPLIES,
  };
}

export function newGame(sim: Sim): GameState {
  return {
    version: 4,
    sim,
    time: 8 * 60,
    money: START_MONEY,
    needs: startNeeds,
    health: 100,
    location: "mushin",
    skills: startSkills,
    career: null,
    ielts: false,
    visa: false,
    eventId: null,
    lastEventAt: 0,
    log: [`👋 ${sim.name} arrives in Mushin with ${naira(START_MONEY)} and big dreams. Rent is ${naira(RENT)} every 7 days.`],
    stats: { earned: 0, spent: 0, shifts: 0, trips: 0, events: 0, sentHome: 0, promotions: 0 },
    ending: null,
    home: startHome(),
    power: { grid: true, outageEnds: 0 },
    rentOwed: 0,
    moodlets: [],
    counts: {},
    mission: 0,
  };
}

/** Bring an older save up to date, or return null if it isn't a save at all. */
export function upgrade(data: unknown): GameState | null {
  const d = data as (Omit<Partial<GameState>, "version"> & { version?: number }) | null;
  if (!d || typeof d !== "object" || !d.sim || !d.needs) return null;
  if (d.version === 4 && d.home && d.power) return d as GameState;
  const extras = { moodlets: [], counts: {}, mission: 0 };
  if (d.version === 3 && d.home && d.power) {
    // Eko Hustle 1: the room now has three rooms. Starter furniture is swapped for the new
    // starter set; anything you bought stays where it fits, or is refunded at full price.
    let home = startHome();
    let money = d.money ?? 0;
    const notes: string[] = [];
    for (const o of d.home.objects.filter(o => o.uid > 5 && !CATALOG[o.type]?.fixed)) {
      const placed = { ...o, uid: home.nextUid };
      if (canPlace(HOME, home.objects, placed)) {
        home = { ...home, objects: [...home.objects, placed], nextUid: home.nextUid + 1 };
      } else {
        money += CATALOG[o.type]?.price ?? 0;
        notes.push(`🔨 Your room was rebuilt with 3 rooms. Your ${CATALOG[o.type]?.name ?? o.type} didn't fit, so you got ${naira(CATALOG[o.type]?.price ?? 0)} back.`);
      }
    }
    home = { ...home, food: d.home.food, fuel: d.home.fuel };
    return { ...(d as unknown as GameState), ...extras, version: 4, home, money, log: [...notes, ...(d.log ?? [])].slice(0, LOG_SIZE) };
  }
  if (d.version === 2) {
    // A Hustle & Japa save: keep the life, add the room, light, rent book and missions.
    return { ...(d as unknown as GameState), ...extras, version: 4, home: startHome(), power: { grid: true, outageEnds: 0 }, rentOwed: 0 };
  }
  return null;
}

// ---------- small helpers ----------

function say(s: GameState, line: string): GameState {
  return { ...s, log: [line, ...s.log].slice(0, LOG_SIZE) };
}

function pay(s: GameState, amount: number): GameState {
  if (amount <= 0) return s;
  return { ...s, money: s.money + amount, stats: { ...s.stats, earned: s.stats.earned + amount } };
}

function charge(s: GameState, amount: number): GameState {
  if (amount <= 0) return s;
  return { ...s, money: s.money - amount, stats: { ...s.stats, spent: s.stats.spent + amount } };
}

function bump(s: GameState, key: string, by = 1): GameState {
  return { ...s, counts: { ...s.counts, [key]: (s.counts?.[key] ?? 0) + by } };
}

/** Give a mood for its usual number of hours (replacing the same mood if you had it). */
export function addMood(s: GameState, id: MoodletId): GameState {
  const until = s.time + moodInfo[id].hours * 60;
  return { ...s, moodlets: [...(s.moodlets ?? []).filter(m => m.id !== id), { id, until }] };
}

function dropMood(s: GameState, id: MoodletId): GameState {
  return { ...s, moodlets: (s.moodlets ?? []).filter(m => m.id !== id) };
}

/** Your mood, 0–100: the average of your needs, pushed up or down by your active moods. */
export function mood(s: GameState): number {
  const n = s.needs;
  const base = (n.hunger + n.energy + n.fun + n.social + n.hygiene + n.bladder) / 6;
  const extra = (s.moodlets ?? []).reduce((sum, m) => sum + (moodInfo[m.id]?.value ?? 0), 0);
  return Math.round(Math.max(0, Math.min(100, base + extra)));
}

/** Good mood: +10% pay at work. Bad mood: −10%. */
export function moodPay(s: GameState): number {
  const m = mood(s);
  return m >= 70 ? 1.1 : m < 35 ? 0.9 : 1;
}

function end(s: GameState, kind: EndingKind): GameState {
  return s.ending ? s : { ...s, ending: { kind, day: dayOf(s.time) }, eventId: null };
}

// Good effects get stronger with traits (and an action's boost skill)
function boosted(effect: Partial<Needs>, trait: TraitId, isFood: boolean, skillBoost = 0): Partial<Needs> {
  const out: Partial<Needs> = {};
  for (const key of Object.keys(effect) as (keyof Needs)[]) {
    let v = effect[key] ?? 0;
    if (v > 0) {
      v *= 1 + skillBoost * 0.05;
      if (trait === "foodie" && isFood && key === "hunger") v *= 1.3;
      if (trait === "charmer" && (key === "fun" || key === "social")) v *= 1.3;
    }
    out[key] = Math.round(v);
  }
  return out;
}

function learn(s: GameState, gain: Partial<Skills> | undefined): GameState {
  if (!gain) return s;
  const t = s.sim.trait;
  const scaled: Partial<Skills> = { ...gain };
  if (t === "bookworm" && scaled.study) scaled.study *= 1.5;
  if (t === "charmer" && scaled.charisma) scaled.charisma *= 1.5;
  let next: GameState = { ...s, skills: addSkills(s.skills, scaled) };
  for (const id of Object.keys(scaled) as (keyof Skills)[]) {
    if (Math.floor(next.skills[id]) > Math.floor(s.skills[id])) {
      next = say(addMood(next, "learned"), `📈 ${skillName[id]} is now level ${Math.floor(next.skills[id])}!`);
    }
  }
  return next;
}

const skillName: Record<keyof Skills, string> = { hustle: "Hustle", study: "Study", charisma: "Charisma", fitness: "Fitness", cooking: "Cooking" };

/** Money an action pays you (with your trait bonus). */
export function earnings(s: GameState, a: Action): number {
  const base = a.pay ?? (a.earn ? a.earn.base + a.earn.per * Math.floor(s.skills[a.earn.skill]) : 0);
  return Math.round((base * payBonus(s.sim.trait)) / 50) * 50;
}

// Time passes: needs drain, health changes, rent may be due.
export function passTime(s: GameState, minutes: number, effect?: Partial<Needs>, asleep = false): GameState {
  if (s.ending) return s;
  const time = s.time + minutes;
  const drained = decay(s.needs, minutes, asleep ? 0.35 : 1);
  const needs = effect ? apply(drained, effect) : drained;
  const health = updateHealth(s.health, s.needs, minutes, needs);
  let next: GameState = runPower({ ...s, time, needs, health }, s.time, time);
  next = { ...next, moodlets: (next.moodlets ?? []).filter(m => m.until > time) };
  if (needs.social < 15 && !next.moodlets.some(m => m.id === "lonely")) next = addMood(next, "lonely");
  const h = (time % 1440) / 60;
  if (!powered(next) && next.location === "mushin" && (h >= 21 || h < 6) && !next.moodlets.some(m => m.id === "sweatyNight")) {
    next = addMood(next, "sweatyNight");
  }

  if (rentDue(s.time, time)) {
    const owed = next.rentOwed + RENT;
    const paid = Math.min(next.money, owed);
    const left = owed - paid;
    next = { ...charge(next, paid), rentOwed: left };
    if (left === 0) {
      next = dropMood(bump(next, "rentPaid"), "rentPressure");
      next = say(next, owed > RENT ? `🏠 Rent and arrears paid: ${naira(owed)}` : `🏠 Rent paid: ${naira(RENT)}`);
    } else if (left > RENT * (EVICT_AFTER_WEEKS - 1)) {
      next = say(next, `🚪 Landlord don throw you out. You owed ${naira(left)}.`);
      return end(next, "evicted");
    } else {
      next = addMood({ ...next, needs: { ...next.needs, fun: Math.max(0, next.needs.fun - 15) } }, "rentPressure");
      next = say(next, `😬 Rent day! You're short: you still owe ${naira(left)}. Pay the landlord before next rent day or you're out.`);
    }
  }
  if (next.health <= 0) {
    next = say(next, "🚑 You collapsed and were rushed to hospital.");
    return end(next, "collapsed");
  }
  return next;
}

// Light: NEPA cuts come and go; the generator covers you while you're home and have fuel.
function runPower(s: GameState, from: number, to: number): GameState {
  if (s.power.grid) return s;
  let next = s;
  const darkMinutes = Math.max(0, Math.min(to, s.power.outageEnds) - from);
  if (s.location === "mushin" && hasItem(s, "generator") && s.home.fuel > 0 && darkMinutes > 0) {
    const fuel = Math.max(0, s.home.fuel - (darkMinutes / 60) * POWER.fuelPerHour);
    next = { ...next, home: { ...next.home, fuel: fuel < 0.01 ? 0 : fuel } };
    if (next.home.fuel === 0) next = say(next, "⛽ Your generator ran out of fuel.");
  }
  if (to >= s.power.outageEnds) {
    next = say(addMood({ ...next, power: { grid: true, outageEnds: 0 } }, "lightBack"), "💡 Light is back! UP NEPA!");
  }
  return next;
}

// ---------- what the UI can ask about ----------

export const hasItem = (s: GameState, type: FurnitureType) => s.home.objects.some(o => o.type === type);
export const generatorOn = (s: GameState) => !s.power.grid && hasItem(s, "generator") && s.home.fuel > 0;
export const powered = (s: GameState) => s.power.grid || generatorOn(s);

function article(name: string) {
  return /^[aeiou]/i.test(name) ? `an ${name}` : `a ${name}`;
}

export function canDo(s: GameState, a: Action): string | null {
  if (a.where !== "any" && a.where !== s.location) return `Go to ${districts[a.where].name} first.`;
  if (!spotOpen(a.spot, s.time)) return `${spots[a.spot].name} is closed now. ${openText(a.spot)}.`;
  if (a.req && !meets(s.skills, a.req)) return `Needs ${describeReq(a.req)}. Train it first.`;
  if (a.uses && !a.uses.some(t => hasItem(s, t))) {
    return `You need ${a.uses.map(t => article(CATALOG[t].name.toLowerCase())).join(" or ")}. Buy one in the Home tab.`;
  }
  if (a.power && !powered(s)) return "No light! NEPA took it. A generator with fuel fixes that.";
  if (a.food && s.home.food < a.food) return "No food at home. Buy groceries.";
  if (s.money < a.cost) return "Not enough money.";
  return null;
}

export function itemBlocker(s: GameState, item: FurnitureType): string | null {
  if (s.location !== "mushin") return "Go home to Mushin to arrange your room.";
  if (CATALOG[item].fixed) return "That comes with the room.";
  if (s.money < CATALOG[item].price) return `You need ${naira(CATALOG[item].price)}.`;
  return null;
}

export const sellPrice = (type: FurnitureType) => Math.round(CATALOG[type].price * SELL_BACK);

/** What your next shift pays: job level × trait bonus × mood bonus. */
export function shiftPay(s: GameState): number {
  if (!s.career) return 0;
  const level = careers[s.career.id].levels[s.career.level];
  return Math.round((level.pay * payBonus(s.sim.trait) * moodPay(s)) / 50) * 50;
}

export function nextPromotion(s: GameState): { title: string; shiftsLeft: number; missing: string } | null {
  if (!s.career) return null;
  const c = careers[s.career.id];
  const next = c.levels[s.career.level + 1];
  if (!next) return null;
  return {
    title: next.title,
    shiftsLeft: Math.max(0, c.shiftsToPromote - s.career.shifts),
    missing: meets(s.skills, next.req) ? "" : describeReq(next.req),
  };
}

export function goalBlocker(s: GameState, id: GoalStepId): string | null {
  const g = goalSteps[id];
  if (id === "visa" && !s.ielts) return "Pass IELTS first.";
  if (id === "flight" && !s.visa) return "You need a visa first.";
  if (id === "ielts" && s.ielts) return "Already passed.";
  if (id === "visa" && s.visa) return "Visa already approved.";
  if (g.where !== "any" && g.where !== s.location) return `Go to ${districts[g.where].name} first.`;
  if (s.money < g.cost) return `You need ${naira(g.cost)}.`;
  if (id === "visa" && s.money - g.cost < PROOF_OF_FUNDS) return `Proof of funds: you need ${naira(PROOF_OF_FUNDS)} left after the fee.`;
  return null;
}

export function goalChance(s: GameState, id: GoalStepId): number | null {
  if (id === "ielts") return ieltsChance(s.skills.study);
  if (id === "visa") return visaChance(s.skills.charisma, s.health);
  return null;
}

export function canClaimReward(s: GameState): boolean {
  return s.lastRewardDay !== dayOf(s.time);
}

// ---------- the reducer ----------

export function reduce(s: GameState, cmd: Command): GameState {
  const next = step(s, cmd);
  return next === s ? s : checkMissions(next);
}

/** Finish the current mission (and any after it that are already done), paying the rewards. */
export function checkMissions(s: GameState): GameState {
  let next = s;
  for (let guard = 0; guard < missions.length; guard++) {
    const m = missions[next.mission ?? 0];
    if (!m || !m.done(next)) break;
    next = { ...next, mission: (next.mission ?? 0) + 1 };
    if (m.reward) next = pay(next, m.reward);
    next = addMood(next, "mission");
    next = say(next, `🎯 MISSION COMPLETE: ${m.title}!${m.reward ? ` +${naira(m.reward)}` : ""}`);
  }
  return next;
}

function step(s: GameState, cmd: Command): GameState {
  if (s.ending) return s;
  // While an event is open, only a choice can happen.
  if (s.eventId && cmd.type !== "choose") return s;

  switch (cmd.type) {
    case "tick": {
      let next = passTime(s, cmd.minutes);
      if (!next.ending && next.power.grid && cmd.power !== undefined && cmd.power < POWER.outagePerHour * (cmd.minutes / 60)) {
        const [lo, hi] = POWER.outageHours;
        const hours = lo + Math.floor((cmd.powerPick ?? 0) * (hi - lo + 1));
        next = { ...next, power: { grid: false, outageEnds: next.time + hours * 60 } };
        next = say(next, generatorOn(next) && next.location === "mushin"
          ? "🕯️ NEPA took light! Your generator kicks in."
          : "🕯️ NEPA took light! Anything electric at home won't work until it's back.");
      }
      if (!next.ending && next.time - next.lastEventAt >= EVENT_COOLDOWN && cmd.roll < EVENT_CHANCE) {
        const e = pickEvent(next.location, cmd.pick);
        next = { ...next, eventId: e.id, lastEventAt: next.time, stats: { ...next.stats, events: next.stats.events + 1 } };
      }
      return next;
    }

    case "act": {
      const a = actionById(cmd.id);
      if (!a) return s;
      const problem = canDo(s, a);
      if (problem) return say(s, `❌ ${a.label}: ${problem}`);
      let next = charge(s, a.cost);
      if (a.food || a.stock) {
        next = {
          ...next,
          home: {
            ...next.home,
            food: next.home.food - (a.food ?? 0) + (a.stock?.food ?? 0),
            fuel: next.home.fuel + (a.stock?.fuel ?? 0),
          },
        };
      }
      const effect = boosted(a.effect, s.sim.trait, a.category === "food", a.boost ? s.skills[a.boost] : 0);
      next = passTime(next, a.minutes, effect, a.asleep);
      if (next.ending) return next;
      next = bump(learn(next, a.skill), a.id);
      if (a.mood) next = addMood(next, a.mood);
      const earned = earnings(s, a);
      if (earned > 0) {
        next = say(bump(pay(next, earned), "earned", earned), `${a.emoji} ${a.label}: made ${naira(earned)}`);
      } else {
        next = say(next, `${a.emoji} ${a.label}`);
      }
      return next;
    }

    case "apply": {
      const c = careers[cmd.career];
      const first = c.levels[0];
      if (!meets(s.skills, first.req)) return say(s, `❌ ${c.name} needs ${describeReq(first.req)}.`);
      if (s.career?.id === c.id) return s;
      return say(bump({ ...s, career: { id: c.id, level: 0, shifts: 0 } }, "apply"), `${c.emoji} You got a job: ${first.title}! Work at ${districts[c.where].name}.`);
    }

    case "quit": {
      if (!s.career) return s;
      return say({ ...s, career: null }, "🚪 You quit your job.");
    }

    case "work": {
      if (!s.career) return say(s, "❌ You don't have a job. Check the Jobs tab.");
      const c = careers[s.career.id];
      if (s.location !== c.where) return say(s, `❌ Your job is in ${districts[c.where].name}.`);
      if (s.needs.energy < 15) return say(s, "😴 You are too tired to work. Sleep first.");
      const earned = shiftPay(s);
      let next = passTime(s, c.hours * 60, c.effect);
      if (next.ending) return next;
      next = learn(next, c.skill);
      next = addMood(bump(bump(pay(next, earned), "work"), "earned", earned), "payday");
      const career = { ...s.career, shifts: s.career.shifts + 1 };
      next = { ...next, career, stats: { ...next.stats, shifts: next.stats.shifts + 1 } };
      next = say(next, `💼 Shift done as ${c.levels[s.career.level].title}: +${naira(earned)}`);
      // Promotion?
      const up = c.levels[career.level + 1];
      if (up && career.shifts >= c.shiftsToPromote && meets(next.skills, up.req)) {
        next = {
          ...next,
          career: { id: c.id, level: career.level + 1, shifts: 0 },
          stats: { ...next.stats, promotions: next.stats.promotions + 1 },
        };
        next = addMood(next, "promoted");
        next = say(next, `🎉 PROMOTION! You are now ${up.title}. New pay: ${naira(Math.round(up.pay * payBonus(s.sim.trait)))} per shift.`);
      }
      return next;
    }

    case "travel": {
      const mode = modes.find(m => m.id === cmd.mode);
      if (!mode || cmd.to === s.location) return s;
      const t = trip(s.location, cmd.to, mode, s.time);
      const fare = fareFor(t.cost, s.sim.trait);
      if (s.money < fare) return say(s, `❌ Not enough money for ${mode.label}.`);
      let next = charge(s, fare);
      next = passTime(next, t.minutes, { energy: -t.energy });
      if (next.ending) return next;
      next = bump({ ...next, location: cmd.to, stats: { ...next.stats, trips: next.stats.trips + 1 } }, "travel");
      if (t.rush && (mode.id === "danfo" || mode.id === "keke")) next = addMood(next, "goSlow");
      if (mode.id === "okada") next = addMood(next, "okadaRush");
      if (mode.id === "trek" && distanceKm(s.location, cmd.to) >= 5) next = addMood(next, "longWalk");
      return say(next, `${mode.emoji} ${mode.label} to ${districts[cmd.to].name}: ${t.minutes} min${fare ? `, ${naira(fare)}` : ""}${t.rush ? " — go-slow!" : ""}`);
    }

    case "walk": {
      const spot = spots[cmd.spot];
      if (!spot) return s;
      let next = bump(s, "enter");
      if (cmd.to !== s.location) {
        next = bump({ ...next, location: cmd.to, stats: { ...next.stats, trips: next.stats.trips + 1 } }, "walk");
        next = { ...next, needs: { ...next.needs, energy: Math.max(0, next.needs.energy - 5) } };
      }
      const closed = !spotOpen(cmd.spot, s.time);
      return say(next, cmd.spot === "home"
        ? "🏠 You walked home. Home sweet home."
        : `🚶🏾 You walked to ${spot.emoji} ${spot.name} in ${districts[cmd.to].name}.${closed ? ` It's closed now. ${openText(cmd.spot)}.` : ""}`);
    }

    case "choose": {
      const e = s.eventId ? eventById(s.eventId) : undefined;
      const c = e?.choices[cmd.index];
      if (!e || !c) return { ...s, eventId: null };
      const cost = c.cost ?? 0;
      if (s.money < cost) return say(s, "❌ You can't afford that.");
      const won = c.chance && cmd.roll < c.chance.odds;
      const outcome: Outcome = won && c.chance ? c.chance.win : c;
      let next: GameState = { ...charge(s, cost), eventId: null };
      if (c.sendHome) next = { ...next, stats: { ...next.stats, sentHome: next.stats.sentHome + cost } };
      next = passTime(next, c.minutes ?? 0, outcome.effect ? boosted(outcome.effect, s.sim.trait, false) : undefined);
      next = learn(next, outcome.skill);
      next = pay(next, outcome.gain ?? 0);
      return say(next, `${e.emoji} ${outcome.result}`);
    }

    case "buy": {
      const spec = CATALOG[cmd.item];
      if (!spec) return s;
      const problem = itemBlocker(s, cmd.item);
      if (problem) return say(s, `❌ ${spec.name}: ${problem}`);
      const obj: Placed = { uid: s.home.nextUid, type: cmd.item, x: cmd.x, y: cmd.y, rot: cmd.rot % 4 };
      if (!canPlace(HOME, s.home.objects, obj)) return say(s, `❌ ${spec.name} doesn't fit there.`);
      const next = bump(charge(s, spec.price), "buy");
      return say(
        { ...next, home: { ...next.home, objects: [...next.home.objects, obj], nextUid: obj.uid + 1 } },
        `🛒 Bought: ${spec.name} (${naira(spec.price)})`,
      );
    }

    case "move": {
      const obj = s.home.objects.find(o => o.uid === cmd.uid);
      if (!obj || CATALOG[obj.type].fixed) return s;
      if (s.location !== "mushin") return say(s, "❌ Go home to Mushin to arrange your room.");
      const moved = { ...obj, x: cmd.x, y: cmd.y, rot: cmd.rot % 4 };
      if (!canPlace(HOME, s.home.objects, moved)) return say(s, `❌ ${CATALOG[obj.type].name} doesn't fit there.`);
      return { ...s, home: { ...s.home, objects: s.home.objects.map(o => (o.uid === obj.uid ? moved : o)) } };
    }

    case "sell": {
      const obj = s.home.objects.find(o => o.uid === cmd.uid);
      if (!obj || CATALOG[obj.type].fixed) return s;
      if (s.location !== "mushin") return say(s, "❌ Go home to Mushin to sell furniture.");
      const refund = sellPrice(obj.type);
      return say(
        { ...s, money: s.money + refund, home: { ...s.home, objects: s.home.objects.filter(o => o.uid !== obj.uid) } },
        `💸 Sold ${CATALOG[obj.type].name} for ${naira(refund)}`,
      );
    }

    case "payRent": {
      if (s.rentOwed <= 0) return say(s, "🏠 You don't owe the landlord anything.");
      const amount = Math.min(s.money, s.rentOwed);
      if (amount <= 0) return say(s, "❌ You have no money to give the landlord.");
      let next = { ...charge(s, amount), rentOwed: s.rentOwed - amount };
      if (next.rentOwed <= 0) next = dropMood(next, "rentPressure");
      return say(next, next.rentOwed > 0
        ? `🏠 Paid the landlord ${naira(amount)}. You still owe ${naira(next.rentOwed)}.`
        : `🏠 Paid the landlord ${naira(amount)}. You're all clear!`);
    }

    case "reward": {
      if (!canClaimReward(s)) return say(s, "📺 You already claimed today's reward. Come back tomorrow (in-game).");
      const next = { ...pay(s, AD_REWARD), lastRewardDay: dayOf(s.time) };
      return say(next, `📺 Thanks for watching! +${naira(AD_REWARD)}`);
    }

    case "goal": {
      const g = goalSteps[cmd.id];
      const problem = goalBlocker(s, cmd.id);
      if (problem) return say(s, `❌ ${g.name}: ${problem}`);
      const chance = goalChance(s, cmd.id);
      let next = passTime(charge(s, g.cost), g.minutes, { energy: -15 });
      if (next.ending) return next;
      if (cmd.id === "ielts") {
        return cmd.roll < (chance ?? 0)
          ? say({ ...next, ielts: true }, "📝 IELTS RESULT: PASSED! One step closer to japa.")
          : say(next, "📝 IELTS result: failed. Study more and try again.");
      }
      if (cmd.id === "visa") {
        return cmd.roll < (chance ?? 0)
          ? say({ ...next, visa: true }, "🛂 VISA APPROVED! Book your flight when you're ready.")
          : say(next, "🛂 Visa refused. \"Insufficient ties to home country.\" You can try again.");
      }
      if (cmd.id === "flight") return end(say(next, "✈️ You boarded the plane. JAPA SUCCESSFUL!"), "japa");
      if (cmd.id === "house") return end(say(next, "🏡 You bought your own flat. Landlord wahala is over!"), "landlord");
      return next;
    }
  }
}
