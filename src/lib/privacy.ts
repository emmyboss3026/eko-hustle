// What the player has agreed to, and their age group. Asked once on first launch (the consent banner);
// changeable any time in 👤 Me → Privacy. Stored only on this device. We store an age GROUP, never a birthday.
//
// - Essential storage (your save, settings, sign-in) is always on: the game can't work without it.
// - Statistics (Vercel Web Analytics, cookie-free page counts) only when the player says yes.
// - Personalised ads only with a yes AND age 16+. Otherwise ads are non-personalised (and marked for
//   children under 16). In the EU/UK, Google's own consent message (turn it on in AdSense → Privacy & messaging)
//   also asks before Google uses any data for ads.

export type AgeBand = "under13" | "13-15" | "16-17" | "adult";
export type Privacy = { decided: boolean; stats: boolean; ads: boolean; age: AgeBand | null; at: string | null };

export const CONSENT_VERSION = "2026-10-29";
const KEY = "eko-hustle-privacy";
const DEFAULTS: Privacy = { decided: false, stats: false, ads: false, age: null, at: null };

let current: Privacy = load();
const listeners = new Set<(p: Privacy) => void>();

function load(): Privacy {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (v && typeof v === "object" && v.version === CONSENT_VERSION) return { ...DEFAULTS, ...v };
  } catch {
    // blocked storage: ask again
  }
  return { ...DEFAULTS };
}

export const getPrivacy = () => current;

export function setPrivacy(patch: Partial<Privacy>) {
  current = { ...current, ...patch, at: new Date().toISOString() };
  // Children can't agree to personalised ads
  if (current.age === "under13" || current.age === "13-15") current.ads = false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...current, version: CONSENT_VERSION }));
  } catch {
    // ignore
  }
  listeners.forEach(l => l(current));
}

export function onPrivacy(fn: (p: Privacy) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const isChild = (p = current) => p.age === "under13" || p.age === "13-15";
export const isMinor = (p = current) => p.age !== "adult";
/** Under 13: no account, no purchases (the game still works fully offline). */
export const canHaveAccount = (p = current) => p.age !== null && p.age !== "under13";
export const personalisedAds = (p = current) => p.ads && !isChild(p);

/** Everything this game keeps on this device (used by "Delete data on this device"). */
export const DEVICE_KEYS_PREFIX = "eko-hustle";
