import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Command, GameState } from "../engine/game";
import type { DistrictId } from "../data/places";
import { spotOpen, spots, type SpotId } from "../data/spots";
import { StreetView } from "../three/street.js";
import { DOORS } from "../three/world.js";
import { useLang } from "../i18n/react";
import { chatterKey, PERSONAS, type Persona } from "../data/chatter";
import { footstep, play } from "../lib/audio";

type Props = {
  state: GameState;
  dispatch: (c: Command) => void;
  walking: boolean;            // true: you walk around; false: the camera looks at `focus`
  focus: SpotId | null;        // the place shown when you're not walking
  onEnter: (went: SpotId) => void;
  onStop: () => void;          // stop walking
  firstPerson: boolean;        // see through the Sim's eyes while walking
};

// Where you appear when you step outside in each district
const START: Partial<Record<DistrictId, SpotId>> = { mushin: "home", yaba: "hub", island: "club" };
const DOOR_IDS = Object.keys(DOORS) as SpotId[];

/** The open-world streets, full screen: walk around Lagos in 3D and go in through any door.
 *  When you're not walking, it shows the place you're at. */
export default function StreetScene({ state, dispatch, walking, focus, onEnter, onStop, firstPerson }: Props) {
  const { t, tx } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const bubbleEl = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState<{ id: number; emoji: string; who: string; text: string } | null>(null);
  const [replied, setReplied] = useState<string | null>(null);
  // The newest state and words, for the 3D view's callbacks (which are set up once)
  const live = useRef({ state, t });
  live.current = { state, t };
  const view = useRef<StreetView | null>(null);
  const info = useRef({ hour: 12, grid: true });
  const [near, setNear] = useState<SpotId | null>(null);
  const [run, setRun] = useState(false);
  const [menu, setMenu] = useState(false);
  const [noGl, setNoGl] = useState(false);
  const [target, setTarget] = useState<SpotId | null>(null);
  const joy = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const joyId = useRef<number | null>(null);
  const walkingRef = useRef(walking);
  walkingRef.current = walking;
  const focusRef = useRef(focus);
  focusRef.current = focus;
  // What the 3D view is told: on the street at a spot, or looking at a place
  const scene = useRef<{ sim: { away: Record<string, unknown> } }>({ sim: { away: { kind: "place", place: focus ?? "hub" } } });

  info.current = { hour: (state.time % 1440) / 60, grid: state.power.grid };
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
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = "none";
    el.appendChild(renderer.domElement);

    const sv = new StreetView(renderer, {
      onMove: () => {},
      onArrive: (id: string) => enterRef.current(id as SpotId),
      look: state.sim.look ?? {},
      labelFor: (id: string) => `${spots[id as SpotId]?.emoji ?? "🏠"} ${tx.spot(id as SpotId)}`,
      // A passer-by says something (only while you're walking about)
      onChatter: (persona: Persona) => {
        if (!walkingRef.current || blocked.current) return null;
        const { state: st, t: tt } = live.current;
        const p = PERSONAS.find(x => x.id === persona)!;
        return { emoji: p.emoji, who: tt(`chat.who.${persona}`), text: tt(chatterKey(st, persona, Math.random(), Math.random())) };
      },
    });
    view.current = sv;

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
      setMenu(false);
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
    if (!v || !start || !walking || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7) return;
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
    setMenu(false);
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

      {walking && (
        <>
          <div className="walk-help">
            {target
              ? <>{t("street.walkingTo", { place: `${spots[target].emoji} ${tx.spot(target)}` })}</>
              : <>{t("street.help")}</>}
          </div>

          <div className="walk-actions">
            {near ? (
              <button className="btn big" onClick={() => enterRef.current(near)}>
                🚪 {t("street.goInto", { place: `${spots[near].emoji} ${tx.spot(near)}` })}
                {!spotOpen(near, state.time) && <small> ({t("street.closedNow")})</small>}
              </button>
            ) : (
              <>
                <button className="btn" onClick={() => setMenu(m => !m)} aria-expanded={menu}>📍 {t("street.whereTo")}</button>
                <button className="btn plain" aria-pressed={run} onClick={() => setRun(r => !r)}>🏃🏾 {run ? t("street.running") : t("street.run")}</button>
              </>
            )}
            <button className="btn plain" onClick={onStop}>✕ {t("street.stop")}</button>
          </div>

          {menu && (
            <div className="walk-menu" role="menu">
              <b>{t("street.walkTo")}</b>
              {DOOR_IDS.map(id => (
                <button key={id} role="menuitem" className="row" onClick={() => walkToDoor(id)}>
                  <span className="row-emoji" aria-hidden>{spots[id].emoji}</span>
                  <span className="row-main">
                    <span className="row-title">{tx.spot(id)}</span>
                    <span className="note">{spots[id].district !== "any" && tx.district(spots[id].district as DistrictId)}{spotOpen(id, state.time) ? "" : ` · ${t("street.closedNow")}`}</span>
                  </span>
                </button>
              ))}
            </div>
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
