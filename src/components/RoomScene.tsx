import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { generatorOn, powered, type GameState } from "../engine/game";
import { CATALOG, homePlan, wingLevel, type FurnitureType } from "../data/home";
import { canPlace } from "../engine/path";
import { HouseView } from "../three/HouseView";
import { useLang } from "../i18n/react";
import { footstep } from "../lib/audio";
import { publishHome } from "../lib/homes";
import { multiplayerUrl } from "../lib/multiplayer";
import { useHomeNet } from "./useHomeNet";

/** The wall editor: which tool is chosen, the walls as drawn so far, and how to report a change. `commit` is false while a
 *  drag is still going (just show it) and true when it is let go. */
export type WallEdit = { tool: "move" | "draw" | "erase"; edges: string[]; size: number; onEdit: (edges: string[], commit: boolean) => void };

type Gesture =
  | { kind: "move"; axis: "v" | "h"; at: number; run: number[]; base: string[]; next: string[]; moved: boolean; start: number }
  | { kind: "draw"; axis: "v" | "h"; at: number; from: number; base: string[]; next: string[]; moved: boolean };

const keyOf = (axis: "v" | "h", at: number, i: number) => `${axis}:${at}:${i}`;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** The unbroken stretch of wall that a piece belongs to (doorways break it). */
function runOf(edges: string[], axis: "v" | "h", at: number, i: number): number[] {
  const has = new Set(edges);
  let lo = i, hi = i;
  while (has.has(keyOf(axis, at, lo - 1))) lo--;
  while (has.has(keyOf(axis, at, hi + 1))) hi++;
  return Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
}

export type Placing = { type: FurnitureType; uid: number | null; x: number | null; y: number | null; rot: number };

type Props = {
  state: GameState;
  viewRef: MutableRefObject<HouseView | null>;
  selected: number | null;
  onSelect: (uid: number | null) => void;
  placing: Placing | null;
  editor: WallEdit | null;
  floorMode: boolean;
  onFloorTile: (x: number, y: number) => void;
  onPlaceTile: (x: number, y: number) => void;
  shift: number;   // how far to draw the room up the screen (when a panel covers the bottom)
  firstPerson: boolean; // see through the Sim eyes
  userId: string | null; // signed in: friends you invite can visit, and you see them here
  net: boolean;          // false while you are visiting someone else (you can only be in one place)
};

const shirts: Record<string, string> = {
  hustler: "#f2b705", bookworm: "#3d7be0", charmer: "#e84393", foodie: "#e17055", sharp: "#00b894",
};

export function placingValid(state: GameState, p: Placing | null): boolean {
  if (!p || p.x === null || p.y === null) return false;
  return canPlace(homePlan(wingLevel(state.property), state.home.walls, state.home.floors), state.home.objects, { type: p.type, uid: p.uid ?? undefined, x: p.x, y: p.y, rot: p.rot })
    && (p.uid !== null || state.money >= CATALOG[p.type].price);
}

