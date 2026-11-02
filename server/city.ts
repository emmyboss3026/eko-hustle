// The multiplayer city: instances, players, and the rules for what they may do.
// Pure logic with no sockets, so it can be tested directly. server/index.ts connects it to WebSockets.
//
// The server is the authority on where players are: every move is checked for speed, walls and the
// edge of the land. Positions live only here in memory; nothing is written to the database.

import { blocked, LAND_HALF, RUN_SPEED } from "../src/three/world.js";
import { CARS } from "../src/data/estate.ts";

export const CAPACITY = 24;          // players per city instance: a starting target, to be measured, not a promise
export const SEE_RANGE = 150;        // you only receive players this close (interest management)
export const SAY_RANGE = 30;         // proximity chat reaches this far
export const MAX_SAY = 120;
export const HOME_CAPACITY = 6;      // people in one home at a time (owner + visitors)
export const HOME_SIZE = 20;         // the most a home can grow to (8 x 8 up to 20 x 20 tiles with extensions: see data/home.ts); positions there are in tiles
const HOME_SPEED = 3;                // tiles per second, the same as the walking speed in HouseView
const HOME_DOOR = { x: 2, z: 7 };    // where you appear when you come in
const SAY_EVERY_MS = 1_000;
const MOVE_EVERY_MS = 40;            // moves arriving faster than this are dropped
const SPEED_SLACK = 1.6;             // run speed × this, so lag spikes do not rubber-band honest players
const MAX_GAP_S = 2;                 // a long silence never earns more than this much travel
const KICK_AFTER_STRIKES = 25;
const MAX_OWNED = 12;                // the most cars one player can own (MAX_CARS in the game)
const CAR_SCALE = 0.36;              // in-game top speed is real km/h × this (see StreetView.startDrive)
const CAR_RADIUS = 0.8;              // how close to a wall a car centre may be
const carTop = (model: string) => (CARS.find(c => c.id === model)?.topKmh ?? 0) / 3.6 * CAR_SCALE;

export type Out = (msg: Record<string, unknown>) => void;
export type Look = Record<string, string>;
export type Car = { model: string; color: string };

export type Member = {
  id: string;                        // the account id (or a guest id in development)
  name: string;
  look: Look;
  instance: string;
  x: number; z: number; yaw: number;
  anim: number;                      // 0 idle, 1 walk, 2 run
  send: Out;
  lastMove: number;
  lastSay: number;
  strikes: number;
  dirty: boolean;
  home: boolean;                     // in someone's home (positions are tiles) rather than the city (world units)
  owned: Car[];                      // the cars this player says they own: only these can be driven, and only by them
  car: Car | null;                   // the car they are driving now, if any
};

export type Options = {
  capacity?: number;
  now?: () => number;
  suspicious?: (m: Member, why: string) => void;   // called for rejected moves, for logging
  kick?: (m: Member) => void;                      // too many rejected moves
};

const START = { x: 0, z: 6 };        // a clear spot on the central crossroads, away from every door

