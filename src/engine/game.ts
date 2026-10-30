// The whole game's rules live here. No React, no screen code.
// Every change to the game is a Command passed to `reduce`, which returns a NEW state.
// Random numbers come in through the command, so the rules are fully testable.

import { type Needs, startNeeds, decay, apply } from "./needs";
import { updateHealth } from "./health";
import { CLASSIC, RELAXED, isRelaxed } from "../data/survival";
import { RENT, START_MONEY, rentDue, naira } from "./economy";
import { actionById, type Action } from "../data/actions";
import { distanceKm, modes, trip, type DistrictId } from "../data/places";
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
import { spots, spotOpen, type SpotId } from "../data/spots";
import { translate, type Lang } from "../i18n/core";
import { text } from "../i18n/text";
import {
  newDay, phoneStep, startPhone, addRep, bond, BANK_SIZE,
  type Kit, type PhoneCommand, type Txn, type TxnCat, type Holding, type Trade, type ContactState,
  type OpenInvite, type PhoneMsg, type DailyClaim,
} from "./phone";
import type { FundId } from "../data/invest";
import type { OwnedBiz } from "../data/business";
import type { ContactId } from "../data/contacts";
import { REVIVE, type ReviveHow } from "../data/revive";
import { storyFlag } from "./progress";
import { syncStory, storyStep, type StoryCommand, type StoryState } from "./story";

export type EndingKind = "japa" | "landlord" | "evicted" | "collapsed";
export type Ending = { kind: EndingKind; day: number; final?: boolean }; // final: no more revive offer

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
  lang?: Lang;              // language for game messages
  diary?: DiaryEntry[];     // everything that has happened, oldest first (the life story)
  dayStart?: { earned: number; spent: number }; // money at the start of today (for the day summary)
  relaxed?: boolean;        // relaxed survival (default on; false = classic rules). See data/survival.ts
  // ----- the phone (see engine/phone.ts). All optional so older saves still load. -----
  seed?: number;            // makes fund prices, business takings and invitations repeatable for this life
  uidSeq?: number;          // next id for messages and invitations
  bank?: Txn[];             // every naira in or out, oldest first
  rep?: number;             // reputation 0–100
  portfolio?: Partial<Record<FundId, Holding>>;
  trades?: Trade[];
  businesses?: OwnedBiz[];
  contacts?: Partial<Record<ContactId, ContactState>>;
  invites?: OpenInvite[];
  messages?: PhoneMsg[];
  daily?: DailyClaim[];     // daily login rewards credited to this life
  camera?: "top" | "first"; // overhead or first-person view
  revives?: { ad: number; gem: number; refs: string[] }; // times you came back after collapsing (refs: gems used)
  story?: StoryState;       // the story: missions done, choices, flags, career route (see engine/story.ts)
};

export type DiaryEntry = { t: number; line: string };
export const DIARY_SIZE = 500;

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
  | { type: "lang"; lang: Lang }
  | { type: "relaxed"; on: boolean }
  | { type: "choose"; index: number; roll: number }
  | { type: "goal"; id: GoalStepId; roll: number }
  | { type: "reward" }    // the player finished watching a rewarded ad
  | { type: "greet" }     // you answered a passer-by in the streets
  | { type: "revive"; how: ReviveHow; ref?: string } // back from hospital (ref: the server's id for the gem used)
  | { type: "finalize" }  // the player chose to end this life instead of reviving
  | StoryCommand
  | PhoneCommand;

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

export function newGame(sim: Sim, lang: Lang = "en", seed?: number): GameState {
  const first = translate(lang, "log.arrive", { name: sim.name, money: naira(START_MONEY), rent: naira(RENT) });
  return checkStory(startPhone({
    version: 4,
    seed,
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
    log: [first],
    diary: [{ t: 8 * 60, line: first }],
    lang,
    stats: { earned: 0, spent: 0, shifts: 0, trips: 0, events: 0, sentHome: 0, promotions: 0 },
    ending: null,
    home: startHome(),
    power: { grid: true, outageEnds: 0 },
    rentOwed: 0,
    moodlets: [],
    counts: {},
    mission: 0,
    rep: 0,
    bank: [{ t: 8 * 60, amt: START_MONEY, cat: "other", label: translate(lang, "bank.start") }],
    story: { done: [], flags: [], picks: {} },
  }));
}

