// Missions: a step-by-step path through the game. One mission at a time, in order.
// Each mission says exactly which tab to open and which button to tap,
// and pays a small reward when it's done. Add or reorder missions freely.

import type { GameState } from "../engine/game";
import type { FurnitureType } from "./home";
import type { SpotId } from "./spots";
import { MAX_SKILL } from "./skills";

export type TabId = "home" | "do" | "go" | "work" | "goals" | "me";

export type Mission = {
  id: string;
  emoji: string;
  title: string;
  goal: string;        // one short line: what to do
  steps: string[];     // how to do it, tap by tap
  tab: TabId;          // the tab the first step is on (it gets a 🎯 tag)
  actions?: string[];  // actions that count (they get a 🎯 tag)
  spot?: SpotId;       // the place to go (it gets a 🎯 tag)
  furniture?: FurnitureType; // the furniture to tap (it gets a 🎯 tag)
  reward: number;
  done: (s: GameState) => boolean;
};

const count = (s: GameState, key: string) => s.counts?.[key] ?? 0;
const did = (s: GameState, ...keys: string[]) => keys.some(k => count(s, k) > 0);

export const missions: Mission[] = [
  {
    id: "bath", emoji: "🪣", title: "Freshen up", goal: "Take a bucket bath at home.",
    steps: [
      "Be at home in Mushin: your flat fills the screen.",
      "Tap the blue bucket in the bathroom (top right of the flat). Or tap 👉 Show me.",
      "Tap 🪣 Bucket bath.",
    ],
    tab: "home", furniture: "bucket", actions: ["bath", "shower"], reward: 500,
    done: s => did(s, "bath", "shower", "gym-shower"),
  },
  {
    id: "cook", emoji: "🍳", title: "Cook your first meal", goal: "Cook egusi on your gas burner.",
    steps: [
      "At home, tap the gas burner in the kitchen (top left of the flat). Or tap 👉 Show me.",
      "Tap 🍳 Cook egusi. It uses 1 meal pack (you start with 3).",
    ],
    tab: "home", furniture: "burner", actions: ["cook"], reward: 500,
    done: s => did(s, "cook"),
  },
  {
    id: "first-naira", emoji: "💰", title: "Make your first naira", goal: "Earn money from a side hustle.",
    steps: [
      "Tap 📍 Places at the bottom of the screen.",
      "Scroll down to 📱 Your phone.",
      "Tap 💬 WhatsApp hustle. Buttons that earn money have a 💰 tag.",
    ],
    tab: "do", spot: "phone", actions: ["whatsapp-hustle", "market-trade", "carry-loads", "buka-help"], reward: 1_000,
    done: s => count(s, "earned") > 0,
  },
  {
    id: "groceries", emoji: "🧺", title: "Fill the kitchen", goal: "Buy groceries so you can keep cooking.",
    steps: [
      "Tap 📍 Places at the bottom.",
      "Find 🧺 Oja Tuntun Market (open 06:00–19:00).",
      "Tap 🧺 Buy groceries. Too late? Order delivery from 📱 Your phone instead (it costs more).",
    ],
    tab: "do", spot: "market", actions: ["groceries", "order-groceries"], reward: 500,
    done: s => did(s, "groceries", "order-groceries"),
  },
  {
    id: "job", emoji: "📋", title: "Get a job", goal: "Apply for any job.",
    steps: [
      "Tap 💼 Jobs at the bottom.",
      "Pick a job that doesn't show 🔒. POS business is the easiest start.",
      "Tap Apply.",
    ],
    tab: "work", reward: 1_000,
    done: s => did(s, "apply") || s.career !== null,
  },
  {
    id: "ride", emoji: "🚌", title: "Take a ride", goal: "Travel to another part of Lagos.",
    steps: [
      "Tap 🚌 Travel at the bottom.",
      "Pick where to go. POS and okada jobs are in Yaba.",
      "Tap a ride: 🚌 Danfo is cheap, 🏍️ Okada is fast, 🚶 Trek is free but slow.",
    ],
    tab: "go", reward: 500,
    done: s => did(s, "travel", "walk"),
  },
  {
    id: "shift", emoji: "💼", title: "Work your first shift", goal: "Go to your job and work one shift.",
    steps: [
      "Tap 💼 Jobs to see where your job is.",
      "Go there with 🚌 Travel if you're not there yet.",
      "Tap the big 💼 Go to work button. You need ⚡ Energy above 15, so sleep first if you're tired.",
    ],
    tab: "work", reward: 1_500,
    done: s => count(s, "work") > 0,
  },
  {
    id: "streets", emoji: "🚶🏾", title: "Walk the streets", goal: "Walk around town in 3D and go into a place.",
    steps: [
      "Tap the 🚶🏾 Walk outside button (bottom right).",
      "Walk with the thumbstick or arrow keys, or just tap a building. 📍 Where to? walks you there.",
      "At a door, tap 🚪 Go into…",
    ],
    tab: "go", reward: 1_000,
    done: s => did(s, "enter"),
  },
  {
    id: "skill", emoji: "📈", title: "Learn a skill", goal: "Reach level 1 in any skill.",
    steps: [
      "Tap 📍 Places and look for the 📈 tag: those actions train a skill.",
      "Good starters: 📖 Study at the library (Yaba), 🏃🏾 Jog round the park (Mushin), 🍲 Help in the kitchen (Buka).",
      "Check your levels in 👤 Me.",
    ],
    tab: "do", reward: 1_500,
    done: s => Object.values(s.skills).some(v => v >= 1),
  },
  {
    id: "furniture", emoji: "🛒", title: "Make it home", goal: "Buy a piece of furniture.",
    steps: [
      "Be at home in Mushin and tap 🛒 Shop at the bottom.",
      "Pick something. 📻 Radio (₦8,000) is cheap.",
      "Tap the floor where it should go, then tap Buy.",
    ],
    tab: "home", reward: 2_000,
    done: s => did(s, "buy"),
  },
  {
    id: "rent", emoji: "🏠", title: "Pay your rent", goal: "Have ₦15,000 ready when rent day comes.",
    steps: [
      "The top bar shows \"Rent in X days\". Rent comes out by itself on rent day.",
      "Keep at least ₦15,000 by then. Work and hustle to get it.",
      "Short? You'll owe the landlord. Tap Pay on the red bar to clear it, or you'll be evicted next rent day.",
    ],
    tab: "work", reward: 2_000,
    done: s => did(s, "rentPaid"),
  },
  {
    id: "promotion", emoji: "🎉", title: "Get promoted", goal: "Earn your first promotion.",
    steps: [
      "Tap 💼 Jobs to see what your next promotion needs: a number of shifts and a skill level.",
      "Keep working shifts.",
      "Train the skill it asks for (look for 📈 in 📍 Places).",
    ],
    tab: "work", reward: 5_000,
    done: s => s.stats.promotions > 0,
  },
  {
    id: "generator", emoji: "⚡", title: "Beat NEPA", goal: "Own a generator so power cuts don't stop you.",
    steps: [
      "Save ₦120,000.",
      "At home, tap 🛒 Shop → ⚡ Small generator.",
      "Buy fuel: 📍 Places → 📱 Your phone → ⛽ Buy generator fuel.",
    ],
    tab: "home", reward: 5_000,
    done: s => s.home.objects.some(o => o.type === "generator"),
  },
  {
    id: "savings", emoji: "🏦", title: "Save ₦300,000", goal: "Build up savings for your big dream.",
    steps: [
      "Work shifts and side hustles, and spend carefully.",
      "Better jobs pay much more: check 💼 Jobs for what they need.",
      "Tap ✈️ Goals to see what your dream costs.",
    ],
    tab: "goals", reward: 10_000,
    done: s => s.money >= 300_000,
  },
  {
    id: "dream", emoji: "✈️", title: "Live your dream", goal: "Japa abroad, or buy your own flat.",
    steps: [
      "Tap ✈️ Goals.",
      "Japa: pass IELTS in Yaba, get a visa on the Island, then fly from Ikeja.",
      "Or stay: save ₦1.5 million and buy a flat on the Island.",
    ],
    tab: "goals", reward: 0,
    done: s => s.ending?.kind === "japa" || s.ending?.kind === "landlord",
  },
];

export const currentMission = (s: GameState): Mission | null => missions[s.mission ?? 0] ?? null;

/** Is this action, place, tab or furniture part of the current mission? (for 🎯 tags) */
export function missionTags(s: GameState) {
  const m = currentMission(s);
  return {
    tab: m?.tab ?? null,
    actions: new Set(m?.actions ?? []),
    spot: m?.spot ?? null,
    furniture: m?.furniture ?? null,
  };
}

export const skillCap = MAX_SKILL;