const cleanName = (s: unknown) => String(s ?? "").replace(/[^\p{L}\p{N} _.-]/gu, "").trim().slice(0, 20) || "Player";
// Only colours and a few words are accepted from the client, so a look can never carry markup or large data
const cleanLook = (l: unknown): Look => {
  const out: Look = {};
  if (l && typeof l === "object") {
    for (const [k, v] of Object.entries(l as Record<string, unknown>).slice(0, 12)) {
      if (/^[a-zA-Z]{1,16}$/.test(k) && typeof v === "string" && /^[#\w-]{1,16}$/.test(v)) out[k] = v;
    }
  }
  return out;
};
// Only known models and plain colours are accepted, so a car can never carry markup or large data
const cleanCar = (c: unknown): Car | null => {
  const o = c as Partial<Car> | null;
  if (!o || typeof o.model !== "string" || typeof o.color !== "string") return null;
  if (!CARS.some(k => k.id === o.model) || !/^#[0-9a-fA-F]{6}$/.test(o.color)) return null;
  return { model: o.model, color: o.color };
};
const cleanCars = (l: unknown): Car[] => (Array.isArray(l) ? l.slice(0, MAX_OWNED).map(cleanCar).filter((c): c is Car => !!c) : []);
const publicOf = (m: Member) => ({ id: m.id, name: m.name, look: m.look, x: m.x, z: m.z, yaw: m.yaw, anim: m.anim, car: m.car });

export class Cities {
  readonly capacity: number;
  private rooms = new Map<string, Map<string, Member>>();
  private byId = new Map<string, Member>();
  private now: () => number;
  private opts: Options;

  constructor(opts: Options = {}) {
    this.opts = opts;
    this.capacity = opts.capacity ?? CAPACITY;
    this.now = opts.now ?? Date.now;
  }

  /** The instances that exist, for discovery: "001", "002"… */
  list() {
    return [...this.rooms].map(([id, r]) => ({ id, count: r.size, capacity: this.capacity }));
  }

  get(id: string) {
    return this.byId.get(id);
  }

  /** Put a player in an instance: the one they ask for (a friend's) if it has room, else the first with room, else a new one. */
  join(p: { id: string; name: string; look?: unknown; cars?: unknown; at?: { x?: unknown; z?: unknown }; send: Out }, want?: string): Member {
    const old = this.byId.get(p.id);
    if (old) this.leave(old.id); // one live character per account: a second connection replaces the first
    let room = want ? this.rooms.get(want) : undefined;
    let id = want;
    if (!room || room.size >= this.capacity) {
      const open = [...this.rooms].find(([, r]) => r.size < this.capacity);
      if (open) [id, room] = open;
      else {
        id = String(this.rooms.size + 1).padStart(3, "0");
        while (this.rooms.has(id)) id = String(Number(id) + 1).padStart(3, "0");
        room = new Map();
        this.rooms.set(id, room);
      }
    }
    const t = this.now();
    // You appear where you stepped out of a door, if that is somewhere you could really stand
    const ax = Number(p.at?.x), az = Number(p.at?.z);
    const spawn = Number.isFinite(ax) && Number.isFinite(az) && Math.abs(ax) <= LAND_HALF && Math.abs(az) <= LAND_HALF && !blocked(ax, az, 0.3) ? { x: ax, z: az } : START;
    const m: Member = {
      id: p.id, name: cleanName(p.name), look: cleanLook(p.look), instance: id!,
      x: spawn.x, z: spawn.z, yaw: 0, anim: 0, send: p.send, lastMove: t, lastSay: 0, strikes: 0, dirty: false, home: false,
      owned: cleanCars(p.cars), car: null,
    };
    // Everyone already there hears about the newcomer; the newcomer gets everyone in range
    for (const o of room.values()) o.send({ t: "join", p: publicOf(m) });
    room.set(m.id, m);
    this.byId.set(m.id, m);
    m.send({ t: "welcome", id: m.id, instance: m.instance, capacity: this.capacity, players: [...room.values()].filter(o => o !== m && near(m, o, SEE_RANGE)).map(publicOf), x: m.x, z: m.z });
    return m;
  }

  /** Put a player in a home. The caller must already have checked that they may enter (the owner, or an invited friend). */
  joinHome(p: { id: string; name: string; look?: unknown; send: Out }, owner: string): Member | null {
    const old = this.byId.get(p.id);
    if (old) this.leave(old.id);
    const rid = `home:${owner}`;
    let room = this.rooms.get(rid);
    if (room && room.size >= HOME_CAPACITY) return null;
    if (!room) { room = new Map(); this.rooms.set(rid, room); }
    const m: Member = {
      id: p.id, name: cleanName(p.name), look: cleanLook(p.look), instance: rid,
      x: HOME_DOOR.x, z: HOME_DOOR.z, yaw: 0, anim: 0, send: p.send, lastMove: this.now(), lastSay: 0, strikes: 0, dirty: false, home: true,
      owned: [], car: null,
    };
    for (const o of room.values()) o.send({ t: "join", p: publicOf(m) });
    room.set(m.id, m);
    this.byId.set(m.id, m);
    m.send({ t: "welcome", id: m.id, instance: rid, home: owner, capacity: HOME_CAPACITY, players: [...room.values()].filter(o => o !== m).map(publicOf), x: m.x, z: m.z });
    return m;
  }

  /** The owner sends a visitor out of their home. Nobody else can. */
  removeVisitor(ownerId: string, guestId: string): boolean {
    const g = this.byId.get(guestId);
    if (!g || !g.home || g.instance !== `home:${ownerId}` || guestId === ownerId) return false;
    g.send({ t: "removed" });
    this.leave(guestId);
    return true;
  }

  leave(id: string) {
    const m = this.byId.get(id);
    if (!m) return;
    this.byId.delete(id);
    const room = this.rooms.get(m.instance);
    room?.delete(id);
    for (const o of room?.values() ?? []) o.send({ t: "leave", id });
    if (room && room.size === 0) this.rooms.delete(m.instance); // clean up empty instances
  }

  /** The player says which cars they own (after a purchase, sale or repaint). Driving a car they no longer have ends. */
  setCars(id: string, cars: unknown) {
    const m = this.byId.get(id);
    if (!m || m.home) return;
    m.owned = cleanCars(cars);
    if (m.car && !m.owned.some(c => c.model === m.car!.model)) this.drive(id, null);
  }

  /** Get into one of your own cars, or out of it (null). Nobody can drive a car that is not theirs. */
  drive(id: string, car: unknown): boolean {
    const m = this.byId.get(id);
    if (!m || m.home) return false;
    let next: Car | null = null;
    if (car) {
      next = cleanCar(car);
      if (!next || !m.owned.some(c => c.model === next!.model)) return false; // not one of your cars
    }
    if (!next && !m.car) return true;
    m.car = next;
    m.dirty = true;
    for (const o of this.rooms.get(m.instance)?.values() ?? []) o.send({ t: "car", id, car: next });
    return true;
  }

  /** The player says they moved. Accepted moves are kept; others are refused and the client is told where it really is. */
  move(id: string, x: unknown, z: unknown, yaw: unknown, anim: unknown): boolean {
    const m = this.byId.get(id);
    if (!m) return false;
    const t = this.now();
    if (t - m.lastMove < MOVE_EVERY_MS) return false;
    const nx = Number(x), nz = Number(z), ny = Number(yaw), na = Number(anim);
    const refuse = (why: string) => {
      m.strikes++;
      this.opts.suspicious?.(m, why);
      m.send({ t: "fix", x: m.x, z: m.z });
      if (m.strikes >= KICK_AFTER_STRIKES) this.opts.kick?.(m);
      return false;
    };
    if (![nx, nz, ny].every(Number.isFinite) || ![0, 1, 2].includes(na)) return refuse("bad numbers");
    const out = m.home ? nx < 0 || nz < 0 || nx > HOME_SIZE || nz > HOME_SIZE : Math.abs(nx) > LAND_HALF || Math.abs(nz) > LAND_HALF;
    if (out) return refuse(m.home ? "outside the home" : "off the land");
    const gap = Math.min(MAX_GAP_S, (t - m.lastMove) / 1000);
    const top = m.car ? carTop(m.car.model) : m.home ? HOME_SPEED : RUN_SPEED;
    if (Math.hypot(nx - m.x, nz - m.z) > top * SPEED_SLACK * gap + 0.5) return refuse("too fast");
    if (!m.home && blocked(nx, nz, m.car ? CAR_RADIUS : 0.3)) return refuse("inside a wall");
    m.x = nx; m.z = nz; m.yaw = ny; m.anim = na; m.lastMove = t; m.dirty = true;
    if (m.strikes > 0 && gap > 1) m.strikes--; // honest players recover from the odd glitch
    return true;
  }

  /** Proximity chat: heard only by players in the same instance within SAY_RANGE. Returns how many heard it. */
  say(id: string, text: unknown): number {
    const m = this.byId.get(id);
    if (!m || typeof text !== "string") return 0;
    const t = this.now();
    if (t - m.lastSay < SAY_EVERY_MS) return 0;
    const clean = text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_SAY);
    if (!clean) return 0;
    m.lastSay = t;
    let heard = 0;
    for (const o of this.rooms.get(m.instance)?.values() ?? []) {
      if (o === m || m.home || near(m, o, SAY_RANGE)) {
        o.send({ t: "say", id, name: m.name, text: clean });
        if (o !== m) heard++;
      }
    }
    return heard;
  }

  /** Send each player the movements of the players near them that changed. Call about ten times a second. */
  tick() {
    for (const room of this.rooms.values()) {
      const moved = [...room.values()].filter(m => m.dirty);
      if (moved.length) {
        for (const o of room.values()) {
          const ps = moved.filter(m => m !== o && (o.home || near(o, m, SEE_RANGE))).map(m => [m.id, round(m.x), round(m.z), round(m.yaw), m.anim]);
          if (ps.length) o.send({ t: "snap", ps });
        }
        for (const m of moved) m.dirty = false;
      }
    }
  }
}

const near = (a: { x: number; z: number }, b: { x: number; z: number }, r: number) => Math.hypot(a.x - b.x, a.z - b.z) <= r;
const round = (n: number) => Math.round(n * 100) / 100;
