import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Command, GameState } from "../engine/game";
import type { DistrictId } from "../data/places";
import { spotOpen, spots, type SpotId } from "../data/spots";
import { StreetView } from "../three/street.js";
import { DOORS } from "../three/world.js";
import { useLang } from "../i18n/react";
import { chatterKey, PERSONAS, type Persona } from "../data/chatter";
import { engine, footstep, play, stopEngine } from "../lib/audio";
import { carById, type Property, type Vehicle } from "../data/estate";
import { MiniMap, BigMap } from "./MiniMap";
import { weatherAt } from "../data/weather";
import { Multiplayer, multiplayerUrl, type Say } from "../lib/multiplayer";

type Props = {
  state: GameState;
  dispatch: (c: Command) => void;
  walking: boolean;            // true: you walk around; false: the camera looks at `focus`
  focus: SpotId | null;        // the place shown when you're not walking
  onEnter: (went: SpotId) => void;
  onStop: () => void;          // stop walking
  firstPerson: boolean;        // see through the Sim eyes while walking
  net?: boolean;               // false while visiting a home: you can only be in one place
};

// Where you appear when you step outside in each district
const START: Partial<Record<DistrictId, SpotId>> = { mushin: "home", yaba: "hub", island: "club" };

/** The open-world streets, full screen: walk around Lagos in 3D and go in through any door.
 *  When you're not walking, it shows the place you're at. */
