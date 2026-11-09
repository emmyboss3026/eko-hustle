// Past lives: a short record of every finished game, kept on this device.
import type { GameState } from "../engine/game";  // the game state type

export type Life = {  // one finished life
  id: string;  // unique id of the life
  name: string;  // character name
  avatar: string;  // character picture
  preset?: string;  // chosen starting preset
  ending: string;   // japa, landlord, evicted, collapsed
  day: number;  // day the life ended
  earned: number;  // total money earned
  money: number;  // money left at the end
  finishedAt: string; // ISO date
};

const KEY = "eko-hustle-lives";  // browser storage key
const MAX = 30;  // keep at most this many lives

export function loadLives(): Life[] {  // read the saved lives
  try {  // storage can be blocked
    const raw = localStorage.getItem(KEY);  // raw saved text
    const list = raw ? JSON.parse(raw) : [];  // parse it, or start empty
    return Array.isArray(list) ? list : [];  // only accept a list
  } catch {  // broken data counts as empty
    return [];  // return nothing saved
  }
}

/** Remember a finished life (once). */
export function recordLife(s: GameState) {  // save one finished life
  if (!s.ending) return;  // no ending means nothing to save
  const id = `${s.sim.name}|${s.ending.day}|${s.stats.earned}`;  // same id as the old leaderboard used
  const lives = loadLives();  // lives saved so far
  if (lives.some(l => l.id === id)) return;  // skip a life already saved
  const life: Life = {  // build the record
    id, name: s.sim.name, avatar: s.sim.avatar, preset: s.sim.preset, ending: s.ending.kind,  // identity and character
    day: s.ending.day, earned: s.stats.earned, money: s.money, finishedAt: new Date().toISOString(),  // result and time
  };
  try {  // storage can be full or blocked
    localStorage.setItem(KEY, JSON.stringify([life, ...lives].slice(0, MAX)));  // newest first, trimmed to the limit
  } catch {
    // storage full or blocked: not kept
  }
}
