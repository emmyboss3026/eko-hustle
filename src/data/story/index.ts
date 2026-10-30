// All missions in story order, plus daily challenges and weekly events.
// The order of this list IS the story: a route's missions sit between the shared ones.

import type { StoryMission, Task } from "./types";
import { ch01 } from "./ch01";
import { ch02 } from "./ch02";
import { ch03 } from "./ch03";
import { ch04 } from "./ch04";
import { ch05 } from "./ch05";
import { ch06 } from "./ch06";
import { ch07 } from "./ch07";
import { ch08 } from "./ch08";
import { ch09 } from "./ch09";
import { ch10 } from "./ch10";
import { sides } from "./sides";

export const STORY: StoryMission[] = [...ch01, ...ch02, ...ch03, ...ch04, ...ch05, ...ch06, ...ch07, ...ch08, ...ch09, ...ch10, ...sides];

const byId = new Map(STORY.map(m => [m.id, m]));
export const storyById = (id: string) => byId.get(id);

/** Three of these each game day. Small, quick, and never required. */
export type Challenge = { id: string; emoji: string; title: string; task: Task; money: number; xp: number };

export const CHALLENGES: Challenge[] = [
  { id: "shift", emoji: "💼", title: "Work a shift", task: { count: "work", n: 1 }, money: 2_000, xp: 30 },
  { id: "cook", emoji: "🍳", title: "Cook at home twice", task: { do: "cook", n: 2 }, money: 1_500, xp: 20 },
  { id: "call", emoji: "📞", title: "Call someone you care about", task: { count: "call", n: 1 }, money: 1_000, xp: 20 },
  { id: "ride", emoji: "🚌", title: "Take two trips", task: { count: "travel|walk", n: 2 }, money: 1_000, xp: 20 },
  { id: "earn", emoji: "💰", title: "Earn ₦10,000 today", task: { count: "earned", n: 10_000 }, money: 2_500, xp: 40 },
  { id: "workout", emoji: "🏃🏾", title: "Get some exercise", task: { do: "gym|jog|home-workout|aerobics|football", n: 1 }, money: 1_500, xp: 25 },
  { id: "study", emoji: "📚", title: "Study for a while", task: { do: "library|bootcamp|lecture|study-hall|read-book|phone-course|learn-code|read-cases", n: 1 }, money: 1_500, xp: 25 },
  { id: "greet", emoji: "👋🏾", title: "Greet 3 people in the street", task: { count: "greet", n: 3 }, money: 1_000, xp: 20 },
  { id: "invite", emoji: "💌", title: "Accept an invitation", task: { count: "invite", n: 1 }, money: 1_500, xp: 25 },
  { id: "market", emoji: "🧺", title: "Trade at the market", task: { do: "market-trade|haggle|groceries", n: 1 }, money: 1_000, xp: 20 },
  { id: "buka", emoji: "🍛", title: "Eat at Mama Ronke's", task: { do: "amala|small-chops|mama-gist", n: 1 }, money: 1_000, xp: 15 },
  { id: "clean", emoji: "🛁", title: "Stay fresh: bath or shower", task: { do: "bath|shower|gym-shower", n: 1 }, money: 800, xp: 15 },
  { id: "hustle", emoji: "📱", title: "Do two side hustles", task: { do: "whatsapp-hustle|market-trade|carry-loads|buka-help|computer-village|shoot-content|usher", n: 2 }, money: 2_000, xp: 30 },
  { id: "family", emoji: "👵🏾", title: "Call Mummy", task: { do: "call-mummy", n: 1 }, money: 1_000, xp: 15 },
  { id: "help", emoji: "🤝🏾", title: "Help out in the community", task: { do: "community-clean|volunteer|legal-clinic|help-jide", n: 1 }, money: 2_000, xp: 35 },
  { id: "fun", emoji: "🎉", title: "Have some fun", task: { do: "dance|beach|attend-event|draughts|football|nollywood|tv|milkshake", n: 1 }, money: 1_000, xp: 15 },
];

/** One of these each game week: a theme with a bigger goal. */
export type WeekEvent = { id: string; emoji: string; title: string; desc: string; task: Task; money: number; xp: number; rep: number };

export const WEEKS: WeekEvent[] = [
  { id: "market", emoji: "🧺", title: "Market Week", desc: "Traders are out in force at Oja Tuntun. Buy, sell and haggle.", task: { do: "market-trade|haggle", n: 5 }, money: 15_000, xp: 120, rep: 2 },
  { id: "tech", emoji: "💻", title: "Lagos Tech Week", desc: "Meetups and classes all over Yaba. Learn something new.", task: { do: "bootcamp|meetup|learn-code|lecture", n: 4 }, money: 20_000, xp: 150, rep: 2 },
  { id: "owambe", emoji: "🎉", title: "Owambe Season", desc: "Every weekend there's a party. Show your face.", task: { count: "invite", n: 2 }, money: 15_000, xp: 120, rep: 3 },
  { id: "health", emoji: "💪🏾", title: "Fit Fam Week", desc: "The whole city is jogging. Join in.", task: { do: "gym|jog|aerobics|home-workout|football|swim", n: 5 }, money: 15_000, xp: 120, rep: 1 },
  { id: "clean", emoji: "🧹", title: "Clean Streets Week", desc: "The community wants clean gutters before the rains.", task: { do: "community-clean|volunteer|help-jide", n: 2 }, money: 12_000, xp: 130, rep: 4 },
  { id: "family", emoji: "👨‍👩‍👧", title: "Family Week", desc: "Mummy says nobody calls her. Prove her wrong.", task: { count: "call", n: 4 }, money: 10_000, xp: 100, rep: 2 },
  { id: "hustle", emoji: "💰", title: "Hustle Week", desc: "Rent is coming and prices are rising. Make it count.", task: { count: "earned", n: 60_000 }, money: 25_000, xp: 150, rep: 1 },
  { id: "detty", emoji: "🪩", title: "Detty Weekend", desc: "Concerts, beach parties and late nights. Enjoy yourself.", task: { do: "dance|beach|attend-event|mingle|seafood", n: 3 }, money: 12_000, xp: 100, rep: 2 },
];
