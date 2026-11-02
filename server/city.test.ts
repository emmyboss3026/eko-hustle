import { describe, it, expect } from "vitest";
import { Cities, SAY_RANGE, type Member } from "./city.ts";
import { RUN_SPEED } from "../src/three/world.js";

type Msg = Record<string, unknown>;
const setup = (capacity?: number) => {
  let t = 1_000;
  const log: string[] = [];
  const cities = new Cities({ capacity, now: () => t, suspicious: (m, why) => log.push(`${m.id}:${why}`) });
  const inbox = new Map<string, Msg[]>();
  const join = (id: string, want?: string, at?: { x: number; z: number }) => {
    inbox.set(id, []);
    return cities.join({ id, name: id, look: { outfit: "#ff0000" }, at, send: m => inbox.get(id)!.push(m) }, want);
  };
  return { cities, join, inbox, log, advance: (ms: number) => (t += ms) };
};
const last = (inbox: Map<string, Msg[]>, id: string, kind: string) => [...inbox.get(id)!].reverse().find(m => m.t === kind);

describe("instances", () => {
  it("two players land in the same instance and see each other", () => {
    const s = setup();
    s.join("a");
    s.join("b");
    expect(s.cities.get("a")!.instance).toBe(s.cities.get("b")!.instance);
    expect((last(s.inbox, "b", "welcome")!.players as unknown[]).length).toBe(1);
    expect(last(s.inbox, "a", "join")!.p).toMatchObject({ id: "b", name: "b" });
  });

  it("opens a new instance when one is full, and a friend can join a specific one", () => {
    const s = setup(2);
    s.join("a"); s.join("b"); s.join("c");
    expect(s.cities.get("c")!.instance).toBe("002");
    expect(s.cities.list()).toEqual([{ id: "001", count: 2, capacity: 2 }, { id: "002", count: 1, capacity: 2 }]);
    s.join("d", "001"); // 001 is full: d is placed with room instead
    expect(s.cities.get("d")!.instance).toBe("002");
    s.cities.leave("a");
    s.join("e", "001"); // now there is room
    expect(s.cities.get("e")!.instance).toBe("001");
  });

  it("players in different instances never see each other, and empty instances are cleaned up", () => {
    const s = setup(1);
    s.join("a"); s.join("b");
    s.cities.move("a", 0, 6.5, 0, 1);
    s.advance(100);
    s.cities.tick();
    expect(last(s.inbox, "b", "snap")).toBeUndefined();
    s.cities.leave("a");
    expect(s.cities.list().map(i => i.id)).toEqual(["002"]);
  });

  it("a second connection for the same account replaces the first", () => {
    const s = setup();
    s.join("a"); s.join("b");
    s.join("a");
    expect(last(s.inbox, "b", "leave")).toMatchObject({ id: "a" });
    expect(s.cities.list()[0].count).toBe(2);
  });

  it("disconnecting tells everyone else", () => {
    const s = setup();
    s.join("a"); s.join("b");
    s.cities.leave("a");
    expect(last(s.inbox, "b", "leave")).toMatchObject({ id: "a" });
  });
});