/** Your room in 3D, filling the whole screen. Tap furniture to use it, tap the floor to walk. */
export default function RoomScene({ state, viewRef, selected, onSelect, placing, editor, floorMode, onFloorTile, onPlaceTile, shift, firstPerson, userId, net: netOn }: Props) {
  const { t } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const [noGl, setNoGl] = useState(false);
  const objects = state.home.objects;
  const light = powered(state);
  const gen = generatorOn(state);
  const hour = (state.time % 1440) / 60;

  useEffect(() => {
    if (!box.current) return;
    try {
      viewRef.current = new HouseView(box.current, state.sim.look ?? { outfit: shirts[state.sim.trait] });
      if (import.meta.env.DEV) (window as unknown as { __room?: unknown }).__room = viewRef.current;   // for testing in the browser
      viewRef.current.onStep = footstep;
    } catch {
      setNoGl(true); // no WebGL on this device: the menus still work
    }
    return () => {
      viewRef.current?.dispose();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wing = wingLevel(state.property);
  const walls = editor ? editor.edges : state.home.walls;
  const floors = state.home.floors;
  useEffect(() => {
    viewRef.current?.setPlan(homePlan(wing, walls, floors));
  }, [wing, walls, floors, viewRef]);

  const editing = !!editor;
  useEffect(() => {
    viewRef.current?.setWallMode(editing);
    if (!editing) viewRef.current?.setCameraLock(false);
  }, [editing, viewRef]);

  useEffect(() => {
    viewRef.current?.setState(objects, { hour, powered: light, grid: state.power.grid, genRunning: gen, home: true }, selected);
  }, [objects, hour, light, gen, selected, state.power.grid, viewRef]);

  // Visitors: join my own home room while I am here, and keep a copy of my furniture for them to see
  const net = useHomeNet(viewRef, userId, { name: state.sim.name, look: (state.sim.look ?? {}) as Record<string, unknown> }, netOn && !!userId);
  useEffect(() => {
    if (!userId || !multiplayerUrl) return;
    const h = setTimeout(() => void publishHome(objects, { wing, walls, floors }), 1_500);
    return () => clearTimeout(h);
  }, [objects, userId, wing, walls, floors]);

  useEffect(() => {
    viewRef.current?.setViewShift(shift);
  }, [shift, viewRef]);

  useEffect(() => {
    viewRef.current?.setFirstPerson(firstPerson);
  }, [firstPerson, viewRef]);

  const valid = placingValid(state, placing);
  useEffect(() => {
    viewRef.current?.setGhost(
      placing && placing.x !== null && placing.y !== null
        ? { type: placing.type, x: placing.x, y: placing.y, rot: placing.rot, valid }
        : null,
    );
  }, [placing, valid, viewRef]);

  // Taps (a drag turns the camera instead)
  const down = useRef<{ x: number; y: number } | null>(null);
  const last = useRef({ x: 0, y: 0 });
  const gesture = useRef<Gesture | null>(null);
  const swallow = useRef(false);   // a drag was a wall gesture, so the let-go is not also a tap

  function beginGesture(e: React.PointerEvent) {
    const v = viewRef.current;
    if (!v || !editor || placing || firstPerson || editor.tool === "erase") return;
    const edge = v.edgeAt(e.clientX, e.clientY, editor.edges);
    if (!edge) return;
    const has = editor.edges.includes(keyOf(edge.axis, edge.at, edge.i));
    if (editor.tool === "move" && !has) return;
    gesture.current = editor.tool === "move"
      ? { kind: "move", axis: edge.axis, at: edge.at, run: runOf(editor.edges, edge.axis, edge.at, edge.i), base: editor.edges, next: editor.edges, moved: false, start: (() => { const g0 = v.groundAt(e.clientX, e.clientY); return g0 ? (edge.axis === "v" ? g0.u : g0.v) : edge.at; })() }
      : { kind: "draw", axis: edge.axis, at: edge.at, from: edge.i, base: editor.edges, next: editor.edges, moved: false };
    v.setCameraLock(true);
  }

  function moveGesture(e: React.PointerEvent) {
    const g = gesture.current;
    const v = viewRef.current;
    if (!g || !v || !editor) return;
    if (Math.hypot(e.clientX - (down.current?.x ?? e.clientX), e.clientY - (down.current?.y ?? e.clientY)) < 8 && !g.moved) return;
    const p = v.groundAt(e.clientX, e.clientY);
    if (!p) return;
    const size = editor.size;
    const across = g.axis === "v" ? p.u : p.v;     // across the wall: where a moved wall goes
    const along = g.axis === "v" ? p.v : p.u;      // along the wall: where a drawn wall stretches to
    let next: string[];
    if (g.kind === "move") {
      const at = clamp(Math.round(g.at + (across - g.start)), 1, size - 1);
      const gone = new Set(g.run.map(i => keyOf(g.axis, g.at, i)));
      next = [...new Set([...g.base.filter(x => !gone.has(x)), ...g.run.map(i => keyOf(g.axis, at, i))])];
    } else {
      const to = clamp(Math.floor(along), 0, size - 1);
      const lo = Math.min(g.from, to), hi = Math.max(g.from, to);
      next = [...new Set([...g.base, ...Array.from({ length: hi - lo + 1 }, (_, k) => keyOf(g.axis, g.at, lo + k))])];
    }
    g.moved = true;
    g.next = next;
    editor.onEdit(next, false);
  }

  function endGesture() {
    const g = gesture.current;
    gesture.current = null;
    viewRef.current?.setCameraLock(false);
    if (!g || !editor) return false;
    if (!g.moved) return false;       // it was a tap: the tap code above handles it
    swallow.current = true;
    editor.onEdit(g.next, true);
    return true;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (endGesture() || swallow.current) { swallow.current = false; down.current = null; return; }
    const start = down.current;
    down.current = null;
    const v = viewRef.current;
    if (!v || !start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7) return;
    if (floorMode) {
      const tile = v.tileAt(e.clientX, e.clientY);
      if (tile) onFloorTile(tile.x, tile.y);
      return;
    }
    if (editor) {
      // A tap on a line puts a piece of wall there, or takes the piece that is there away
      const edge = v.edgeAt(e.clientX, e.clientY, editor.edges);
      if (!edge) return;
      const key = keyOf(edge.axis, edge.at, edge.i);
      const has = editor.edges.includes(key);
      if (editor.tool === "erase" && !has) return;
      editor.onEdit(has ? editor.edges.filter(x => x !== key) : [...editor.edges, key], true);
      return;
    }
    if (placing) {
      const tile = v.tileAt(e.clientX, e.clientY);
      if (tile) onPlaceTile(tile.x, tile.y);
      return;
    }
    const hit = v.pick(e.clientX, e.clientY);
    if (!hit) return;
    if (hit.kind === "object") onSelect(hit.uid);
    else {
      onSelect(null);
      v.walkTo(hit.x, hit.y);
    }
  }

  return (
    <>
      <div
        ref={box}
        className="scene"
        onPointerDown={e => {
          down.current = { x: e.clientX, y: e.clientY };
          last.current = { x: e.clientX, y: e.clientY };
          beginGesture(e);
        }}
        onPointerCancel={() => { gesture.current = null; viewRef.current?.setCameraLock(false); }}
        onPointerMove={e => {
          if (gesture.current) { moveGesture(e); return; }
          // First person: drag to look around
          const v = viewRef.current;
          if (!down.current || !v?.firstPerson) return;
          v.look(e.clientX - last.current.x, e.clientY - last.current.y);
          last.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={onPointerUp}
        role="img"
        aria-label={t("room.aria")}
      />
      {noGl && <div className="scene-msg">{t("room.noGl")}</div>}
      {net.peers.length > 0 && (
        <div className="visit-guests" role="status">
          <b>{t("visit.guests")}</b>
          {net.peers.map(p => (
            <span key={p.id}>{p.name} <button className="chip-btn" onClick={() => net.remove(p.id)} aria-label={t("visit.send", { name: p.name })}>✕</button></span>
          ))}
        </div>
      )}
    </>
  );
}
