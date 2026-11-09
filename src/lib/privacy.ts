// What the player has agreed to, and their age group. Asked once on first launch (the consent banner);
// changeable any time in 👤 Me → Privacy. Stored only on this device. We store an age GROUP, never a birthday.
//
// - Essential storage (your save, settings, sign-in) is always on: the game can't work without it.
// - Statistics (Vercel Web Analytics, cookie-free page counts) only when the player says yes.
// - Personalised ads only with a yes AND age 16+. Otherwise ads are non-personalised (and marked for
//   children under 16). In the EU/UK, Google's own consent message (turn it on in AdSense → Privacy & messaging)
//   also asks before Google uses any data for ads.

export type AgeBand = "under13" | "13-15" | "16-17" | "adult";  // age groups, never a birthday
export type Privacy = { decided: boolean; stats: boolean; ads: boolean; age: AgeBand | null; at: string | null };  // what the player agreed to

export const CONSENT_VERSION = "2026-10-29";  // bump this to ask everyone again
const KEY = "eko-hustle-privacy";  // browser storage key
const DEFAULTS: Privacy = { decided: false, stats: false, ads: false, age: null, at: null };  // nothing agreed yet

let current: Privacy = load();  // current choices, loaded at start
const listeners = new Set<(p: Privacy) => void>();  // functions to call on change

function load(): Privacy {  // read saved choices
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");  // read and parse the saved text
    if (v && typeof v === "object" && v.version === CONSENT_VERSION) return { ...DEFAULTS, ...v };  // use only choices saved for this consent version
  } catch {
    // blocked storage: ask again
  }
  return { ...DEFAULTS };  // ask again
}

export const getPrivacy = () => current;  // read the current choices

export function setPrivacy(patch: Partial<Privacy>) {  // change some choices
  current = { ...current, ...patch, at: new Date().toISOString() };  // merge the change and note the time
  // Children can't agree to personalised ads
  if (current.age === "under13" || current.age === "13-15") current.ads = false;  // children cannot choose personalised ads
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...current, version: CONSENT_VERSION }));  // save the choices with the version
  } catch {
    // ignore
  }
  listeners.forEach(l => l(current));  // tell everyone listening
}

export function onPrivacy(fn: (p: Privacy) => void) {  // listen for changes
  listeners.add(fn);  // add the listener
  return () => {  // return a way to stop listening
    listeners.delete(fn);  // remove the listener
  };
}

export const isChild = (p = current) => p.age === "under13" || p.age === "13-15";  // under 16 for ad rules
export const isMinor = (p = current) => p.age !== "adult";  // anyone not an adult
/** Under 13: no account, no purchases (the game still works fully offline). */
export const canHaveAccount = (p = current) => p.age !== null && p.age !== "under13";  // under 13 get no account
export const personalisedAds = (p = current) => p.ads && !isChild(p);  // ads only if agreed and not a child

/** Everything this game keeps on this device (used by "Delete data on this device"). */
export const DEVICE_KEYS_PREFIX = "eko-hustle";  // prefix of every key this game stores