describe("movement", () => {
  it("accepts a walk and sends it to others once", () => {
    const s = setup();
    s.join("a"); s.join("b");
    s.advance(500);
    expect(s.cities.move("a", 0, 9, 1.2, 1)).toBe(true);
    s.cities.tick();
    expect(last(s.inbox, "b", "snap")!.ps).toEqual([["a", 0, 9, 1.2, 1]]);
    s.inbox.set("b", []);
    s.cities.tick(); // nothing changed: nothing sent
    expect(s.inbox.get("b")).toEqual([]);
  });

  it("refuses teleporting and speed-hacking, and tells the client where it really is", () => {
    const s = setup();
    const a = s.join("a");
    s.advance(1000);
    expect(s.cities.move("a", 150, 6, 0, 2)).toBe(false);
    expect(last(s.inbox, "a", "fix")).toMatchObject({ x: a.x, z: a.z });
    s.advance(1000);
    const fast = RUN_SPEED * 5; // far more than two seconds of running (the longest gap ever credited)
    expect(s.cities.move("a", fast, 6, 0, 2)).toBe(false);
    expect(s.log.some(l => l.endsWith("too fast"))).toBe(true);
    s.advance(1000);
    expect(s.cities.move("a", RUN_SPEED * 0.9, 6, 0, 2)).toBe(true); // a fair run is fine
  });

  it("refuses the edge of the world, walls and garbage", () => {
    const s = setup();
    s.join("a");
    s.advance(5000);
    expect(s.cities.move("a", 9999, 0, 0, 0)).toBe(false);
    expect(s.cities.move("a", NaN, 0, 0, 0)).toBe(false);
    expect(s.cities.move("a", 0, 6, 0, 7)).toBe(false);
    expect(s.cities.move("a", "x", 0, 0, 0)).toBe(false);
  });

  it("drops moves that arrive too fast to be real", () => {
    const s = setup();
    s.join("a");
    s.advance(500);
    expect(s.cities.move("a", 0, 7, 0, 1)).toBe(true);
    s.advance(10);
    expect(s.cities.move("a", 0, 7.1, 0, 1)).toBe(false);
  });

  it("kicks a player who keeps cheating", () => {
    const kicked: Member[] = [];
    const cities = new Cities({ now: (() => { let t = 0; return () => (t += 100); })(), kick: m => kicked.push(m) });
    cities.join({ id: "a", name: "a", send: () => {} });
    for (let i = 0; i < 40; i++) cities.move("a", 170, 170, 0, 1);
    expect(kicked.length).toBeGreaterThan(0);
  });

  it("spawns where you stepped out, but not inside a wall or off the land", () => {
    const s = setup();
    expect(s.join("a", undefined, { x: 12, z: 3 })).toMatchObject({ x: 12, z: 3 });
    expect(s.join("b", undefined, { x: 5000, z: 3 })).toMatchObject({ x: 0, z: 6 });
  });
});

describe("proximity chat", () => {
  it("is heard only nearby, in the same instance, and is cleaned and rate-limited", () => {
    const s = setup();
    s.join("a", undefined, { x: 0, z: 0 });
    s.join("b", undefined, { x: 5, z: 0 });
    s.join("c", undefined, { x: SAY_RANGE + 40, z: 0 });
    s.advance(2000);
    expect(s.cities.say("a", "  hello\n\n  there \u0007 ")).toBe(1);
    expect(last(s.inbox, "b", "say")).toMatchObject({ name: "a", text: "hello there" });
    expect(last(s.inbox, "c", "say")).toBeUndefined();
    expect(s.cities.say("a", "again")).toBe(0); // too soon
    s.advance(1500);
    s.cities.say("a", "x".repeat(500));
    expect((last(s.inbox, "b", "say")!.text as string).length).toBe(120);
    s.advance(1500);
    expect(s.cities.say("a", "   ")).toBe(0);
  });
});

describe("what a client may send", () => {
  it("names and looks are cleaned", () => {
    const s = setup();
    const m = s.cities.join({ id: "z", name: "<b>Ada</b>  \n", look: { outfit: "#ff0000", hairColor: "javascript:alert(1)", "bad key!": "#fff" }, send: () => {} });
    expect(m.name).toBe("bAdab");
    expect(m.look).toEqual({ outfit: "#ff0000" });
  });
});

