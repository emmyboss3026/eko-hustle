import type { Needs } from "../engine/needs";
import type { DistrictId } from "./places";
import type { Skills } from "./skills";

export type Outcome = {
  result: string;
  gain?: number;
  effect?: Partial<Needs>;
  skill?: Partial<Skills>;
};

export type Choice = Outcome & {
  label: string;
  cost?: number;
  minutes?: number;
  sendHome?: boolean;                  // counts as money sent to family
  chance?: { odds: number; win: Outcome }; // a gamble: with `odds` probability you get `win` instead
};

export type GameEvent = {
  id: string;
  emoji: string;
  title: string;
  text: string;
  where: DistrictId | "any";
  choices: Choice[];
};

// Chance per clock tick (10 in-game minutes). 0.02 ≈ one event every 8 in-game hours.
export const EVENT_CHANCE = 0.02;
// Never two events closer than this (in-game minutes)
export const EVENT_COOLDOWN = 240;

export const events: GameEvent[] = [
  {
    id: "cousin", emoji: "📱", title: "Family call", where: "any",
    text: "Your cousin calls: \"Abeg, send me ₦2,000 for school fees.\"",
    choices: [
      { label: "Send ₦2,000", cost: 2_000, sendHome: true, result: "Your cousin is grateful. Family is family.", effect: { social: 20, fun: 5 } },
      { label: "Pretend the network is bad", result: "You hang up. You feel a bit guilty.", effect: { social: -15, fun: -5 } },
    ],
  },
  {
    id: "mum", emoji: "👵🏾", title: "Mama on the line", where: "any",
    text: "Your mum calls to pray for you and ask when you're coming home.",
    choices: [
      { label: "Send her ₦5,000 for foodstuff", cost: 5_000, sendHome: true, result: "She prays for you for ten whole minutes. You feel blessed.", effect: { social: 30, fun: 15 } },
      { label: "Just talk for a while (30 min)", minutes: 30, result: "Her voice makes you smile.", effect: { social: 20, fun: 10 } },
    ],
  },
  {
    id: "nepa-bill", emoji: "🧾", title: "Estimated bill", where: "mushin",
    text: "The NEPA man is at the gate with an \"estimated\" bill for light you barely saw.",
    choices: [
      { label: "Just pay ₦3,000", cost: 3_000, result: "He leaves smiling. You don't.", effect: { fun: -5 } },
      {
        label: "Argue it down", minutes: 30, result: "He won't budge and calls you stubborn. Your evening is spoiled.", effect: { fun: -15 },
        chance: { odds: 0.5, win: { result: "You talk him down to nothing. Neighbours clap for you.", effect: { fun: 15, social: 10 }, skill: { charisma: 0.2 } } },
      },
    ],
  },
  {
    id: "landlord-levy", emoji: "🏠", title: "Landlord wahala", where: "mushin",
    text: "Your landlord knocks: \"Everybody must pay ₦3,000 development levy.\"",
    choices: [
      { label: "Pay ₦3,000", cost: 3_000, result: "He nods and leaves. Peace for now." },
      { label: "Argue with him (30 min)", minutes: 30, result: "He grumbles but lets it go… this time.", effect: { fun: -15, social: -10 }, skill: { charisma: 0.1 } },
    ],
  },
  {
    id: "found-money", emoji: "💵", title: "Lucky find", where: "any",
    text: "You spot a ₦1,000 note on the ground.",
    choices: [
      { label: "Pocket it", gain: 1_000, result: "Your lucky day!", effect: { fun: 5 } },
      { label: "Give it to the mallam nearby", result: "He blesses you. You feel good.", effect: { social: 15, fun: 10 } },
    ],
  },
  {
    id: "agbero", emoji: "🚧", title: "Agbero!", where: "yaba",
    text: "An agbero blocks your path: \"Owo da? Pay your levy!\"",
    choices: [
      { label: "Pay ₦500", cost: 500, result: "He waves you through." },
      { label: "Argue with him (30 min)", minutes: 30, result: "Thirty minutes of shouting later, you escape. Exhausting.", effect: { energy: -15, fun: -10 } },
    ],
  },
  {
    id: "checkpoint", emoji: "🚓", title: "Checkpoint", where: "any",
    text: "Police at a checkpoint: \"Where your papers? Wetin you carry?\"",
    choices: [
      { label: "\"Find something for the boys\" (₦1,000)", cost: 1_000, result: "They wave you on." },
      { label: "Stay calm and show your ID (40 min)", minutes: 40, result: "After a long talk, they let you go.", effect: { fun: -10 }, skill: { charisma: 0.1 } },
    ],
  },
  {
    id: "rain", emoji: "🌧️", title: "Heavy rain", where: "any",
    text: "The sky opens. The road is flooding.",
    choices: [
      { label: "Wait under a shed (2 h)", minutes: 120, result: "The rain finally stops.", effect: { fun: -5 } },
      { label: "Wade through the flood", result: "You make it, but you are soaked and dirty.", effect: { hygiene: -40 } },
    ],
  },
  {
    id: "fuel", emoji: "⛽", title: "Fuel scarcity", where: "any",
    text: "No fuel anywhere. Your neighbour sells black-market petrol for your gen.",
    choices: [
      { label: "Buy from him (₦3,000)", cost: 3_000, result: "Expensive, but your phone stays charged.", effect: { fun: 5 } },
      { label: "Queue at the filling station (3 h)", minutes: 180, result: "Three hours later, you finally buy fuel at normal price.", cost: 1_000, effect: { energy: -15, fun: -15, social: 10 } },
    ],
  },
  {
    id: "phone", emoji: "📵", title: "Cracked screen", where: "any",
    text: "Your phone slips and the screen cracks.",
    choices: [
      { label: "Fix it at the computer village (₦8,000)", cost: 8_000, result: "Good as new." },
      { label: "Live with it", result: "Every message now looks like a spider web.", effect: { fun: -15 } },
    ],
  },
  {
    id: "investment", emoji: "📈", title: "Business proposal", where: "any",
    text: "Your friend Tunde wants ₦10,000 for his new shawarma stand. \"I go pay you back double!\"",
    choices: [
      {
        label: "Invest ₦10,000", cost: 10_000,
        result: "The stand closed after one week. Your money don waka.", effect: { fun: -20 },
        chance: { odds: 0.45, win: { result: "The shawarma is a hit! Tunde pays you ₦22,000.", gain: 22_000, effect: { fun: 25 }, skill: { hustle: 0.3 } } },
      },
      { label: "Politely say no", result: "Tunde is disappointed but understands.", effect: { social: -5 } },
    ],
  },
  {
    id: "remote-gig", emoji: "💻", title: "DM from a recruiter", where: "any",
    text: "A recruiter offers a quick remote gig: fix a website by tonight.",
    choices: [
      {
        label: "Take it (4 h)", minutes: 240,
        result: "You couldn't fix the bug in time. No pay, just stress.", effect: { energy: -25, fun: -20 }, skill: { study: 0.2 },
        chance: { odds: 0.55, win: { result: "Client is happy! ₦15,000 lands in your account.", gain: 15_000, effect: { energy: -25, fun: 15 }, skill: { study: 0.3 } } },
      },
      { label: "Ignore it", result: "Maybe next time." },
    ],
  },
  {
    id: "owambe", emoji: "🎉", title: "Owambe invitation", where: "island",
    text: "Someone invites you to an owambe party nearby!",
    choices: [
      { label: "Go and dance (3 h)", minutes: 180, result: "Jollof, music and new friends. What a night!", effect: { fun: 40, social: 35, hunger: 30, energy: -20 }, skill: { charisma: 0.3 } },
      { label: "Politely decline", result: "Maybe next time." },
    ],
  },
  {
    id: "match", emoji: "⚽", title: "Big match tonight", where: "yaba",
    text: "Super Eagles are playing. The viewing centre is packed.",
    choices: [
      { label: "Watch with the crowd (₦300, 2 h)", cost: 300, minutes: 120, result: "GOAL! The whole street shouts together.", effect: { fun: 40, social: 30 } },
      { label: "Skip it", result: "You hear the screams from far away." },
    ],
  },
];

export function eventById(id: string) {
  return events.find(e => e.id === id);
}

// Pick a random event that can happen where the Sim is. `pick` is a random number in [0, 1).
export function pickEvent(location: DistrictId, pick: number): GameEvent {
  const possible = events.filter(e => e.where === "any" || e.where === location);
  return possible[Math.floor(pick * possible.length) % possible.length];
}
