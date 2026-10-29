// People on the pavements say something now and then as you walk past.
// Each passer-by has a persona with their own lines; some lines react to the time of day or to you
// (hungry, tired, broke, doing well). The words live in the translation files as chat.<group>.<n>.
// To add a line: add the text in en.ts, de.ts and pcm.ts and raise the count here.

import type { GameState } from "../engine/game";

export type Persona = "trader" | "okada" | "student" | "pastor" | "mechanic" | "hawker" | "footballer" | "office" | "mama" | "techie";

export const PERSONAS: { id: Persona; emoji: string; lines: number }[] = [
  { id: "trader", emoji: "🧺", lines: 3 },
  { id: "okada", emoji: "🏍️", lines: 3 },
  { id: "student", emoji: "🎒", lines: 3 },
  { id: "pastor", emoji: "📖", lines: 3 },
  { id: "mechanic", emoji: "🔧", lines: 3 },
  { id: "hawker", emoji: "🍌", lines: 3 },
  { id: "footballer", emoji: "⚽", lines: 3 },
  { id: "office", emoji: "💼", lines: 3 },
  { id: "mama", emoji: "👵🏾", lines: 3 },
  { id: "techie", emoji: "💻", lines: 3 },
];

/** Lines that react to the moment, and how many of each. */
export const CONTEXT_LINES = { morning: 2, night: 2, hungry: 2, tired: 2, smelly: 1, broke: 1, rich: 1 } as const;
type Context = keyof typeof CONTEXT_LINES;

function contexts(s: Pick<GameState, "time" | "needs" | "money">): Context[] {
  const h = (s.time % 1440) / 60;
  const out: Context[] = [];
  if (h >= 5 && h < 10) out.push("morning");
  if (h >= 21 || h < 4) out.push("night");
  if (s.needs.hunger < 30) out.push("hungry");
  if (s.needs.energy < 25) out.push("tired");
  if (s.needs.hygiene < 20) out.push("smelly");
  if (s.money < 2_000) out.push("broke");
  if (s.money > 300_000) out.push("rich");
  return out;
}

/** A text key for what this passer-by says right now. `roll` and `pick` are 0–1. */
export function chatterKey(s: Pick<GameState, "time" | "needs" | "money">, persona: Persona, roll: number, pick: number): string {
  const ctx = contexts(s);
  if (ctx.length && roll < 0.4) {
    const c = ctx[Math.floor(pick * ctx.length)];
    return `chat.${c}.${Math.floor(((pick * 7919) % 1) * CONTEXT_LINES[c])}`;
  }
  const p = PERSONAS.find(x => x.id === persona) ?? PERSONAS[0];
  return `chat.${p.id}.${Math.floor(pick * p.lines)}`;
}

/** Every chatter text key (for the translation test). */
export function chatterKeys(): string[] {
  return [
    ...PERSONAS.flatMap(p => [`chat.who.${p.id}`, ...Array.from({ length: p.lines }, (_, i) => `chat.${p.id}.${i}`)]),
    ...(Object.entries(CONTEXT_LINES) as [Context, number][]).flatMap(([c, n]) => Array.from({ length: n }, (_, i) => `chat.${c}.${i}`)),
  ];
}