export default function StreetScene({ state, dispatch, walking, focus, onEnter, onStop, firstPerson, net: netOn = true }: Props) {
  const { t, tx } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const bubbleEl = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState<{ id: number; emoji: string; who: string; text: string } | null>(null);
  const [replied, setReplied] = useState<string | null>(null);
  // The newest state and words, for the 3D view's callbacks (which are set up once)
  const live = useRef({ state, t });
  live.current = { state, t };
  const view = useRef<StreetView | null>(null);
  const info = useRef<{ hour: number; grid: boolean; property?: Property; vehicles?: Vehicle[]; rain?: number }>({ hour: 12, grid: true });
  const [car, setCar] = useState<{ uid: number; model: string } | null>(null);   // a car of yours you can get into
  const [drive, setDrive] = useState<{ uid: number; model: string; kmh: number } | null>(null);
  const [near, setNear] = useState<SpotId | null>(null);
  const [run, setRun] = useState(false);
  const [bigMap, setBigMap] = useState(false);
  const [noGl, setNoGl] = useState(false);
  const [target, setTarget] = useState<SpotId | null>(null);
  const joy = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const joyId = useRef<number | null>(null);
  // The live city: other real players on the streets (only when a multiplayer server is configured)
  const [net, setNet] = useState<{ state: "connecting" | "online" | "offline"; instance?: string; count: number }>({ state: "offline", count: 0 });
  const [said, setSaid] = useState<(Say & { n: number })[]>([]);
  const [line, setLine] = useState("");
  const mp = useRef<Multiplayer | null>(null);
  const walkingRef = useRef(walking);
  walkingRef.current = walking;
  const focusRef = useRef(focus);
  focusRef.current = focus;
  // What the 3D view is told: on the street at a spot, or looking at a place
  const scene = useRef<{ sim: { away: Record<string, unknown> } }>({ sim: { away: { kind: "place", place: focus ?? "hub" } } });

  info.current = { hour: (state.time % 1440) / 60, grid: state.power.grid, property: state.property, vehicles: state.vehicles, rain: weatherAt(state.time).strength };
  // While an event card is open you stand still (and can't go in anywhere) until you choose.
  const blocked = useRef(false);
  blocked.current = state.eventId !== null;

  // Go in through a door: you're now at that place (and in its part of Lagos).
  const enterRef = useRef<(id: SpotId) => void>(() => {});
  enterRef.current = (id: SpotId) => {
    if (!walkingRef.current || blocked.current) return;
    const spot = spots[id];
    if (!spot || spot.district === "any") return;
    dispatch({ type: "walk", to: spot.district, spot: id });
    view.current?.setTarget(null);
    setTarget(null);
    onEnter(id);
  };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setNoGl(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));   // phones with 3x screens draw 9 times the pixels for little gain
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.touchAction = "none";
    el.appendChild(renderer.domElement);

    const sv = new StreetView(renderer, {
      onMove: () => {},
      onArrive: (id: string) => enterRef.current(id as SpotId),
      look: state.sim.look ?? {},
      labelFor: (id: string) => (id === "flats" ? `🏢 ${t("land.oldFlat")}` : `${spots[id as SpotId]?.emoji ?? "🏠"} ${tx.spot(id as SpotId)}`),
      // A passer-by says something (only while you're walking about)
      onEngine: (speed: number, throttle: number) => engine(speed, throttle),
      onChatter: (persona: Persona) => {
        if (!walkingRef.current || blocked.current) return null;
        const { state: st, t: tt } = live.current;
        const p = PERSONAS.find(x => x.id === persona)!;
        return { emoji: p.emoji, who: tt(`chat.who.${persona}`), text: tt(chatterKey(st, persona, Math.random(), Math.random())) };
      },
    });
    view.current = sv;
    if (import.meta.env.DEV) (window as unknown as { __eko?: unknown }).__eko = { sv }; // for testing in the browser console

    const fit = () => {
      const w = el.clientWidth || innerWidth;
      const h = el.clientHeight || innerHeight;
      renderer.setSize(w, h);
      sv.resize(w, h);
    };
    fit();
    addEventListener("resize", fit);

    let last = performance.now();
    let raf = 0;
    let lastNear: string | null = null;
    let lastCar: string | null = null;
    let lastKmh = -1;
    let lastDrive: number | null = null;
    let stepClock = 0;
    let shownBubble: number | null = null;
    const frame = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      sv.setActive(walkingRef.current);
      sv.controls.enabled = !sv.fp; // you can always turn the camera (in first person, dragging looks around)
      sv.setState(scene.current, info.current);
      sv.update(dt, { paused: blocked.current || !walkingRef.current });
      // Footsteps while you walk
      if (sv.moving) {
        stepClock -= dt;
        if (stepClock <= 0) {
          footstep();
          stepClock = sv.running ? 0.27 : 0.38;
        }
      } else stepClock = 0;
      // The speech bubble follows the person who is talking
      const b = sv.bubble;
      if (b?.id !== shownBubble) {
        shownBubble = b?.id ?? null;
        setChat(b ? { id: b.id, emoji: b.emoji, who: b.who, text: b.text } : null);
        setReplied(null);
        if (b) play("chat");
      }
      const el = bubbleEl.current;
      if (el && b?.screen) {
        el.style.transform = `translate(${Math.round(b.screen.x)}px, ${Math.round(b.screen.y)}px) translate(-50%, -100%)`;
        el.style.visibility = b.screen.visible ? "visible" : "hidden";
      }
      // Cars: one you can get into, or the speed of the one you are driving
      const nc = sv.nearCar();
      const ncKey = nc ? `${nc.uid}` : null;
      if (ncKey !== lastCar) { lastCar = ncKey; setCar(nc ? { uid: nc.uid, model: nc.model } : null); }
      if (sv.drive) {
        const d = sv.drive;
        const kmh = Math.round((Math.abs(d.speed) / d.top) * (carById(d.e.model)?.topKmh ?? 150));
        if (kmh !== lastKmh || lastDrive !== d.uid) { lastKmh = kmh; lastDrive = d.uid; setDrive({ uid: d.uid, model: d.e.model, kmh }); }
      } else if (lastDrive !== null) { lastDrive = null; lastKmh = -1; setDrive(null); }
      const n = sv.near?.id ?? null;
      if (n !== lastNear) {
        lastNear = n;
        setNear(n as SpotId | null);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", fit);
      sv.setActive(false);
      sv.controls.dispose();
      sv.scene.traverse((o: THREE.Object3D) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
          o.geometry?.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach(x => x.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view.current) view.current.run = run;
  }, [run]);

  useEffect(() => {
    view.current?.setFirstPerson(firstPerson && walking);
  }, [firstPerson, walking]);

  // Join the shared city while you walk the streets, and leave when you stop.
  useEffect(() => {
    if (!walking || !netOn || !multiplayerUrl) return;
    let n = 0;
    let count = 1;
    const conn = new Multiplayer(
      {
        onStatus: st => setNet(p => ({ ...p, state: st.state, instance: st.instance ?? p.instance })),
        onWelcome: peers => {
          view.current?.clearRemotes();
          peers.forEach(p => view.current?.addRemote(p));
          count = peers.length + 1;
          setNet(p => ({ ...p, count }));
        },
        onJoin: p => { view.current?.addRemote(p); setNet(x => ({ ...x, count: ++count })); },
        onLeave: id => { view.current?.removeRemote(id); setNet(x => ({ ...x, count: --count })); },
        onCar: (id, car) => view.current?.setRemoteCar(id, car),
        onSnap: ps => ps.forEach(([id, x, z, yaw, anim]) => view.current?.moveRemote(id, x, z, yaw, anim)),
        onFix: (x, z) => view.current?.player.set(x, 0, z),
        onSay: m => {
          const id = ++n;
          setSaid(l => [...l, { ...m, n: id }].slice(-4));
          setTimeout(() => setSaid(l => l.filter(x => x.n !== id)), 9_000);
        },
      },
      { name: live.current.state.sim.name, look: (live.current.state.sim.look ?? {}) as Record<string, unknown> },
      () => ({ x: view.current?.player.x ?? 0, z: view.current?.player.z ?? 0 }),
    );
    conn.cars((live.current.state.vehicles ?? []).map(v => ({ model: v.model, color: v.color })));
    mp.current = conn;
    // A moment for the view to put you at the door you stepped out of, so the server hears the right spot
    const startTimer = setTimeout(() => conn.start(), 300);
    // Tell the server where you are ten times a second, but only when something changed
    let sent = { x: NaN, z: NaN, yaw: NaN, anim: -1 };
    const timer = setInterval(() => {
      const v = view.current;
      if (!v) return;
      const anim = v.moving ? (v.running ? 2 : 1) : 0;
      const { x, z } = v.player;
      if (Math.hypot(x - sent.x, z - sent.z) < 0.05 && Math.abs(v.yaw - sent.yaw) < 0.05 && anim === sent.anim) return;
      sent = { x, z, yaw: v.yaw, anim };
      conn.move(x, z, v.yaw, anim as 0 | 1 | 2);
    }, 100);
    return () => {
      clearTimeout(startTimer);
      clearInterval(timer);
      conn.stop();
      mp.current = null;
      view.current?.clearRemotes();
      setNet({ state: "offline", count: 0 });
      setSaid([]);
    };
  }, [walking, netOn]);

  // Tell the city which cars you own and which one you are driving: others see it, and the server only lets you drive your own
  useEffect(() => {
    const c = mp.current;
    if (!c || net.state !== "online") return;
    const cars = state.vehicles ?? [];
    c.cars(cars.map(v => ({ model: v.model, color: v.color })));
    const v = drive ? cars.find(x => x.uid === drive.uid) : undefined;
    c.drive(v ? { model: v.model, color: v.color } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net.state, state.vehicles, drive?.uid]);

  // Start walking: step out a few paces from the door of where you are.
  // Stop walking: look at the place you're at.
  useEffect(() => {
    if (walking) {
      const start = DOORS[focusRef.current ?? START[state.location] ?? "home"] ?? DOORS.home;
      const out: Record<string, [number, number]> = { n: [0, -6], s: [0, 6], e: [6, 0], w: [-6, 0] };
      const [ox, oz] = out[start.face] ?? [0, 0];
      // Face away from the door you came out of
      scene.current = { sim: { away: { kind: "street", x: start.x + ox, z: start.z + oz, yaw: Math.atan2(ox, oz) } } };
    } else {
      scene.current = { sim: { away: { kind: "place", place: focus ?? "hub" } } };
      setBigMap(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walking, focus]);

  // Tap: walk to a building's door, or to a spot on the ground
  const down = useRef<{ x: number; y: number } | null>(null);
  const last = useRef({ x: 0, y: 0 });
  function onPointerUp(e: React.PointerEvent) {
    const start = down.current;
    down.current = null;
    const v = view.current;
    if (!v || !start || !walking || v.drive || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7) return;
    const hit = v.pick(e.clientX, e.clientY);
    if (!hit) return;
    if (hit.kind === "door") walkToDoor(hit.id as SpotId);
    else if (hit.x !== undefined && hit.z !== undefined) {
      v.walkTo(hit.x, hit.z);
      v.setTarget(null);
      setTarget(null);
    }
  }

  function walkToDoor(id: SpotId) {
    const v = view.current;
    const d = DOORS[id];
    if (!v || !d) return;
    v.walkTo(d.x, d.z, id);
    v.setTarget(id);
    setTarget(id);
  }

  // The thumbstick for phones: drag from its centre
  function joyMove(e: React.PointerEvent) {
    const r = joy.current!.getBoundingClientRect();
    const R = r.width / 2;
    let dx = e.clientX - (r.left + R);
    let dy = e.clientY - (r.top + R);
    const k = Math.hypot(dx, dy);
    if (k > R) {
      dx *= R / k;
      dy *= R / k;
    }
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    if (view.current) view.current.joy = { x: dx / R, y: -dy / R };
  }
  function joyEnd() {
    joyId.current = null;
    if (knob.current) knob.current.style.transform = "";
    if (view.current) view.current.joy = { x: 0, y: 0 };
  }

  return (
    <>
      <div
        ref={box}
        className="scene"
        onPointerDown={e => {
          down.current = { x: e.clientX, y: e.clientY };
          last.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={e => {
          // First person: drag to look around
          if (!down.current || !view.current?.fp) return;
          view.current.look(e.clientX - last.current.x, e.clientY - last.current.y);
          last.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={onPointerUp}
        role="img"
        aria-label={walking ? t("street.aria") : t("street.ariaPlace")}
      />
      {noGl && <div className="scene-msg">{t("street.noGl")}</div>}
      {walking && chat && (
        <div ref={bubbleEl} className="chat-bubble" role="status" style={{ visibility: "hidden" }}>
          <small>{chat.emoji} {chat.who}</small>
          <span>{chat.text}</span>
          {replied ? (
            <span className="chat-me">{t("chat.you")}: {replied}</span>
          ) : (
            <button
              className="chip-btn"
              onClick={() => {
                const line = t(`chat.youSay.${Math.floor(Math.random() * 3)}`);
                setReplied(line);
                dispatch({ type: "greet" });
                if (view.current?.bubble) view.current.bubble.until = view.current.time + 3; // a moment to read it
              }}
            >
              {t("chat.reply")}
            </button>
          )}
        </div>
      )}

      {walking && multiplayerUrl && (
        <div className="mp-bar">
          <span className={`mp-status ${net.state}`} role="status">
            {net.state === "online" ? t("mp.online", { instance: net.instance ?? "", count: net.count }) : net.state === "connecting" ? t("mp.connecting") : t("mp.offline")}
          </span>
          {said.length > 0 && (
            <div className="mp-said" aria-live="polite">
              {said.map(m => <div key={m.n}><b>{m.name}</b> {m.text}</div>)}
            </div>
          )}
          {net.state === "online" && (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (line.trim()) mp.current?.say(line);
                setLine("");
              }}
            >
              <input value={line} maxLength={120} onChange={e => setLine(e.target.value)} placeholder={t("mp.sayPlaceholder")} aria-label={t("mp.sayPlaceholder")} />
              <button className="btn plain" type="submit">{t("mp.say")}</button>
            </form>
          )}
        </div>
      )}

      {walking && (
        <>
          <div className="walk-help">
            {target
              ? <>{t("street.walkingTo", { place: `${spots[target].emoji} ${tx.spot(target)}` })}</>
              : <>{t("street.help")}</>}
          </div>

          {drive && (
            <div className="drive-hud" role="status" aria-label={t("drive.speed")}>
              <b>{drive.kmh}</b><small>km/h</small>
            </div>
          )}

          {/* the controls sit beside the stick and the map, low on the screen, so the view stays clear */}
          {!drive && (near || car) && (
            <div className="walk-context">
              {near ? (
                <button className="btn big" onClick={() => enterRef.current(near)}>
                  🚪 {t("street.goInto", { place: `${spots[near].emoji} ${tx.spot(near)}` })}
                  {!spotOpen(near, state.time) && <small> ({t("street.closedNow")})</small>}
                </button>
              ) : car && (
                <button className="btn big" onClick={() => view.current?.startDrive(car.uid)}>
                  🚗 {t("drive.start", { car: carById(car.model)?.name ?? "" })}
                </button>
              )}
            </div>
          )}

          <div className="walk-actions">
            {drive ? (
              <>
                <button
                  className="round-btn"
                  aria-label={t("drive.brake")}
                  title={t("drive.brake")}
                  onPointerDown={() => { if (view.current) view.current.brake = true; }}
                  onPointerUp={() => { if (view.current) view.current.brake = false; }}
                  onPointerLeave={() => { if (view.current) view.current.brake = false; }}
                >🛑<small>{t("drive.brake")}</small></button>
                <button
                  className="round-btn"
                  disabled={drive.kmh > 6}
                  aria-label={t("drive.park")}
                  title={t("drive.park")}
                  onClick={() => {
                    const r = view.current?.stopDrive();
                    stopEngine();
                    if (r) dispatch({ type: "parkCar", uid: r.uid, x: r.x, z: r.z, yaw: r.yaw });
                  }}
                >🅿️<small>{t("drive.parkShort")}</small></button>
              </>
            ) : (
              <button className="round-btn" aria-pressed={run} aria-label={run ? t("street.running") : t("street.run")} title={run ? t("street.running") : t("street.run")} onClick={() => setRun(r => !r)}>
                {run ? "🏃🏾" : "🚶🏾"}<small>{run ? t("street.runShort") : t("street.walkShort")}</small>
              </button>
            )}
            <button className="round-btn" aria-label={t("map.open")} title={t("map.open")} onClick={() => setBigMap(true)}>🗺️<small>{t("map.short")}</small></button>
            <button className="round-btn" aria-label={t("street.stop")} title={t("street.stop")} onClick={onStop}>✕<small>{t("street.stopShort")}</small></button>
          </div>

          <MiniMap view={view} onOpen={() => setBigMap(true)} />
          {bigMap && (
            <BigMap
              view={view}
              time={state.time}
              onGo={walkToDoor}
              onGoPoint={(x, z) => { const v = view.current; if (v) { v.walkTo(x, z); v.setTarget(null); setTarget(null); } }}
              onStop={() => { const v = view.current; if (v) { v.route = []; v.routeDoor = null; v.setTarget(null); setTarget(null); } }}
              onClose={() => setBigMap(false)}
            />
          )}

          <div
            ref={joy}
            className="joy"
            onPointerDown={e => {
              joyId.current = e.pointerId;
              try {
                joy.current?.setPointerCapture(e.pointerId);
              } catch {
                // some browsers refuse: the stick still works
              }
              joyMove(e);
            }}
            onPointerMove={e => {
              if (e.pointerId === joyId.current) joyMove(e);
            }}
            onPointerUp={joyEnd}
            onPointerCancel={joyEnd}
            aria-label={t("street.stick")}
          >
            <div ref={knob} className="joy-knob" />
          </div>
        </>
      )}
    </>
  );
}
