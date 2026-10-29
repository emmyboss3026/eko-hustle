// Past lives: a short record of every finished game, kept on this device.
import type { GameState } from "../engine/game";

export type Life = {
  id: string;
  name: string;
  avatar: string;
  preset?: string;
  ending: string;   // japa, landlord, evicted, collapsed
  day: number;
  earned: number;
  money: number;
  finishedAt: string; // ISO date
};

const KEY = "eko-hustle-lives";
const MAX = 30;

export function loadLives(): Life[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Remember a finished life (once). */
export function recordLife(s: GameState) {
  if (!s.ending) return;
  const id = `${s.sim.name}|${s.ending.day}|${s.stats.earned}`;
  const lives = loadLives();
  if (lives.some(l => l.id === id)) return;
  const life: Life = {
    id, name: s.sim.name, avatar: s.sim.avatar, preset: s.sim.preset, ending: s.ending.kind,
    day: s.ending.day, earned: s.stats.earned, money: s.money, finishedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify([life, ...lives].slice(0, MAX)));
  } catch {
    // storage full or blocked: not kept
  }
}