/** Bring an older save up to date, or return null if it isn't a save at all. */
export function upgrade(data: unknown): GameState | null {
  const d = data as (Omit<Partial<GameState>, "version"> & { version?: number }) | null;
  if (!d || typeof d !== "object" || !d.sim || !d.needs) return null;
  if (d.version === 4 && d.home && d.power) return d.story ? (d as GameState) : checkStory(d as GameState);
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
        notes.push(translate("en", "log.refund", { item: CATALOG[o.type]?.name ?? o.type, money: naira(CATALOG[o.type]?.price ?? 0) }));
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
  const diary = [...(s.diary ?? []), { t: s.time, line }];
  return { ...s, log: [line, ...s.log].slice(0, LOG_SIZE), diary: diary.length > DIARY_SIZE ? diary.slice(-DIARY_SIZE) : diary };
}

/** A game message in the player's language. */
const msg = (s: GameState, key: string, vars?: Record<string, string | number>) => translate(s.lang ?? "en", key, vars);
const tx = (s: GameState) => text(s.lang ?? "en");

function ledger(s: GameState, amt: number, cat: TxnCat, label: string): GameState {
  const bank = [...(s.bank ?? []), { t: s.time, amt: Math.round(amt), cat, label }];
  return { ...s, bank: bank.length > BANK_SIZE ? bank.slice(-BANK_SIZE) : bank };
}

/** Money in that counts as earnings. */
function pay(s: GameState, amount: number, cat: TxnCat = "other", label = ""): GameState {
  if (amount <= 0) return s;
  return ledger({ ...s, money: s.money + amount, stats: { ...s.stats, earned: s.stats.earned + amount } }, amount, cat, label);
}

/** Money out that counts as spending. */
function charge(s: GameState, amount: number, cat: TxnCat = "other", label = ""): GameState {
  if (amount <= 0) return s;
  return ledger({ ...s, money: s.money - amount, stats: { ...s.stats, spent: s.stats.spent + amount } }, -amount, cat, label);
}

/** Money moved in or out that is neither income nor spending (investments, selling things). */
function move(s: GameState, amount: number, cat: TxnCat, label: string): GameState {
  if (!amount) return s;
  return ledger({ ...s, money: s.money + amount }, amount, cat, label);
}

const ACTION_CAT: Record<Action["category"], TxnCat> = {
  food: "food", home: "home", money: "hustle", fun: "social", care: "other", learn: "other", rest: "other", phone: "other",
};

// Reputation for being out and about
const REP_ACTIONS: Record<string, number> = {
  host: 1, gist: 1, worship: 1, networking: 2, mingle: 1, vip: 3, "mama-gist": 1, "call-mummy": 1, meetup: 1, "chopnow-pizza": 1,
};

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
      next = say(addMood(next, "learned"), msg(next, "log.levelUp", { skill: tx(next).skill(id), level: Math.floor(next.skills[id]) }));
    }
  }
  return next;
}

/** Money an action pays you (with your trait bonus). */
export function earnings(s: GameState, a: Action): number {
  const base = a.pay ?? (a.earn ? a.earn.base + a.earn.per * Math.floor(s.skills[a.earn.skill]) : 0);
  return Math.round((base * payBonus(s.sim.trait)) / 50) * 50;
}

