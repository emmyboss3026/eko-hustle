import { useEffect, useRef, useState, type RefObject } from "react";
import { BUILDINGS, DOORS, ESTATE_CELLS, LAND_HALF, ROAD_HALF, ROAD_LINES, roadPath } from "../three/world.js";
import type { StreetView } from "../three/street.js";
import { spotOpen, spots, type SpotId } from "../data/spots";
import { useLang } from "../i18n/react";

type View = RefObject<StreetView | null>;
type Live = { x: number; z: number; yaw: number; route: [number, number][]; target: string | null };

const routeLength = (pts: [number, number][]) => pts.reduce((n, p, i) => (i ? n + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : n), 0);

/** Where you are, where you are heading and the roads you will take, read from the 3D view. */
function live(view: StreetView | null): Live | null {
  if (!view) return null;
  const route = (view.route ?? []) as [number, number][];
  return { x: view.player.x, z: view.player.z, yaw: view.yaw, route: [[view.player.x, view.player.z], ...route], target: (view.routeDoor ?? view.target ?? null) as string | null };
}

/** Draw the town onto a canvas. (cx, cz) is the world point in the middle; `scale` is pixels per world unit. */
function draw(ctx: CanvasRenderingContext2D, w: number, h: number, cx: number, cz: number, scale: number, l: Live | null, opts: { labels: boolean; selected: string | null; free: [number, number] | null }) {
  const X = (x: number) => w / 2 + (x - cx) * scale;
  const Z = (z: number) => h / 2 + (z - cz) * scale;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#3f8fc7";                                  // the lagoon beyond the land
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#cfe0ae";
  ctx.fillRect(X(-LAND_HALF), Z(-LAND_HALF), 2 * LAND_HALF * scale, 2 * LAND_HALF * scale);
  // the estate: land for sale
  ctx.fillStyle = "#9fd08a";
  for (const [ex, ez] of ESTATE_CELLS) ctx.fillRect(X(ex - 30), Z(ez - 30), 60 * scale, 60 * scale);
  // town buildings
  ctx.fillStyle = "rgba(150, 142, 128, 0.75)";
  for (const b of BUILDINGS) ctx.fillRect(X(b.x - b.w / 2), Z(b.z - b.d / 2), b.w * scale, b.d * scale);
  // roads
  ctx.fillStyle = "#5d616b";
  const rw = ROAD_HALF * 2 * scale;
  for (const line of ROAD_LINES) {
    ctx.fillRect(X(line) - rw / 2, Z(-LAND_HALF), rw, 2 * LAND_HALF * scale);
    ctx.fillRect(X(-LAND_HALF), Z(line) - rw / 2, 2 * LAND_HALF * scale, rw);
  }
  // your route
  if (l && l.route.length > 1) {
    ctx.strokeStyle = "#0b3b36";
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.beginPath();
    l.route.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z))));
    ctx.stroke();
    ctx.strokeStyle = "#2ee6c5";
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }
  // places
  const big = opts.labels;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const id of Object.keys(DOORS) as SpotId[]) {
    const d = DOORS[id as keyof typeof DOORS];
    const sel = opts.selected === id || l?.target === id;
    const r = (big ? 15 : 9) + (sel ? 3 : 0);
    ctx.beginPath();
    ctx.arc(X(d.x), Z(d.z), r, 0, Math.PI * 2);
    ctx.fillStyle = sel ? "#2ee6c5" : "#ffffff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = sel ? "#0b3b36" : "#3b2f8a";
    ctx.stroke();
    ctx.font = `${big ? 17 : 11}px sans-serif`;
    ctx.fillStyle = "#000";
    ctx.fillText(spots[id]?.emoji ?? "📍", X(d.x), Z(d.z) + 1);
  }
  // a point you picked on the big map that is not a place
  if (opts.free) {
    ctx.beginPath();
    ctx.arc(X(opts.free[0]), Z(opts.free[1]), 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ff5f6d";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // you: an arrow pointing the way you face
  if (l) {
    const px = X(l.x), pz = Z(l.z);
    const dx = Math.sin(l.yaw), dz = Math.cos(l.yaw);
    const s = big ? 11 : 8;
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(Math.atan2(dz, dx) + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.75, s * 0.8);
    ctx.lineTo(0, s * 0.35);
    ctx.lineTo(-s * 0.75, s * 0.8);
    ctx.closePath();
    ctx.fillStyle = "#ff3b6b";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

/** A canvas that redraws a few times a second from the live 3D view. */
function useMapCanvas(view: View, size: number, scaleOf: (live: Live | null) => { cx: number; cz: number; scale: number }, opts: { labels: boolean; selected: string | null; free: [number, number] | null }, fps = 8) {
  const ref = useRef<HTMLCanvasElement>(null);
  const optsRef = useRef(opts);
  const scaleRef = useRef(scaleOf);
  useEffect(() => {
    optsRef.current = opts;
    scaleRef.current = scaleOf;
  });
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = size * dpr;
    cv.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const paint = () => {
      const l = live(view.current);
      const { cx, cz, scale } = scaleRef.current(l);
      draw(ctx, size, size, cx, cz, scale, l, optsRef.current);
    };
    paint();
    const timer = setInterval(paint, 1000 / fps);
    return () => clearInterval(timer);
  }, [view, size, fps]);
  return ref;
}

/** The small map in the corner while you walk: you in the middle, places and your route around you. Tap it to open the big map. */
export function MiniMap({ view, onOpen }: { view: View; onOpen: () => void }) {
  const { t } = useLang();
  const SIZE = 124;
  const ref = useMapCanvas(view, SIZE, l => ({ cx: l?.x ?? 0, cz: l?.z ?? 0, scale: 1.05 }), { labels: false, selected: null, free: null }, 8);
  return (
    <button className="minimap" onClick={onOpen} aria-label={t("map.open")} title={t("map.open")}>
      <canvas ref={ref} style={{ width: SIZE, height: SIZE }} />
      <i className="minimap-n" aria-hidden>N</i>
    </button>
  );
}

/** The whole town. Tap a place (or any spot) to pick it, then start the route: you walk there along the roads. */
export function BigMap({ view, time, onGo, onGoPoint, onStop, onClose }: {
  view: View;
  time: number;
  onGo: (id: SpotId) => void;
  onGoPoint: (x: number, z: number) => void;
  onStop: () => void;
  onClose: () => void;
}) {
  const { t, tx } = useLang();
  const [selected, setSelected] = useState<SpotId | null>(null);
  const [free, setFree] = useState<[number, number] | null>(null);
  const SIZE = Math.min(typeof innerWidth === "number" ? innerWidth - 50 : 330, 400);
  const scale = SIZE / (2 * LAND_HALF + 12);
  const ref = useMapCanvas(view, SIZE, () => ({ cx: 0, cz: 0, scale }), { labels: true, selected, free }, 5);

  const here = live(view.current);
  const metres = (x: number, z: number) => (here ? Math.round(routeLength(roadPath([here.x, here.z], [x, z]) as [number, number][])) : 0);
  const places = (Object.keys(DOORS) as SpotId[])
    .map(id => ({ id, d: metres(DOORS[id as keyof typeof DOORS].x, DOORS[id as keyof typeof DOORS].z) }))
    .sort((a, b) => a.d - b.d);

  function tap(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const wx = (e.clientX - r.left - SIZE / 2) / scale, wz = (e.clientY - r.top - SIZE / 2) / scale;
    // the nearest place within a thumb's reach wins; otherwise it is a plain spot on the map
    let best: { id: SpotId; d: number } | null = null;
    for (const id of Object.keys(DOORS) as SpotId[]) {
      const d = Math.hypot(DOORS[id as keyof typeof DOORS].x - wx, DOORS[id as keyof typeof DOORS].z - wz);
      if (d < 16 / scale * 0.9 && (!best || d < best.d)) best = { id, d };
    }
    if (best) { setSelected(best.id); setFree(null); }
    else { setSelected(null); setFree([Math.max(-LAND_HALF, Math.min(LAND_HALF, wx)), Math.max(-LAND_HALF, Math.min(LAND_HALF, wz))]); }
  }

  const pick = selected ? { name: tx.spot(selected), emoji: spots[selected]?.emoji, open: spotOpen(selected, time), m: metres(DOORS[selected as keyof typeof DOORS].x, DOORS[selected as keyof typeof DOORS].z) } : null;
  const go = () => {
    if (selected) onGo(selected);
    else if (free) onGoPoint(free[0], free[1]);
    onClose();
  };

  return (
    <div className="bigmap-backdrop" role="dialog" aria-label={t("map.title")} onClick={e => e.target === e.currentTarget && onClose()}>
      <section className="bigmap">
        <header>
          <b>🗺️ {t("map.title")}</b>
          <button className="btn plain" onClick={onClose} aria-label={t("ui.close")}>✕</button>
        </header>
        <canvas ref={ref} className="bigmap-canvas" style={{ width: SIZE, height: SIZE }} onPointerDown={tap} aria-label={t("map.hint")} />
        <p className="note">{t("map.hint")}</p>
        {(pick || free) && (
          <div className="bigmap-pick">
            <span><b>{pick ? `${pick.emoji ?? "📍"} ${pick.name}` : `📍 ${t("map.spot")}`}</b>
              <small>{t("map.distance", { m: pick ? pick.m : metres(free![0], free![1]) })}{pick && !pick.open ? ` · ${t("street.closedNow")}` : ""}</small></span>
            <button className="btn" onClick={go}>{t("map.go")}</button>
          </div>
        )}
        {here && here.route.length > 1 && <button className="btn plain" onClick={() => { onStop(); onClose(); }}>{t("map.cancel")}</button>}
        <div className="group bigmap-list">
          {places.map(p => (
            <button key={p.id} className={`row ${selected === p.id ? "row-picked" : ""}`} onClick={() => { setSelected(p.id); setFree(null); }}>
              <span className="row-emoji" aria-hidden>{spots[p.id]?.emoji}</span>
              <span className="row-main"><span className="row-title">{tx.spot(p.id)}</span></span>
              <span className="row-price">{p.d} m</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
