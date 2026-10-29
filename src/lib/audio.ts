// All the game's sound, made live with the Web Audio API: no sound files to download, and
// nothing copied from anyone. Three channels, each with its own switch in 👤 Me → Sound:
//   effects (cooking, flushing, footsteps…), background (city, birds, crickets, generator) and music.

import { startMusic, stopMusic, type TrackId } from "./music";

export type MusicChoice = "off" | "auto" | TrackId;
export type AudioPrefs = { sfx: boolean; ambience: boolean; music: MusicChoice; volume: number };

const PREFS_KEY = "eko-hustle-audio";
const OLD_MUTE_KEY = "eko-hustle-muted";
const DEFAULTS: AudioPrefs = { sfx: true, ambience: true, music: "auto", volume: 0.7 };

let prefs: AudioPrefs = loadPrefs();
const listeners = new Set<(p: AudioPrefs) => void>();

function loadPrefs(): AudioPrefs {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
    if (saved && typeof saved === "object") return { ...DEFAULTS, ...saved };
    if (localStorage.getItem(OLD_MUTE_KEY) === "1") return { ...DEFAULTS, sfx: false }; // the old mute switch
  } catch {
    // blocked storage: defaults
  }
  return { ...DEFAULTS };
}

export const getPrefs = () => prefs;

export function setPrefs(patch: Partial<AudioPrefs>) {
  prefs = { ...prefs, ...patch, volume: Math.max(0, Math.min(1, patch.volume ?? prefs.volume)) };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
  applyLevels();
  listeners.forEach(l => l(prefs));
}

export function onPrefs(fn: (p: AudioPrefs) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------------------------------------------------------------- the mixer

type Mixer = { ctx: AudioContext; master: GainNode; sfx: GainNode; amb: GainNode; music: GainNode; noise: AudioBuffer };
let mixer: Mixer | null = null;

/** The audio graph, created on first use. Null if this browser has no Web Audio. */
export function audio(): Mixer | null {
  if (mixer) return mixer;
  try {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    const sfx = ctx.createGain();
    const amb = ctx.createGain();
    const music = ctx.createGain();
    sfx.connect(master);
    amb.connect(master);
    music.connect(master);
    // Two seconds of white noise, reused by every hiss, splash and crunch
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    mixer = { ctx, master, sfx, amb, music, noise };
    applyLevels();
    return mixer;
  } catch {
    return null;
  }
}

function applyLevels() {
  if (!mixer) return;
  const t = mixer.ctx.currentTime;
  mixer.master.gain.setTargetAtTime(prefs.volume, t, 0.05);
  mixer.sfx.gain.setTargetAtTime(prefs.sfx ? 1 : 0, t, 0.05);
  mixer.amb.gain.setTargetAtTime(prefs.ambience ? 1 : 0, t, 0.3);
  mixer.music.gain.setTargetAtTime(prefs.music === "off" ? 0 : 0.5, t, 0.3);
}

// Browsers only allow sound after the player has touched the page.
let unlocked = false;
export function unlockAudio() {
  if (unlocked) return;
  const unlock = () => {
    const m = audio();
    if (m && m.ctx.state === "suspended") void m.ctx.resume();
    unlocked = true;
  };
  addEventListener("pointerdown", unlock, { once: true, capture: true });
  addEventListener("keydown", unlock, { once: true, capture: true });
  // Go quiet when the tab is hidden
  document.addEventListener("visibilitychange", () => {
    const m = mixer;
    if (!m) return;
    if (document.hidden) void m.ctx.suspend();
    else if (unlocked) void m.ctx.resume();
  });
}

const ready = () => {
  const m = audio();
  return m && m.ctx.state === "running" ? m : null;
};

// ---------------------------------------------------------------- building blocks

/** A note with a quick fade in and out. */
export function tone(dest: AudioNode, type: OscillatorType, freq: number, t: number, len: number, vol: number, glideTo?: number, attack = 0.01) {
  const m = mixer!;
  const o = m.ctx.createOscillator();
  const g = m.ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + len);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + len + 0.05);
}

