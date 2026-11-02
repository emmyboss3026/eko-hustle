// The live city: talks to the multiplayer server (server/index.ts) over a WebSocket.
// Off unless VITE_MULTIPLAYER_URL is set (for example ws://localhost:2567 while developing).
// The server decides where players really are; this only reports where you walked and shows the others.

import { supabase } from "./supabase";

export const multiplayerUrl = (import.meta.env.VITE_MULTIPLAYER_URL as string | undefined)?.trim() || null;

export type Peer = { id: string; name: string; look: Record<string, string>; x: number; z: number; yaw: number; anim: number };
export type Say = { id: string; name: string; text: string };

export type Handlers = {
  onStatus: (s: { state: "connecting" | "online" | "offline"; instance?: string; capacity?: number }) => void;
  onWelcome: (peers: Peer[], x: number, z: number) => void;
  onJoin: (p: Peer) => void;
  onLeave: (id: string) => void;
  onSnap: (ps: [string, number, number, number, number][]) => void;
  onFix: (x: number, z: number) => void;   // the server refused a move: you are really here
  onSay: (s: Say) => void;
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

  constructor(h: Handlers, who: { name: string; look: Record<string, unknown> }, at: () => { x: number; z: number }) {
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
    ws.onopen = () => ws.send(JSON.stringify({ t: "hello", token, name: this.who.name, look: this.who.look, instance: this.instance, at: this.at() }));
    ws.onmessage = e => {
      let m: Record<string, unknown>;
      try { m = JSON.parse(String(e.data)); } catch { return; }
      switch (m.t) {
        case "welcome":
          this.retry = 0;
          this.instance = m.instance as string;
          this.h.onStatus({ state: "online", instance: this.instance, capacity: m.capacity as number });
          this.h.onWelcome(m.players as Peer[], m.x as number, m.z as number);
          break;
        case "join": this.h.onJoin(m.p as Peer); break;
        case "leave": this.h.onLeave(m.id as string); break;
        case "snap": this.h.onSnap(m.ps as [string, number, number, number, number][]); break;
        case "fix": this.h.onFix(m.x as number, m.z as number); break;
        case "say": this.h.onSay(m as unknown as Say); break;
      }
    };
    ws.onclose = () => {
      this.ws = null;
      this.h.onStatus({ state: "offline" });
      if (this.closed) return;
      this.timer = setTimeout(() => void this.open(), Math.min(10_000, 500 * 2 ** this.retry++));
    };
    ws.onerror = () => ws.close();
  }

  move(x: number, z: number, yaw: number, anim: 0 | 1 | 2) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: "move", x, z, yaw, anim }));
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
