// Tiny sound effects made with the Web Audio API: no sound files to download.

export type Sfx = "cash" | "promo" | "event" | "error" | "travel" | "win" | "lose";

const MUTE_KEY = "eko-hustle-muted";
let ctx: AudioContext | null = null;

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // ignore
  }
}

// [frequency in Hz, start in seconds, length in seconds]
const tunes: Record<Sfx, { wave: OscillatorType; notes: [number, number, number][] }> = {
  cash: { wave: "square", notes: [[988, 0, 0.08], [1319, 0.08, 0.18]] },
  promo: { wave: "triangle", notes: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.3]] },
  event: { wave: "sine", notes: [[880, 0, 0.12], [660, 0.14, 0.2]] },
  error: { wave: "sawtooth", notes: [[180, 0, 0.18]] },
  travel: { wave: "square", notes: [[440, 0, 0.1], [440, 0.18, 0.1]] }, // danfo horn
  win: { wave: "triangle", notes: [[523, 0, 0.15], [659, 0.15, 0.15], [784, 0.3, 0.15], [1047, 0.45, 0.5]] },
  lose: { wave: "sine", notes: [[392, 0, 0.25], [330, 0.25, 0.25], [262, 0.5, 0.5]] },
};

export function play(sfx: Sfx) {
  if (isMuted()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const { wave, notes } = tunes[sfx];
    for (const [freq, start, len] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.08, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + len + 0.02);
    }
  } catch {
    // no audio available: stay silent
  }
}

// Pick a sound from the newest log line
export function soundForLog(line: string): Sfx | null {
  if (line.includes("PROMOTION")) return "promo";
  if (line.startsWith("❌") || line.startsWith("😴")) return "error";
  if (line.startsWith("💼") || line.includes("made ₦") || line.includes("+₦")) return "cash";
  if (/^(🚶|🚌|🛺|🏍️)/u.test(line)) return "travel";
  return null;
}
