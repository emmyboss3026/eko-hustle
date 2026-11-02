import type { Command, GameState } from "../engine/game";
import { BLUEPRINTS, type Blueprint } from "../data/blueprints";
import { defaultEdges, tidyEdges, wingLevel } from "../data/home";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";

/** A small drawing of the layout: the walls of a flat with this many tiles across. */
function Plan({ edges, size }: { edges: string[]; size: number }) {
  return (
    <svg className="plan-svg" viewBox={`-0.4 -0.4 ${size + 0.8} ${size + 0.8}`} role="img" aria-hidden>
      <rect x="0" y="0" width={size} height={size} fill="#fff7ea" stroke="#241a6b" strokeWidth="0.35" />
      {edges.map(e => {
        const [axis, at, i] = e.split(":");
        const [a, b] = [+at, +i];
        return axis === "v"
          ? <line key={e} x1={a} y1={b} x2={a} y2={b + 1} stroke="#241a6b" strokeWidth="0.28" strokeLinecap="square" />
          : <line key={e} x1={b} y1={a} x2={b + 1} y2={a} stroke="#241a6b" strokeWidth="0.28" strokeLinecap="square" />;
      })}
    </svg>
  );
}

/** House blueprints: buy a layout once, use it any time. Using one replaces your walls and floors; you can go back. */
export default function BlueprintSheet({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t, tx } = useLang();
  const size = 8 + 2 * wingLevel(state.property);
  const owned = state.home.blueprints ?? [];
  const now = tidyEdges(state.home.walls ?? defaultEdges(wingLevel(state.property)), size);

  const card = (b: Blueprint) => {
    const has = owned.includes(b.id);
    const bt = tx.blueprint(b.id);
    return (
      <div className="plan-card" key={b.id}>
        <Plan edges={b.walls(size)} size={size} />
        <div className="plan-info">
          <b>{b.emoji} {bt.name}</b>
          <span className="note">{bt.desc}</span>
          <button className="btn" disabled={!has && state.money < b.price} onClick={() => dispatch({ type: "blueprint", id: b.id })}>
            {has ? t("plans.use") : t("plans.buy", { price: naira(b.price) })}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <p className="note">{t("plans.lede", { n: size })}</p>
      <div className="plan-card current">
        <Plan edges={now} size={size} />
        <div className="plan-info">
          <b>🏠 {t("plans.current")}</b>
          <span className="note">{t("plans.currentNote")}</span>
          {state.home.prevWalls && <button className="btn plain" onClick={() => dispatch({ type: "restoreLayout" })}>↩ {t("plans.restore")}</button>}
        </div>
      </div>
      {BLUEPRINTS.map(card)}
    </>
  );
}