/** A burst of filtered noise: hiss, splash, crunch, footstep… */
export function hiss(dest: AudioNode, t: number, len: number, vol: number, filter: BiquadFilterType, freq: number, freqTo?: number, q = 1, attack = 0.005) {
  const m = mixer!;
  const src = m.ctx.createBufferSource();
  src.buffer = m.noise;
  src.loop = true;
  const f = m.ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, t);
  if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + len);
  f.Q.value = q;
  const g = m.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f).connect(g).connect(dest);
  src.start(t, Math.random() * 1.5);
  src.stop(t + len + 0.05);
}

// ---------------------------------------------------------------- sound effects

export type Sfx =
  | "cash" | "promo" | "event" | "error" | "travel" | "win" | "lose"
  | "sizzle" | "munch" | "snore" | "splash" | "shower" | "flush" | "step" | "door" | "ring" | "ping"
  | "type" | "page" | "whistle" | "beat" | "coin" | "pop" | "tv" | "gym" | "chime" | "radio" | "chat";

const r = (a: number, b: number) => a + Math.random() * (b - a);

const SOUNDS: Record<Sfx, (d: AudioNode, t: number) => void> = {
  cash: (d, t) => { tone(d, "square", 988, t, 0.08, 0.06); tone(d, "square", 1319, t + 0.08, 0.18, 0.06); },
  promo: (d, t) => [523, 659, 784, 1047].forEach((f, i) => tone(d, "triangle", f, t + i * 0.12, i === 3 ? 0.35 : 0.13, 0.08)),
  event: (d, t) => { tone(d, "sine", 880, t, 0.12, 0.08); tone(d, "sine", 660, t + 0.14, 0.2, 0.08); },
  error: (d, t) => tone(d, "sawtooth", 180, t, 0.18, 0.05),
  travel: (d, t) => { tone(d, "square", 440, t, 0.1, 0.05); tone(d, "square", 440, t + 0.18, 0.12, 0.05); }, // danfo horn
  win: (d, t) => [523, 659, 784, 1047].forEach((f, i) => tone(d, "triangle", f, t + i * 0.15, i === 3 ? 0.6 : 0.15, 0.09)),
  lose: (d, t) => [392, 330, 262].forEach((f, i) => tone(d, "sine", f, t + i * 0.25, i === 2 ? 0.5 : 0.25, 0.08)),
  // Hot oil: a steady hiss with little pops
  sizzle: (d, t) => {
    hiss(d, t, 2.6, 0.035, "highpass", 2500, undefined, 0.7, 0.15);
    for (let i = 0; i < 28; i++) hiss(d, t + r(0, 2.4), 0.025, r(0.03, 0.07), "bandpass", r(3000, 7000), undefined, 4);
  },
  munch: (d, t) => { for (let i = 0; i < 5; i++) hiss(d, t + i * 0.24 + r(0, 0.05), 0.08, 0.07, "bandpass", r(900, 1800), undefined, 2); },
  // Zzz: a slow, low breath in and out, twice
  snore: (d, t) => {
    for (let i = 0; i < 2; i++) {
      const s = t + i * 2;
      hiss(d, s, 0.9, 0.05, "lowpass", 300, 700, 1, 0.4);
      tone(d, "sawtooth", 85, s + 0.1, 0.8, 0.018, 70, 0.3);
      hiss(d, s + 1.0, 0.8, 0.025, "bandpass", 1800, 900, 1.5, 0.2);
    }
  },
  // Bucket bath: cupfuls of water poured over you
  splash: (d, t) => { for (let i = 0; i < 4; i++) hiss(d, t + i * 0.45 + r(0, 0.1), 0.45, 0.08, "lowpass", 4500, 700, 1.2, 0.01); },
  shower: (d, t) => hiss(d, t, 2.8, 0.045, "bandpass", 5500, 4500, 0.6, 0.3),
  // Flush: a rush of water that swirls away, with a gurgle
  flush: (d, t) => {
    hiss(d, t, 1.9, 0.09, "lowpass", 400, 2600, 1, 0.08);
    hiss(d, t + 0.9, 1.3, 0.06, "bandpass", 1200, 300, 2, 0.1);
    for (let i = 0; i < 6; i++) tone(d, "sine", r(110, 220), t + 1.2 + i * 0.14, 0.1, 0.03, r(60, 100));
  },
  step: (d, t) => { hiss(d, t, 0.07, 0.05, "lowpass", 500, 200, 1); tone(d, "sine", r(65, 80), t, 0.06, 0.04, 45); },
  door: (d, t) => { tone(d, "sawtooth", 260, t, 0.35, 0.012, 420, 0.05); tone(d, "sine", 90, t + 0.32, 0.12, 0.08, 60); },
  // A phone ringing (twice)
  ring: (d, t) => { for (let i = 0; i < 2; i++) { tone(d, "sine", 440, t + i * 0.6, 0.4, 0.04); tone(d, "sine", 480, t + i * 0.6, 0.4, 0.04); } },
  ping: (d, t) => { tone(d, "sine", 1320, t, 0.12, 0.06); tone(d, "sine", 1760, t + 0.1, 0.2, 0.06); },
  type: (d, t) => { let s = t; for (let i = 0; i < 9; i++) { hiss(d, s, 0.02, 0.05, "highpass", 2500); s += r(0.06, 0.14); } },
  page: (d, t) => { hiss(d, t, 0.28, 0.05, "bandpass", 1800, 4000, 1.5, 0.05); hiss(d, t + 0.6, 0.25, 0.04, "bandpass", 2000, 4200, 1.5, 0.05); },
  whistle: (d, t) => { tone(d, "sine", 2100, t, 0.25, 0.05); tone(d, "sine", 2100, t + 0.35, 0.5, 0.05, 2000); },
  beat: (d, t) => { for (let i = 0; i < 8; i++) { tone(d, "sine", 120, t + i * 0.25, 0.15, 0.1, 50); if (i % 2) hiss(d, t + i * 0.25, 0.08, 0.04, "highpass", 6000); } },
  coin: (d, t) => { tone(d, "square", 1568, t, 0.06, 0.05); tone(d, "square", 2093, t + 0.06, 0.22, 0.05); },
  pop: (d, t) => tone(d, "sine", 520, t, 0.09, 0.06, 900),
  tv: (d, t) => { hiss(d, t, 0.25, 0.04, "bandpass", 3000, undefined, 0.5); tone(d, "triangle", 330, t + 0.3, 0.3, 0.04); tone(d, "triangle", 392, t + 0.6, 0.4, 0.04); },
  gym: (d, t) => { for (let i = 0; i < 3; i++) { tone(d, "sine", 70, t + i * 0.7, 0.15, 0.1, 45); tone(d, "sawtooth", 150, t + i * 0.7 + 0.05, 0.2, 0.015, 110); } },
  chime: (d, t) => [523, 659, 784].forEach((f, i) => tone(d, "triangle", f, t + i * 0.18, 1.4, 0.05)),
  radio: (d, t) => { hiss(d, t, 0.4, 0.04, "bandpass", 2500, 1200, 0.7); [392, 494, 587, 494].forEach((f, i) => tone(d, "triangle", f, t + 0.45 + i * 0.18, 0.16, 0.05)); },
  chat: (d, t) => { tone(d, "sine", 700, t, 0.06, 0.035, 820); tone(d, "sine", 620, t + 0.08, 0.07, 0.03, 560); },
};