// Time passes: needs drain, health changes, rent may be due.
export function passTime(s: GameState, minutes: number, effect?: Partial<Needs>, asleep = false): GameState {
  if (s.ending) return s;
  const time = s.time + minutes;
  const rules = isRelaxed(s) ? RELAXED : CLASSIC;
  const drained = decay(s.needs, minutes, (asleep ? 0.35 : 1) * rules.needDrain);
  let needs = effect ? apply(drained, effect) : drained;
  // Relaxed survival (from Gidi Hustle): an empty bladder means an accident, not a slow death.
  let accident = false;
  if (isRelaxed(s) && needs.bladder <= 0) {
    needs = { ...needs, bladder: 100, hygiene: Math.max(0, needs.hygiene - RELAXED.accidentHygiene) };
    accident = true;
  }
  const health = updateHealth(s.health, s.needs, minutes, needs, rules);
  let next: GameState = runPower({ ...s, time, needs, health }, s.time, time);
  // A new day: write yesterday's summary in the diary
  if (dayOf(time) > dayOf(s.time)) {
    const start = s.dayStart ?? { earned: 0, spent: 0 };
    const line = msg(s, "log.dayEnd", {
      day: dayOf(s.time), earned: naira(next.stats.earned - start.earned), spent: naira(next.stats.spent - start.spent),
    });
    next = { ...next, dayStart: { earned: next.stats.earned, spent: next.stats.spent }, diary: [...(next.diary ?? []), { t: time, line }].slice(-DIARY_SIZE) };
    for (let d = dayOf(s.time) + 1; d <= dayOf(time); d++) next = newDay(next, d, kit);
  }
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
    next = { ...charge(next, paid, "rent", msg(next, "bank.rent")), rentOwed: left };
    if (left === 0) {
      next = dropMood(bump(next, "rentPaid"), "rentPressure");
      next = say(next, owed > RENT ? msg(next, "log.rentArrears", { money: naira(owed) }) : msg(next, "log.rentPaid", { money: naira(RENT) }));
    } else if (left > RENT * (EVICT_AFTER_WEEKS - 1)) {
      next = say(next, msg(next, "log.evicted", { money: naira(left) }));
      return end(next, "evicted");
    } else {
      next = addRep(addMood({ ...next, needs: { ...next.needs, fun: Math.max(0, next.needs.fun - 15) } }, "rentPressure"), -3);
      next = say(next, msg(next, "log.rentShort", { money: naira(left) }));
    }
  }
  if (accident) next = addRep(addMood(say(next, msg(next, "log.accident")), "accident"), -2);
  if (next.health <= 0) {
    next = say(next, msg(next, "log.collapsed"));
    return end(next, "collapsed");
  }
  // Relaxed survival: run out of energy and you fall asleep where you are.
  if (isRelaxed(next) && !asleep && next.needs.energy <= 0) {
    next = say(next, msg(next, "log.passedOut"));
    next = passTime(next, RELAXED.passOutHours * 60, { energy: RELAXED.passOutEnergy }, true);
    if (!next.ending) next = addMood(next, "floorSleeper");
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
    if (next.home.fuel === 0) next = say(next, msg(next, "log.fuelOut"));
  }
  if (to >= s.power.outageEnds) {
    next = say(addMood({ ...next, power: { grid: true, outageEnds: 0 } }, "lightBack"), msg(next, "log.lightBack"));
  }
  return next;
}

// ---------- what the UI can ask about ----------

export const hasItem = (s: GameState, type: FurnitureType) => s.home.objects.some(o => o.type === type);
export const generatorOn = (s: GameState) => !s.power.grid && hasItem(s, "generator") && s.home.fuel > 0;
export const powered = (s: GameState) => s.power.grid || generatorOn(s);

export function canDo(s: GameState, a: Action): string | null {
  const x = tx(s);
  if (a.where !== "any" && a.where !== s.location) return msg(s, "problem.goTo", { place: x.district(a.where) });
  if (!storyFlag(s, a.flag)) return msg(s, "problem.story");
  if (!spotOpen(a.spot, s.time)) return msg(s, "problem.closed", { place: x.spot(a.spot), hours: openHours(s, a.spot) });
  if (a.req && !meets(s.skills, a.req)) return msg(s, "problem.needs", { req: x.req(a.req) });
  if (a.uses && !a.uses.some(t => hasItem(s, t))) {
    return msg(s, "problem.needItem", { items: a.uses.map(t => x.furniture(t)).join(msg(s, "word.or")) });
  }
  if (a.power && !powered(s)) return msg(s, "problem.noLight");
  if (a.food && s.home.food < a.food) return msg(s, "problem.noFood");
  if (s.money < a.cost) return msg(s, "problem.noMoney");
  return null;
}

