// Which sound effect goes with each thing you do. Unknown actions get a soft "pop".

import type { Action } from "./actions";
import type { Sfx } from "../lib/audio";

const BY_ID: Record<string, Sfx> = {
  cook: "sizzle", "buka-help": "sizzle", suya: "sizzle", seafood: "sizzle", "mamaput-rice": "munch",
  snack: "munch", "small-chops": "munch", "puff-puff": "munch", "meat-pie": "munch", amala: "munch",
  sleep: "snore", "sleep-bed": "snore", nap: "snore", "floor-sleep": "snore", "hotel-nap": "snore",
  bath: "splash", shower: "shower", "gym-shower": "shower", swim: "splash", "pure-water": "pop",
  toilet: "flush", "buka-toilet": "flush", "hub-toilet": "flush", "club-toilet": "flush", "public-toilet": "flush",
  tv: "tv", nollywood: "tv", radio: "radio", scroll: "type", "whatsapp-hustle": "type", "remote-gig": "type",
  "learn-code": "type", bootcamp: "type", sprint: "type", "phone-course": "type", "read-book": "page", library: "page",
  "call-mummy": "ring", gist: "chat", "mama-gist": "chat", mingle: "chat", networking: "chat", meetup: "chat", host: "chat",
  football: "whistle", "beach-ball": "whistle", draughts: "pop", dance: "beat", vip: "beat", aerobics: "beat",
  gym: "gym", "home-workout": "gym", jog: "step", "carry-loads": "gym",
  worship: "chime", "practise-speech": "chat", plant: "splash",
  "order-groceries": "ping", "chopnow-jollof": "ping", "chopnow-pizza": "ping", fuel: "cash",
  groceries: "cash", "market-trade": "cash", haggle: "chat", "computer-village": "cash",
};

const BY_CATEGORY: Partial<Record<Action["category"], Sfx>> = {
  food: "munch", rest: "snore", care: "splash", fun: "pop", learn: "page", money: "cash", phone: "ping", home: "cash",
};

export const soundForAction = (a: Pick<Action, "id" | "category">): Sfx => BY_ID[a.id] ?? BY_CATEGORY[a.category] ?? "pop";
