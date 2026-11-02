import { useEffect, useRef, useState } from "react";
import type { GameState } from "../engine/game";
import { HouseView } from "../three/HouseView";
import { fetchHome } from "../lib/homes";
import { multiplayerUrl } from "../lib/multiplayer";
import { useLang } from "../i18n/react";
import { useHomeNet } from "./useHomeNet";

type Props = { owner: { id: string; name: string }; state: GameState; onLeave: () => void };

/** A friend's home, full screen. You see their furniture, walk around (tap the floor) and chat with whoever is there. */
export default function VisitScene({ owner, state, onLeave }: Props) {
  const { t } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const view = useRef<HouseView | null>(null);
  const [load, setLoad] = useState<"loading" | "ready" | "denied" | "nogl">("loading");
  const [line, setLine] = useState("");
  const look = (state.sim.look ?? {}) as Record<string, unknown>;
  const net = useHomeNet(view, owner.id, { name: state.sim.name, look }, load === "ready");

  useEffect(() => {
    if (!box.current) return;
    let alive = true;
    try {
      view.current = new HouseView(box.current, state.sim.look);
    } catch {
      setLoad("nogl");
      return;
    }
    // The owner's furniture, if the server says I may see it
    void fetchHome(owner.id).then(objects => {
      if (!alive) return;
      if (!objects) return setLoad("denied");
      view.current?.setState(objects, { hour: (state.time % 1440) / 60, powered: true, grid: true, genRunning: false, home: true }, null);
      setLoad("ready");
    });
    return () => {
      alive = false;
      view.current?.dispose();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner.id]);

  const down = useRef<{ x: number; y: number } | null>(null);
  const problem = !multiplayerUrl ? t("visit.off") : load === "denied" || net.ended === "denied" ? t("visit.denied") : net.ended === "removed" ? t("visit.removed") : load === "nogl" ? t("room.noGl") : null;

  return (
    <div className="visit">
      <div
        ref={box}
        className="scene"
        onPointerDown={e => { down.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={e => {
          const s = down.current;
          down.current = null;
          const v = view.current;
          if (!v || !s || Math.hypot(e.clientX - s.x, e.clientY - s.y) > 7) return;
          const hit = v.pick(e.clientX, e.clientY);
          if (hit?.kind === "tile") v.walkTo(hit.x, hit.y);
        }}
        role="img"
        aria-label={t("visit.aria", { name: owner.name })}
      />
      <header className="visit-bar">
        <b>🏠 {t("visit.title", { name: owner.name })}</b>
        <span className="note">{net.peers.length ? t("visit.with", { names: net.peers.map(p => p.name).join(", ") }) : load === "ready" ? t("visit.alone") : ""}</span>
        <button className="btn" onClick={onLeave}>{t("visit.leave")}</button>
      </header>
      {problem && <div className="scene-msg" role="alert">{problem}</div>}
      {net.said.length > 0 && <div className="mp-said visit-said" aria-live="polite">{net.said.map(m => <div key={m.n}><b>{m.name}</b> {m.text}</div>)}</div>}
      {net.status === "online" && (
        <form className="visit-say" onSubmit={e => { e.preventDefault(); if (line.trim()) net.say(line); setLine(""); }}>
          <input value={line} maxLength={120} onChange={e => setLine(e.target.value)} placeholder={t("mp.sayPlaceholder")} aria-label={t("mp.sayPlaceholder")} />
          <button className="btn plain" type="submit">{t("mp.say")}</button>
        </form>
      )}
    </div>
  );
}