/** "Open 07:00–21:00" or "Always open", in the player's language. */
export function openHours(s: GameState | { lang?: Lang }, id: SpotId): string {
  const open = spots[id].open;
  const lang = s.lang ?? "en";
  if (!open) return translate(lang, "hours.always");
  const h = (n: number) => `${String(n % 24).padStart(2, "0")}:00`;
  return translate(lang, "hours.open", { from: h(open[0]), to: h(open[1]) });
}

export function itemBlocker(s: GameState, item: FurnitureType): string | null {
  if (s.location !== "mushin") return msg(s, "problem.goHome");
  if (CATALOG[item].fixed) return msg(s, "problem.fixed");
  if (s.money < CATALOG[item].price) return msg(s, "problem.needMoney", { money: naira(CATALOG[item].price) });
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
  if (id === "visa" && !s.ielts) return msg(s, "problem.ieltsFirst");
  if (id === "flight" && !s.visa) return msg(s, "problem.visaFirst");
  if (id === "ielts" && s.ielts) return msg(s, "problem.passed");
  if (id === "visa" && s.visa) return msg(s, "problem.visaDone");
  if (g.where !== "any" && g.where !== s.location) return msg(s, "problem.goTo", { place: tx(s).district(g.where) });
  if (s.money < g.cost) return msg(s, "problem.needMoney", { money: naira(g.cost) });
  if (id === "visa" && s.money - g.cost < PROOF_OF_FUNDS) return msg(s, "problem.proof", { money: naira(PROOF_OF_FUNDS) });
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

/** Can you be brought back from this ending, and how? */
export function canRevive(s: GameState, how: ReviveHow): boolean {
  if (s.ending?.kind !== "collapsed" || s.ending.final) return false;
  return (s.revives?.[how] ?? 0) < REVIVE[how].perLife;
}

/** Wake up in hospital after collapsing. */
function revive(s: GameState, how: ReviveHow, ref?: string): GameState {
  if (!canRevive(s, how)) return s;
  if (how === "gem" && (!ref || s.revives?.refs.includes(ref))) return s; // each gem works once
  const r = REVIVE[how];
  const lift = (v: number) => Math.max(v, r.needsAtLeast);
  const n = s.needs;
  let next: GameState = {
    ...s,
    ending: null,
    eventId: null,
    health: r.health,
    needs: { hunger: lift(n.hunger), energy: lift(n.energy), fun: lift(n.fun), social: lift(n.social), hygiene: lift(n.hygiene), bladder: Math.max(n.bladder, 80) },
    revives: { ad: (s.revives?.ad ?? 0) + (how === "ad" ? 1 : 0), gem: (s.revives?.gem ?? 0) + (how === "gem" ? 1 : 0), refs: [...(s.revives?.refs ?? []), ...(ref ? [ref] : [])].slice(-50) },
  };
  // Hospital time passes like any other time (rent day still comes), then you leave patched up
  next = passTime(next, r.hospitalHours * 60, undefined, true);
  if (next.ending?.kind === "collapsed") next = { ...next, ending: null };
  const m = next.needs;
  next = { ...next, health: Math.max(next.health, r.health), needs: { hunger: lift(m.hunger), energy: lift(m.energy), fun: lift(m.fun), social: lift(m.social), hygiene: lift(m.hygiene), bladder: Math.max(m.bladder, 80) } };
  const bill = Math.min(r.bill, Math.max(0, next.money));
  if (bill > 0) next = charge(next, bill, "other", msg(s, "bank.hospital"));
  return say(bump(next, "revive"), msg(s, how === "gem" ? "log.reviveGem" : "log.reviveAd", { money: naira(bill) }));
}

export function reduce(s: GameState, cmd: Command): GameState {
  if (cmd.type === "revive") return revive(s, cmd.how, cmd.ref);
  if (cmd.type === "finalize") return s.ending ? { ...s, ending: { ...s.ending, final: true } } : s;
  const next = step(s, cmd);
  return next === s ? s : checkStory(next);
}

/** Keep the story up to date: start the next mission, deadlines, daily challenges, the week. */
export const checkStory = (s: GameState): GameState => syncStory(s, kit);

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
        next = say(next, msg(next, generatorOn(next) && next.location === "mushin" ? "log.nepaGen" : "log.nepa"));
      }
      if (!next.ending && next.time - next.lastEventAt >= EVENT_COOLDOWN && cmd.roll < EVENT_CHANCE * (cmd.minutes / 10)) {
        const e = pickEvent(next.location, cmd.pick);
        next = { ...next, eventId: e.id, lastEventAt: next.time, stats: { ...next.stats, events: next.stats.events + 1 } };
      }
      return next;
    }

    case "act": {
      const a = actionById(cmd.id);
      if (!a) return s;
      const problem = canDo(s, a);
      if (problem) return say(s, `❌ ${tx(s).action(a)}: ${problem}`);
      let next = charge(s, a.cost, ACTION_CAT[a.category], tx(s).action(a));
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
      next = bump(bump(learn(next, a.skill), a.id), `at:${a.spot}`);
      if (a.mood) next = addMood(next, a.mood);
      if (REP_ACTIONS[a.id]) next = addRep(next, REP_ACTIONS[a.id]);
      if (a.id === "call-mummy") next = bond(next, "mummy", 4);
      if (a.id === "mama-gist") next = bond(next, "ronke", 4);
      if (a.id === "gist") next = bond(next, "tunde", 2);
      const earned = earnings(s, a);
      if (earned > 0) {
        next = say(bump(pay(next, earned, "hustle", tx(s).action(a)), "earned", earned), `${a.emoji} ${tx(s).action(a)}: +${naira(earned)}`);
      } else {
        next = say(next, `${a.emoji} ${tx(s).action(a)}`);
      }
      return next;
    }

    case "apply": {
      const c = careers[cmd.career];
      const first = c.levels[0];
      if (!storyFlag(s, c.flag) || !storyFlag(s, first.flag)) return say(s, msg(s, "log.jobStory", { job: tx(s).career(c.id), qual: msg(s, `qual.${first.flag ?? c.flag}`) }));
      if (!meets(s.skills, first.req)) return say(s, msg(s, "log.jobNeeds", { job: tx(s).career(c.id), req: tx(s).req(first.req) }));
      if (s.career?.id === c.id) return s;
      return say(bump({ ...s, career: { id: c.id, level: 0, shifts: 0 } }, "apply"), msg(s, "log.hired", { emoji: c.emoji, title: tx(s).title(c.id, 0), place: tx(s).district(c.where) }));
    }

    case "quit": {
      if (!s.career) return s;
      return say({ ...s, career: null }, msg(s, "log.quit"));
    }

    case "work": {
      if (!s.career) return say(s, msg(s, "log.noJob"));
      const c = careers[s.career.id];
      if (s.location !== c.where) return say(s, msg(s, "log.jobFar", { place: tx(s).district(c.where) }));
      if (s.needs.energy < 15) return say(s, msg(s, "log.tooTired"));
      const earned = shiftPay(s);
      let next = passTime(s, c.hours * 60, c.effect);
      if (next.ending) return next;
      next = learn(next, c.skill);
      next = addMood(bump(bump(pay(next, earned, "work", tx(s).title(c.id, s.career.level)), "work"), "earned", earned), "payday");
      const career = { ...s.career, shifts: s.career.shifts + 1 };
      next = { ...next, career, stats: { ...next.stats, shifts: next.stats.shifts + 1 } };
      next = say(next, msg(s, "log.shift", { title: tx(s).title(c.id, s.career.level), money: naira(earned) }));
      // Promotion?
      const up = c.levels[career.level + 1];
      if (up && career.shifts >= c.shiftsToPromote && meets(next.skills, up.req) && storyFlag(next, up.flag)) {
        next = {
          ...next,
          career: { id: c.id, level: career.level + 1, shifts: 0 },
          stats: { ...next.stats, promotions: next.stats.promotions + 1 },
        };
        next = addRep(addMood(next, "promoted"), 3);
        next = say(next, msg(s, "log.promo", { title: tx(s).title(c.id, career.level + 1), money: naira(Math.round(up.pay * payBonus(s.sim.trait))) }));
      }
      return next;
    }

    case "travel": {
      const mode = modes.find(m => m.id === cmd.mode);
      if (!mode || cmd.to === s.location) return s;
      const t = trip(s.location, cmd.to, mode, s.time);
      const fare = fareFor(t.cost, s.sim.trait);
      if (s.money < fare) return say(s, msg(s, "log.fare", { mode: tx(s).mode(mode.id) }));
      let next = charge(s, fare, "transport", `${tx(s).mode(mode.id)} → ${tx(s).district(cmd.to)}`);
      next = passTime(next, t.minutes, { energy: -t.energy });
      if (next.ending) return next;
      next = bump({ ...next, location: cmd.to, stats: { ...next.stats, trips: next.stats.trips + 1 } }, "travel");
      if (t.rush && (mode.id === "danfo" || mode.id === "keke")) next = addMood(next, "goSlow");
      if (mode.id === "okada") next = addMood(next, "okadaRush");
      if (mode.id === "trek" && distanceKm(s.location, cmd.to) >= 5) next = addMood(next, "longWalk");
      return say(next, msg(s, "log.trip", { emoji: mode.emoji, mode: tx(s).mode(mode.id), place: tx(s).district(cmd.to), minutes: t.minutes })
        + (fare ? `, ${naira(fare)}` : "") + (t.rush ? msg(s, "log.goSlow") : ""));
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
        ? msg(s, "log.walkHome")
        : msg(s, "log.walk", { emoji: spot.emoji, place: tx(s).spot(cmd.spot), district: tx(s).district(cmd.to) })
          + (closed ? " " + msg(s, "log.walkClosed", { hours: openHours(s, cmd.spot) }) : ""));
    }

    case "lang": {
      return { ...s, lang: cmd.lang };
    }

    case "relaxed": {
      return { ...s, relaxed: cmd.on };
    }

    case "greet": {
      // A quick chat with a passer-by: a little social, sometimes a bit of reputation
      const next = bump(passTime(s, 2, { social: 4, fun: 1 }), "greet");
      if (next.ending) return next;
      return say((next.counts.greet ?? 0) % 5 === 0 ? addRep(next, 1) : next, msg(s, "log.greet"));
    }

    case "choose": {
      const e = s.eventId ? eventById(s.eventId) : undefined;
      const c = e?.choices[cmd.index];
      if (!e || !c) return { ...s, eventId: null };
      const cost = c.cost ?? 0;
      if (s.money < cost) return say(s, msg(s, "log.cantAfford"));
      const won = c.chance && cmd.roll < c.chance.odds;
      const outcome: Outcome = won && c.chance ? c.chance.win : c;
      let next: GameState = { ...charge(s, cost, c.sendHome ? "family" : "event", tx(s).event(e).title), eventId: null };
      if (c.sendHome) next = { ...next, stats: { ...next.stats, sentHome: next.stats.sentHome + cost } };
      next = passTime(next, c.minutes ?? 0, outcome.effect ? boosted(outcome.effect, s.sim.trait, false) : undefined);
      next = learn(next, outcome.skill);
      next = pay(next, outcome.gain ?? 0, "event", tx(s).event(e).title);
      return say(next, `${e.emoji} ${tx(s).event(e).result(cmd.index, !!won)}`);
    }

    case "buy": {
      const spec = CATALOG[cmd.item];
      if (!spec) return s;
      const problem = itemBlocker(s, cmd.item);
      if (problem) return say(s, `❌ ${tx(s).furniture(cmd.item)}: ${problem}`);
      const obj: Placed = { uid: s.home.nextUid, type: cmd.item, x: cmd.x, y: cmd.y, rot: cmd.rot % 4 };
      if (!canPlace(HOME, s.home.objects, obj)) return say(s, msg(s, "log.noFit", { item: tx(s).furniture(cmd.item) }));
      const next = bump(charge(s, spec.price, "home", tx(s).furniture(cmd.item)), "buy");
      return say(
        { ...next, home: { ...next.home, objects: [...next.home.objects, obj], nextUid: obj.uid + 1 } },
        msg(s, "log.bought", { item: tx(s).furniture(cmd.item), money: naira(spec.price) }),
      );
    }

    case "move": {
      const obj = s.home.objects.find(o => o.uid === cmd.uid);
      if (!obj || CATALOG[obj.type].fixed) return s;
      if (s.location !== "mushin") return say(s, `❌ ${msg(s, "problem.goHome")}`);
      const moved = { ...obj, x: cmd.x, y: cmd.y, rot: cmd.rot % 4 };
      if (!canPlace(HOME, s.home.objects, moved)) return say(s, msg(s, "log.noFit", { item: tx(s).furniture(obj.type) }));
      return { ...s, home: { ...s.home, objects: s.home.objects.map(o => (o.uid === obj.uid ? moved : o)) } };
    }

    case "sell": {
      const obj = s.home.objects.find(o => o.uid === cmd.uid);
      if (!obj || CATALOG[obj.type].fixed) return s;
      if (s.location !== "mushin") return say(s, msg(s, "log.goHomeSell"));
      const refund = sellPrice(obj.type);
      return say(
        move({ ...s, home: { ...s.home, objects: s.home.objects.filter(o => o.uid !== obj.uid) } }, refund, "home", tx(s).furniture(obj.type)),
        msg(s, "log.sold", { item: tx(s).furniture(obj.type), money: naira(refund) }),
      );
    }

    case "payRent": {
      if (s.rentOwed <= 0) return say(s, msg(s, "log.noOwe"));
      const amount = Math.min(s.money, s.rentOwed);
      if (amount <= 0) return say(s, msg(s, "log.noMoneyRent"));
      let next = { ...charge(s, amount, "rent", msg(s, "bank.rent")), rentOwed: s.rentOwed - amount };
      if (next.rentOwed <= 0) next = dropMood(next, "rentPressure");
      return say(next, next.rentOwed > 0
        ? msg(s, "log.paidPart", { money: naira(amount), left: naira(next.rentOwed) })
        : msg(s, "log.paidAll", { money: naira(amount) }));
    }

    case "reward": {
      if (!canClaimReward(s)) return say(s, msg(s, "log.adDone"));
      const next = { ...pay(s, AD_REWARD, "reward", msg(s, "bank.ad")), lastRewardDay: dayOf(s.time) };
      return say(next, msg(s, "log.ad", { money: naira(AD_REWARD) }));
    }

    case "goal": {
      const g = goalSteps[cmd.id];
      const problem = goalBlocker(s, cmd.id);
      if (problem) return say(s, `❌ ${tx(s).goal(cmd.id).name}: ${problem}`);
      const chance = goalChance(s, cmd.id);
      let next = passTime(charge(s, g.cost, "goals", tx(s).goal(cmd.id).name), g.minutes, { energy: -15 });
      if (next.ending) return next;
      if (cmd.id === "ielts") {
        return cmd.roll < (chance ?? 0)
          ? say({ ...next, ielts: true }, msg(s, "log.ieltsPass"))
          : say(next, msg(s, "log.ieltsFail"));
      }
      if (cmd.id === "visa") {
        return cmd.roll < (chance ?? 0)
          ? say({ ...next, visa: true }, msg(s, "log.visaPass"))
          : say(next, msg(s, "log.visaFail"));
      }
      if (cmd.id === "flight") return end(say(next, msg(s, "log.japa")), "japa");
      if (cmd.id === "house") return end(say(next, msg(s, "log.landlord")), "landlord");
      return next;
    }

    case "revive":
    case "finalize":
      return s; // handled in reduce(), since they work on an ended life

    case "story":
      return storyStep(s, cmd, kit);

    default:
      // Everything on the phone (bank, invest, business, contacts, invites, messages, daily rewards, camera)
      return phoneStep(s, cmd, kit);
  }
}

/** The helpers the phone module uses (passed in to avoid a circular import). */
const kit: Kit = { say, msg, pay, charge, move, passTime, learn, addMood, bump, money: naira };
