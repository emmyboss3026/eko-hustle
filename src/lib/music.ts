// Background music: four short original loops, played live by a tiny step sequencer.
// Each language has its own default (🇬🇧 highlife, 🇳🇬 Afrobeat groove, 🇩🇪 a Bavarian-style waltz),
// and players can pick any of them (or none) in 👤 Me → Sound.
//
// Patterns: one character per step. "x" = hit, "." = rest, digits = which note of the chord.

export type TrackId = "highlife" | "afrobeat" | "waltz" | "lofi";

export const TRACKS: { id: TrackId; emoji: string }[] = [
  { id: "highlife", emoji: "🎸" },
  { id: "afrobeat", emoji: "🥁" },
  { id: "waltz", emoji: "🪗" },
  { id: "lofi", emoji: "🎧" },
];

type Track = {
  bpm: number;
  steps: number;            // steps per bar
  stepBeat: number;         // steps per beat (4 = sixteenths, 2 = eighths)
  chords: number[][];       // one chord per bar (MIDI note numbers), looped
  kick?: string;
  clap?: string;
  shaker?: string;
  clave?: string;
  bass: string;             // chord note to play in the bass (two octaves down)
  pluck?: string;           // chord notes for the guitar/keys
  stab?: string;            // short horn chords
  oompah?: string;          // waltz chords on the off-beats
  pad?: boolean;            // a soft held chord each bar
  crackle?: boolean;        // vinyl crackle
  wave: OscillatorType;     // the lead instrument's sound
};

const TRACK: Record<TrackId, Track> = {
  // Bright, bouncy guitar over a clave rhythm
  highlife: {
    bpm: 122, steps: 16, stepBeat: 4, wave: "triangle",
    chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]],
    kick:   "x.......x.......",
    clap:   "....x.......x...",
    shaker: "..x...x...x...x.",
    clave:  "x..x..x...x.x...",
    bass:   "0...2...0..1.2..",
    pluck:  "0.12.0.1.2.10.2.",
  },
  // A laid-back groove with horn stabs
  afrobeat: {
    bpm: 104, steps: 16, stepBeat: 4, wave: "sawtooth",
    chords: [[57, 60, 64, 67], [62, 65, 69, 72], [57, 60, 64, 67], [64, 67, 71, 74]],
    kick:   "x.....x...x.....",
    clap:   "....x.......x..x",
    shaker: "x.xxx.xxx.xxx.xx",
    bass:   "0..0.2..1..0.2..",
    pluck:  "..0...1...2...1.",
    stab:   "......x.......x.",
  },
  // Oom-pah-pah, in three
  waltz: {
    bpm: 168, steps: 6, stepBeat: 2, wave: "square",
    chords: [[65, 69, 72], [60, 64, 67, 70], [60, 64, 67, 70], [65, 69, 72]],
    bass:   "0.....",
    oompah: "..x.x.",
    pluck:  "2...1.",
  },
  // Slow and soft, for studying
  lofi: {
    bpm: 78, steps: 16, stepBeat: 4, wave: "sine", pad: true, crackle: true,
    chords: [[65, 69, 72, 76], [64, 67, 71, 74], [62, 65, 69, 72], [60, 64, 67, 71]],
    kick:   "x.......x.x.....",
    clap:   "....x.......x...",
    shaker: "x.x.x.x.x.x.x.x.",
    bass:   "0.......0.......",
    pluck:  "..2.....1...3...",
  },
};

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

type Tone = (dest: AudioNode, type: OscillatorType, freq: number, t: number, len: number, vol: number, glideTo?: number, attack?: number) => void;
type Hiss = (dest: AudioNode, t: number, len: number, vol: number, filter: BiquadFilterType, freq: number, freqTo?: number, q?: number, attack?: number) => void;

let timer: number | null = null;

export function stopMusic() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
}

/** Start looping a track into `dest`. */
export function startMusic(ctx: AudioContext, dest: AudioNode, id: TrackId, tone: Tone, hiss: Hiss) {
  stopMusic();
  const tr = TRACK[id];
  const stepLen = 60 / tr.bpm / tr.stepBeat;
  let step = 0;
  let next = ctx.currentTime + 0.1;
  const hit = (p: string | undefined, i: number) => !!p && p[i % p.length] === "x";
  const note = (p: string | undefined, i: number) => {
    const c = p?.[i % p.length];
    return c && c >= "0" && c <= "9" ? Number(c) : null;
  };

  const schedule = (t: number, s: number) => {
    const i = s % tr.steps;
    const chord = tr.chords[Math.floor(s / tr.steps) % tr.chords.length];
    if (hit(tr.kick, i)) tone(dest, "sine", 110, t, 0.18, 0.16, 45, 0.003);
    if (hit(tr.clap, i)) hiss(dest, t, 0.12, 0.05, "bandpass", 1500, undefined, 0.8);
    if (hit(tr.shaker, i)) hiss(dest, t, 0.04, 0.018, "highpass", 7000);
    if (hit(tr.clave, i)) tone(dest, "sine", 1900, t, 0.05, 0.03);
    const b = note(tr.bass, i);
    if (b !== null) tone(dest, "triangle", hz(chord[b % chord.length] - 24), t, stepLen * (tr.steps === 6 ? 1.6 : 2.2), 0.09);
    const p = note(tr.pluck, i);
    if (p !== null) tone(dest, tr.wave === "sawtooth" ? "triangle" : tr.wave, hz(chord[p % chord.length] + (id === "lofi" ? 12 : 0)), t, stepLen * 1.8, id === "waltz" ? 0.025 : 0.04);
    if (hit(tr.stab, i)) chord.slice(0, 3).forEach(n => tone(dest, "sawtooth", hz(n), t, 0.16, 0.014, undefined, 0.01));
    if (hit(tr.oompah, i)) chord.forEach(n => { tone(dest, "square", hz(n), t, stepLen * 0.9, 0.012); tone(dest, "square", hz(n) * 1.004, t, stepLen * 0.9, 0.008); });
    if (tr.pad && i === 0) chord.forEach(n => tone(dest, "sine", hz(n), t, stepLen * tr.steps * 0.98, 0.02, undefined, 0.6));
    if (tr.crackle && Math.random() < 0.3) hiss(dest, t + Math.random() * stepLen, 0.01, 0.02, "highpass", 3000);
  };

  // Schedule a little ahead, every 25 ms (keeps time even if the page is busy)
  timer = window.setInterval(() => {
    if (next < ctx.currentTime - 0.2) next = ctx.currentTime + 0.05; // back from a pause: don't play catch-up
    while (next < ctx.currentTime + 0.15) {
      schedule(next, step);
      next += stepLen;
      step++;
    }
  }, 25);
}
