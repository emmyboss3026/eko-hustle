// Sound effects (kept for older imports). The sound engine itself is in audio.ts.

import { getPrefs, play, setPrefs, type Sfx } from "./audio";  // audio engine functions

export { play, type Sfx };  // re-export for older imports

export const isMuted = () => !getPrefs().sfx;  // true when sound effects are off
export const setMuted = (muted: boolean) => setPrefs({ sfx: !muted });  // turn sound effects on or off

// Pick a sound from the newest log line
export function soundForLog(line: string): Sfx | null {  // choose a sound for a log line
  if (line.includes("PROMOTION") || line.includes("BEFÖRDERUNG")) return "promo";  // promotion sound
  if (line.startsWith("❌") || line.startsWith("😴")) return "error";  // error sound
  if (line.startsWith("💼") || line.includes("+₦")) return "cash";  // money sound
  if (/^(🚌|🛺|🏍️)/u.test(line)) return "travel";  // travel sound
  if (line.startsWith("🎯")) return "promo";  // goal sound
  return null;  // no sound for other lines
}
