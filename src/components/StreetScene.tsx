import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Command, GameState } from "../engine/game";
import { districts, type DistrictId } from "../data/places";
import { spotOpen, spots, type SpotId } from "../data/spots";
import { StreetView } from "../three/street.js";
import { DOORS } from "../three/world.js";

type Props = {
  state: GameState;
  dispatch: (c: Command) => void;
  walking: boolean;            // true: you walk around; false: the camera looks at `focus`
  focus: SpotId | null;        // the place shown when you're not walking
  onEnter: (went: SpotId) => void;
  onStop: () => void;          // stop walking
};

// Where you appear when you step outside in each district
const START: Partial<Record<DistrictId, SpotId>> = { mushin: "home", yaba: "hub", island: "club" };
const DOOR_IDS = Object.keys(DOORS) as SpotId[];

/** The open-world streets, full screen: walk around Lagos in 3D and go in through any door.
 *  When you're not walking, it shows the place you're at. */
export default function StreetScene({ state, dispatch, walking, focus, onEnter, onStop }: Props) {
  const box = useRef<HTMLDivElement>(null);
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
    const frame = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      sv.setActive(walkingRef.current);
      sv.controls.enabled = true; // you can always turn the camera
      sv.setState(scene.current, info.current);
      sv.update(dt, { paused: blocked.current || !walkingRef.current });
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

  // Start walking: step out a few paces from the door of where you are.
  // Stop walking: look at the place you're at.
  useEffect(() => {
    if (walking) {
      const start = DOORS[focusRef.current ?? START[state.location] ?? "home"] ?? DOORS.home;
      const out: Record<string, [number, number]> = { n: [0, -6], s: [0, 6], e: [6, 0], w: [-6, 0] };
      const [ox, oz] = out[start.face] ?? [0, 0];
      scene.current = { sim: { away: { kind: "street", x: start.x + ox, z: start.z + oz, yaw: 0 } } };
    } else {
      scene.current = { sim: { away: { kind: "place", place: focus ?? "hub" } } };
      setMenu(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walking, focus]);

  // Tap: walk to a building's door, or to a spot on the ground
  const down = useRef<{ x: number; y: number } | null>(null);
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
        onPointerDown={e => (down.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={onPointerUp}
        role="img"
        aria-label={walking ? "The streets of Lagos in 3D" : "The place you're at"}
      />
      {noGl && <div className="scene-msg">This device can't show the 3D streets. Use 🚌 Travel to get around.</div>}

      {walking && (
        <>
          <div className="walk-help">
            {target
              ? <>Walking to {spots[target].emoji} <b>{spots[target].name}</b>. Follow the yellow light.</>
              : <>Tap a building to walk to it, or use the thumbstick / arrow keys. Glowing rings are doors.</>}
          </div>

          <div className="walk-actions">
            {near ? (
              <button className="btn big" onClick={() => enterRef.current(near)}>
                🚪 Go into {spots[near].emoji} {spots[near].name}
                {!spotOpen(near, state.time) && <small> (closed now)</small>}
              </button>
            ) : (
              <>
                <button className="btn" onClick={() => setMenu(m => !m)} aria-expanded={menu}>📍 Where to?</button>
                <button className="btn plain" aria-pressed={run} onClick={() => setRun(r => !r)}>🏃🏾 {run ? "Running" : "Run"}</button>
              </>
            )}
            <button className="btn plain" onClick={onStop}>✕ Stop walking</button>
          </div>

          {menu && (
            <div className="walk-menu" role="menu">
              <b>Walk to…</b>
              {DOOR_IDS.map(id => (
                <button key={id} role="menuitem" className="row" onClick={() => walkToDoor(id)}>
                  <span className="row-emoji" aria-hidden>{spots[id].emoji}</span>
                  <span className="row-main">
                    <span className="row-title">{spots[id].name}</span>
                    <span className="note">{spots[id].district !== "any" && districts[spots[id].district as DistrictId].name}{spotOpen(id, state.time) ? "" : " · closed now"}</span>
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
            aria-label="Thumbstick: drag to walk"
          >
            <div ref={knob} className="joy-knob" />
          </div>
        </>
      )}
    </>
  );
}
