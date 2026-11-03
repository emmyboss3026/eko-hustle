// The live city: talks to the multiplayer server (server/index.ts) over a WebSocket.
// Off unless VITE_MULTIPLAYER_URL is set (for example ws://localhost:2567 while developing).
// The server decides where players really are; this only reports where you walked and shows the others.

import { supabase } from "./supabase";

export const multiplayerUrl = (import.meta.env.VITE_MULTIPLAYER_URL as string | undefined)?.trim() || null;

export type PeerCar = { model: string; color: string };
export type Peer = { id: string; name: string; look: Record<string, string>; x: number; z: number; yaw: number; anim: number; car?: PeerCar | null };
export type Say = { id: string; name: string; text: string };
export type PartyKind = "race" | "dance";
export type PartyStart = { kind: PartyKind; countdownMs: number; durationMs: number; beatMs: number; finish: number; players: [string, string][] };

export type Handlers = {
  onStatus: (s: { state: "connecting" | "online" | "offline"; instance?: string; capacity?: number }) => void;
  onWelcome: (peers: Peer[], x: number, z: number) => void;
  onJoin: (p: Peer) => void;
  onLeave: (id: string) => void;
  onSnap: (ps: [string, number, number, number, number][]) => void;
  onFix: (x: number, z: number) => void;   // the server refused a move: you are really here
  onSay: (s: Say) => void;
  onCar?: (id: string, car: PeerCar | null) => void;   // someone got into or out of a car
  onEvent?: (e: PartyStart) => void;                                  // the owner started a party game
  onEventScore?: (scores: [string, number][]) => void;
  onEventEnd?: (kind: string, ranking: [string, string, number][]) => void;
  onEnded?: (why: "denied" | "removed" | "replaced" | "kicked") => void;   // the server will not let you stay: do not retry
};

/** One connection for as long as you walk the streets. Reconnects on its own and goes back to the same instance. */
export class Multiplayer {
  private ws: WebSocket | null = null;
  private closed = false;
  private instance: string | undefined;
  private retry = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  private h: Handlers;
  private who: { name: string; look: Record<string, unknown> };
  private at: () => { x: number; z: number };
  private mine: PeerCar[] = [];

  private home: string | null;
  me: string | null = null;   // your id, once the server has welcomed you

  /** `home`: the owner's id to join their home instead of the city. */
  constructor(h: Handlers, who: { name: string; look: Record<string, unknown> }, at: () => { x: number; z: number }, home: string | null = null) {
    this.home = home;
    this.h = h;
    this.who = who;
    this.at = at;
  }

  start() {
    this.closed = false;
    void this.open();
  }

  private async open() {
    if (!multiplayerUrl || this.closed) return;
    this.h.onStatus({ state: "connecting" });
    let token: string | undefined;
    try {
      token = (await supabase?.auth.getSession())?.data.session?.access_token;
    } catch {
      // no account: only works when the server allows guests (development)
    }
    if (this.closed) return;
    const ws = new WebSocket(multiplayerUrl);
    this.ws = ws;
    ws.onopen = () => ws.send(JSON.stringify({ t: "hello", token, name: this.who.name, look: this.who.look, instance: this.instance, at: this.at(), cars: this.mine, home: this.home ?? undefined }));
    ws.onmessage = e => {
      let m: Record<string, unknown>;
      try { m = JSON.parse(String(e.data)); } catch { return; }
      switch (m.t) {
        case "welcome":
          this.retry = 0;
          this.instance = m.instance as string;
          this.me = m.id as string;
          this.h.onStatus({ state: "online", instance: this.instance, capacity: m.capacity as number });
          this.h.onWelcome(m.players as Peer[], m.x as number, m.z as number);
          break;
        case "join": this.h.onJoin(m.p as Peer); break;
        case "leave": this.h.onLeave(m.id as string); break;
        case "snap": this.h.onSnap(m.ps as [string, number, number, number, number][]); break;
        case "fix": this.h.onFix(m.x as number, m.z as number); break;
        case "say": this.h.onSay(m as unknown as Say); break;
        case "car": this.h.onCar?.(m.id as string, (m.car as PeerCar | null) ?? null); break;
        case "event": this.h.onEvent?.(m as unknown as PartyStart); break;
        case "eventScore": this.h.onEventScore?.(m.scores as [string, number][]); break;
        case "eventEnd": this.h.onEventEnd?.(m.kind as string, m.ranking as [string, string, number][]); break;
        case "removed": this.closed = true; this.h.onEnded?.("removed"); break;
        case "denied": this.closed = true; this.h.onEnded?.("denied"); break;
      }
    };
    ws.onclose = e => {
      this.ws = null;
      this.h.onStatus({ state: "offline" });
      // The server closes with a code of 4000 or more when it does not want you back (signed in elsewhere, kicked, denied)
      if (e.code >= 4000 && !this.closed) { this.closed = true; this.h.onEnded?.(e.code === 4004 ? "replaced" : "kicked"); }
      if (this.closed) return;
      this.timer = setTimeout(() => void this.open(), Math.min(10_000, 500 * 2 ** this.retry++));
    };
    ws.onerror = () => ws.close();
  }

  move(x: number, z: number, yaw: number, anim: 0 | 1 | 2) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: "move", x, z, yaw, anim }));
  }

  /** The owner sends a visitor out of their home. The server ignores it from anyone else. */
  remove(id: string) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: "remove", id }));
  }

  /** The cars you own, so the server knows which ones you may drive. Sent again when they change. */
  cars(list: PeerCar[]) {
    this.mine = list.slice(0, 12);
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: "cars", cars: this.mine }));
  }

  /** Get into one of your cars (others see it), or out of it (null). */
  drive(car: PeerCar | null) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: "drive", car }));
  }

  /** The owner starts a party game in their home (the server ignores it from anyone else). */
  startEvent(kind: PartyKind) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: "event", kind }));
  }

  /** A tap in a party game: the server decides whether it scores. */
  tap() {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: "tap" }));
  }

  say(text: string) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: "say", text }));
  }

  stop() {
    this.closed = true;
    clearTimeout(this.timer);
    this.ws?.close();
    this.ws = null;
  }
}
