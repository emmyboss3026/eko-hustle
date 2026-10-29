import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { generatorOn, powered, type GameState } from "../engine/game";
import { CATALOG, HOME, type FurnitureType } from "../data/home";
import { canPlace } from "../engine/path";
import { HouseView } from "../three/HouseView";
import { useLang } from "../i18n/react";

export type Placing = { type: FurnitureType; uid: number | null; x: number | null; y: number | null; rot: number };

type Props = {
  state: GameState;
  viewRef: MutableRefObject<HouseView | null>;
  selected: number | null;
  onSelect: (uid: number | null) => void;
  placing: Placing | null;
  onPlaceTile: (x: number, y: number) => void;
  shift: number;   // how far to draw the room up the screen (when a panel covers the bottom)
};

const shirts: Record<string, string> = {
  hustler: "#f2b705", bookworm: "#3d7be0", charmer: "#e84393", foodie: "#e17055", sharp: "#00b894",
};

export function placingValid(state: GameState, p: Placing | null): boolean {
  if (!p || p.x === null || p.y === null) return false;
  return canPlace(HOME, state.home.objects, { type: p.type, uid: p.uid ?? undefined, x: p.x, y: p.y, rot: p.rot })
    && (p.uid !== null || state.money >= CATALOG[p.type].price);
}

/** Your room in 3D, filling the whole screen. Tap furniture to use it, tap the floor to walk. */
export default function RoomScene({ state, viewRef, selected, onSelect, placing, onPlaceTile, shift }: Props) {
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
    } catch {
      setNoGl(true); // no WebGL on this device: the menus still work
    }
    return () => {
      viewRef.current?.dispose();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    viewRef.current?.setState(objects, { hour, powered: light, grid: state.power.grid, genRunning: gen, home: true }, selected);
  }, [objects, hour, light, gen, selected, state.power.grid, viewRef]);

  useEffect(() => {
    viewRef.current?.setViewShift(shift);
  }, [shift, viewRef]);

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
  function onPointerUp(e: React.PointerEvent) {
    const start = down.current;
    down.current = null;
    const v = viewRef.current;
    if (!v || !start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7) return;
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
        onPointerDown={e => (down.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={onPointerUp}
        role="img"
        aria-label={t("room.aria")}
      />
      {noGl && <div className="scene-msg">{t("room.noGl")}</div>}
    </>
  );
}
