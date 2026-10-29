import { upgrade, type GameState } from "./game";

// Eko Hustle saves. A Hustle & Japa save on the same device is picked up and upgraded once.
const KEY = "eko-hustle-save-v1";
const OLD_KEY = "hustle-japa-save-v2";
const SAVED_AT_KEY = "eko-hustle-saved-at";

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY);
    return raw ? upgrade(JSON.parse(raw)) : null;
  } catch {
    return null; // private window, blocked storage or a broken save: start fresh
  }
}

export function saveGame(state: GameState | null) {
  try {
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
    else localStorage.removeItem(KEY);
    localStorage.setItem(SAVED_AT_KEY, new Date().toISOString());
  } catch {
    // storage full or blocked: the game still works, it just won't save
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(OLD_KEY);
  } catch {
    // ignore
  }
}

// When this device last saved (used to decide between the local and the cloud save)
export function localSavedAt(): string | null {
  try {
    return localStorage.getItem(SAVED_AT_KEY);
  } catch {
    return null;
  }
}

/** The save as a file the player can keep. */
export function exportSave(state: GameState): string {
  return JSON.stringify(state);
}

/** Read a save file. Throws a friendly error if it isn't one. */
export function importSave(text: string): GameState {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("save.notSave");
  }
  const state = upgrade(data);
  if (!state) throw new Error("save.notEko");
  return state;
}
