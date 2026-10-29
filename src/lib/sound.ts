// Sound effects (kept for older imports). The sound engine itself is in audio.ts.

import { getPrefs, play, setPrefs, type Sfx } from "./audio";

export { play, type Sfx };

export const isMuted = () => !getPrefs().sfx;
export const setMuted = (muted: boolean) => setPrefs({ sfx: !muted });

// Pick a sound from the newest log line
export function soundForLog(line: string): Sfx | null {
  if (line.includes("PROMOTION") || line.includes("BEFÖRDERUNG")) return "promo";
  if (line.startsWith("❌") || line.startsWith("😴")) return "error";
  if (line.startsWith("💼") || line.includes("+₦")) return "cash";
  if (/^(🚌|🛺|🏍️)/u.test(line)) return "travel";
  if (line.startsWith("🎯")) return "promo";
  return null;
}