/** Play a sound effect (if effects are on). */
export function play(sfx: Sfx) {
  const m = ready();
  if (!m || !prefs.sfx) return;
  try {
    SOUNDS[sfx](m.sfx, m.ctx.currentTime + 0.01);
  } catch {
    // stay silent
  }
}

let stepFlip = false;
/** A footstep (slightly different every time). */
export function footstep() {
  const m = ready();
  if (!m || !prefs.sfx) return;
  stepFlip = !stepFlip;
  const t = m.ctx.currentTime + 0.005;
  hiss(m.sfx, t, 0.06, 0.035, "lowpass", stepFlip ? 520 : 440, 200, 1);
  tone(m.sfx, "sine", stepFlip ? 74 : 66, t, 0.05, 0.025, 45);
}

// ---------------------------------------------------------------- background sound

export type Scene = { hour: number; outdoors: boolean; generator: boolean; place: string };
let scene: Scene = { hour: 12, outdoors: false, generator: false, place: "mushin" };
let bed: { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
let gen: { osc: OscillatorNode; gain: GainNode } | null = null;
let director: number | null = null;

/** Tell the background sound where you are and what time it is. */
export function setScene(next: Scene) {
  scene = next;
  const m = mixer;
  if (!m || !bed) return;
  const t = m.ctx.currentTime;
  const night = next.hour >= 21 || next.hour < 5;
  // The city's hum: louder outside, softer at night
  bed.gain.gain.setTargetAtTime((next.outdoors ? 0.05 : 0.016) * (night ? 0.55 : 1), t, 1.2);
  bed.filter.frequency.setTargetAtTime(next.outdoors ? 420 : 240, t, 1);
  if (gen) gen.gain.gain.setTargetAtTime(next.generator ? (next.outdoors ? 0.008 : 0.02) : 0, t, 0.8);
}

/** Start the background sound (call once the game screen is up). */
export function startAmbience() {
  const m = audio();
  if (!m || director !== null) return;
  if (!bed) {
    const src = m.ctx.createBufferSource();
    src.buffer = m.noise;
    src.loop = true;
    const filter = m.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 300;
    const gain = m.ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(m.amb);
    src.start();
    bed = { src, filter, gain };
    // A small generator: a low buzz that only plays when yours is running
    const osc = m.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 52;
    const lp = m.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 160;
    const g = m.ctx.createGain();
    g.gain.value = 0;
    osc.connect(lp).connect(g).connect(m.amb);
    osc.start();
    gen = { osc, gain: g };
  }
  setScene(scene);
  // Every second, maybe a horn, an okada, birds or crickets
  director = window.setInterval(() => {
    const mm = ready();
    if (!mm || !prefs.ambience) return;
    const t = mm.ctx.currentTime + 0.05;
    const h = scene.hour;
    const vol = scene.outdoors ? 1 : 0.4;
    const d = mm.amb;
    if (h >= 6 && h < 22 && Math.random() < 0.06) {
      // a car or danfo horn somewhere
      const f = r(380, 520);
      tone(d, "square", f, t, 0.18, 0.012 * vol);
      if (Math.random() < 0.5) tone(d, "square", f, t + 0.25, 0.25, 0.012 * vol);
    }
    if (h >= 7 && h < 21 && Math.random() < 0.035) tone(d, "sawtooth", r(100, 140), t, 2.2, 0.006 * vol, r(160, 200), 0.6); // an okada passing
    if (h >= 5 && h < 9 && Math.random() < 0.25) {
      for (let i = 0; i < 3; i++) tone(d, "sine", r(2800, 3800), t + i * 0.13, 0.09, 0.012 * vol, r(3800, 4800)); // birds
    }
    if ((h >= 20 || h < 5) && Math.random() < 0.5) {
      for (let i = 0; i < 3; i++) tone(d, "sine", 4600, t + i * 0.07, 0.04, 0.006); // crickets
    }
    if ((h >= 18 && h < 23) && scene.place === "mushin" && Math.random() < 0.02) {
      [262, 330, 392, 330].forEach((f, i) => tone(d, "triangle", f, t + i * 0.3, 0.25, 0.006 * vol)); // a neighbour's radio
    }
  }, 1000);
}

export function stopAmbience() {
  if (director !== null) window.clearInterval(director);
  director = null;
  if (bed && mixer) bed.gain.gain.setTargetAtTime(0, mixer.ctx.currentTime, 0.3);
  if (gen && mixer) gen.gain.gain.setTargetAtTime(0, mixer.ctx.currentTime, 0.3);
}

// ---------------------------------------------------------------- music

/** The track to play for a music choice and a language. */
export function trackFor(choice: MusicChoice, lang: string): TrackId | null {
  if (choice === "off") return null;
  if (choice === "auto") return lang === "de" ? "waltz" : lang === "pcm" ? "afrobeat" : "highlife";
  return choice;
}

let playing: TrackId | null = null;
export function setMusic(track: TrackId | null) {
  if (track === playing) return;
  playing = track;
  const m = audio();
  if (!m) return;
  stopMusic();
  if (track) startMusic(m.ctx, m.music, track, tone, hiss);
}