describe("homes", () => {
  const inHome = () => {
    const s = setup();
    const send = (id: string) => (m: Msg) => s.inbox.get(id)!.push(m);
    const enter = (id: string, owner: string) => {
      s.inbox.set(id, []);
      return s.cities.joinHome({ id, name: id, send: send(id) }, owner);
    };
    return { ...s, enter };
  };

  it("the owner and a visitor share one room, apart from the city", () => {
    const s = inHome();
    s.join("city-guy");
    const owner = s.enter("owner", "owner");
    const guest = s.enter("guest", "owner");
    expect(owner!.instance).toBe("home:owner");
    expect(guest!.instance).toBe("home:owner");
    expect(last(s.inbox, "guest", "welcome")).toMatchObject({ home: "owner" });
    expect((last(s.inbox, "guest", "welcome")!.players as unknown[]).length).toBe(1);
    expect(last(s.inbox, "owner", "join")!.p).toMatchObject({ id: "guest", x: 2, z: 7 });
    // the city player hears nothing from the home
    s.advance(500);
    s.cities.move("guest", 3, 7, 0, 1);
    s.cities.tick();
    expect(last(s.inbox, "city-guy", "snap")).toBeUndefined();
    expect(last(s.inbox, "owner", "snap")!.ps).toEqual([["guest", 3, 7, 0, 1]]);
  });

  it("homes hold six people, and moves are checked against the room, not the street", () => {
    const s = inHome();
    for (let i = 0; i < 6; i++) expect(s.enter(`p${i}`, "o")).not.toBeNull();
    expect(s.enter("p7", "o")).toBeNull();
    s.advance(2000);
    expect(s.cities.move("p0", 9, 7, 0, 1)).toBe(false);      // outside the 8-tile room
    expect(s.cities.move("p0", 2, 7, 0, 1)).toBe(true);
    s.advance(1000);
    expect(s.cities.move("p0", 30, 7, 0, 1)).toBe(false);     // far too fast for a home
  });

  it("only the owner can send a visitor out", () => {
    const s = inHome();
    s.enter("owner", "owner"); s.enter("guest", "owner"); s.enter("other", "owner");
    expect(s.cities.removeVisitor("guest", "other")).toBe(false);   // a visitor cannot
    expect(s.cities.removeVisitor("owner", "owner")).toBe(false);   // nor remove themself this way
    expect(s.cities.removeVisitor("owner", "guest")).toBe(true);
    expect(last(s.inbox, "guest", "removed")).toBeDefined();
    expect(last(s.inbox, "owner", "leave")).toMatchObject({ id: "guest" });
    expect(s.cities.get("guest")).toBeUndefined();
  });

  it("chat in a home reaches everyone in the room, and leaving cleans the room up", () => {
    const s = inHome();
    s.enter("owner", "owner"); s.enter("guest", "owner");
    s.advance(2000);
    expect(s.cities.say("guest", "hello from the sofa")).toBe(1);
    expect(last(s.inbox, "owner", "say")).toMatchObject({ text: "hello from the sofa" });
    s.cities.leave("owner"); s.cities.leave("guest");
    expect(s.cities.list()).toEqual([]);
  });

  it("walking back to the city leaves the home", () => {
    const s = inHome();
    s.enter("a", "a");
    s.join("a"); // joins the public city: the home seat is given up
    expect(s.cities.get("a")!.instance).toBe("001");
    expect(s.cities.list().map(i => i.id)).toEqual(["001"]);
  });
});


describe("cars", () => {
  const sedan = { model: "sedan", color: "#2d3436" };
  const withCar = () => {
    const s = setup();
    s.join("a"); s.join("b");
    s.cities.setCars("a", [sedan]);
    return s;
  };

  it("an owner can drive their car and others are told", () => {
    const s = withCar();
    expect(s.cities.drive("a", sedan)).toBe(true);
    expect(last(s.inbox, "b", "car")).toMatchObject({ id: "a", car: sedan });
    expect(s.cities.get("a")!.car).toEqual(sedan);
    s.cities.drive("a", null);
    expect(last(s.inbox, "b", "car")).toMatchObject({ id: "a", car: null });
  });

  it("nobody can drive a car that is not theirs, or a made-up model or colour", () => {
    const s = withCar();
    expect(s.cities.drive("b", sedan)).toBe(false);      // b owns nothing
    expect(s.cities.drive("a", { model: "luxury", color: "#2d3436" })).toBe(false); // a does not own that model
    expect(s.cities.drive("a", { model: "sedan", color: "red;<b>" })).toBe(false);
    expect(s.cities.get("a")!.car).toBeNull();
  });

  it("selling the car you are driving puts you out", () => {
    const s = withCar();
    s.cities.drive("a", sedan);
    s.cities.setCars("a", []);
    expect(s.cities.get("a")!.car).toBeNull();
    expect(last(s.inbox, "b", "car")).toMatchObject({ car: null });
  });

  it("a driven car may go faster than a runner, but not faster than its model", () => {
    const s = setup();
    const gt = { model: "sports", color: "#ff3b30" };
    s.join("a");
    s.cities.setCars("a", [gt]);
    s.cities.drive("a", gt);
    s.advance(1000);
    const a = s.cities.get("a")!;
    expect(s.cities.move("a", a.x + 30, a.z, 0, 0)).toBe(true);   // 30 m in a second: over running speed, under a sports car's top
    s.advance(1000);
    expect(s.cities.move("a", a.x + 90, a.z, 0, 0)).toBe(false);  // 60 m more in a second: no sports car does that
  });

  it("a runner cannot move at car speed", () => {
    const s = withCar();
    s.advance(1000);
    const a = s.cities.get("a")!;
    expect(s.cities.move("a", a.x + 30, a.z, 0, 0)).toBe(false);
  });

  it("cars cannot be driven in a home", () => {
    const s = setup();
    s.cities.joinHome({ id: "o", name: "o", send: () => {} }, "o");
    s.cities.setCars("o", [sedan]);
    expect(s.cities.drive("o", sedan)).toBe(false);
  });
});
