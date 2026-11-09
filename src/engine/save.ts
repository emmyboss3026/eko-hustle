import { upgrade, type GameState } from "./game";  // game state and save upgrader

// Eko Hustle saves. A Hustle & Japa save on the same device is picked up and upgraded once.
const KEY = "eko-hustle-save-v1";  // current save key
const OLD_KEY = "hustle-japa-save-v2";  // old Hustle & Japa save key
const SAVED_AT_KEY = "eko-hustle-saved-at";  // time of the last save

export function loadGame(): GameState | null {  // load the saved game
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY);  // read the new save, else the old one
    return raw ? upgrade(JSON.parse(raw)) : null;  // upgrade it to the current format
  } catch {
    return null; // private window, blocked storage or a broken save: start fresh
  }
}

export function saveGame(state: GameState | null) {  // write the game to storage
  try {
    if (state) localStorage.setItem(KEY, JSON.stringify(state));  // save, or delete when empty
    else localStorage.removeItem(KEY);
    localStorage.setItem(SAVED_AT_KEY, new Date().toISOString());  // note when this device saved
  } catch {
    // storage full or blocked: the game still works, it just won't save
  }
}

export function clearSave() {  // delete the saved game
  try {
    localStorage.removeItem(KEY);  // remove the new save
    localStorage.removeItem(OLD_KEY);  // remove the old save
  } catch {
    // ignore
  }
}

// When this device last saved (used to decide between the local and the cloud save)
export function localSavedAt(): string | null {  // when this device last saved
  try {
    return localStorage.getItem(SAVED_AT_KEY);  // read the time
  } catch {
    return null;  // nothing known
  }
}

/** The save as a file the player can keep. */
export function exportSave(state: GameState): string {  // turn a save into text
  return JSON.stringify(state);  // plain JSON
}

/** Read a save file. Throws a friendly error if it isn't one. */
export function importSave(text: string): GameState {  // turn a save file back into a game
  let data: unknown;  // the parsed data
  try {
    data = JSON.parse(text);  // read the JSON
  } catch {
    throw new Error("save.notSave");  // message key for a file that is not JSON
  }
  const state = upgrade(data);  // upgrade to the current format
  if (!state) throw new Error("save.notEko");  // not an Eko Hustle save
  return state;  // the upgraded game
}
