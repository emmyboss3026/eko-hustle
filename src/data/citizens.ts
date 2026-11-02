// The 24 library citizens as looks, and the choices the creator offers for them. Plain data: the 3D code is in three/citizen.ts.

import type { Look } from "./characters";

export const CITIZEN_COUNT_PLAIN = 24;
export const CITIZEN_OUTFITS = ["tee", "long", "tank", "shorts", "dress", "kaftan"] as const;
export const CITIZEN_STATURES = ["short", "average", "tall"] as const;
/** The clips in the library that make a good preview. (Sit and Sleep are placeholders that do not move the body; the game poses those itself.) */
export const CITIZEN_CLIPS = ["Idle", "Walk", "Run", "Wave", "Dance"] as const;

// Skin tones and shirt colours of the library, as its build script defines them
const hex = (c: number[]) => `#${c.map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
const SKINS = [[.92, .72, .56], [.77, .53, .36], [.59, .36, .24], [.39, .22, .15], [.26, .14, .10], [.97, .83, .71]].map(hex);
const SHIRTS = [[.95, .39, .30], [.18, .49, .85], [.83, .65, .20], [.42, .28, .65]].map(hex);

/** The look for library citizen `n` (1 to 24): its own skin, shirt, trousers and hair colour. Hair style, accessories and the rest stay as chosen. */
export function citizenLook(n: number): Partial<Look> {
  const skin = n % 6, outfit = Math.floor(n / 6) % 4;
  return { model: "citizen", cz: String(n), skin: SKINS[skin], outfit: SHIRTS[outfit], bottom: hex([.10 + .07 * outfit, .17, .27]), hairColor: hex([.09 + .06 * (n % 3), .07, .06]) };
}
