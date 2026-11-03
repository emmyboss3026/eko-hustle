import { useState } from "react";
import type { Command, GameState } from "../engine/game";
import { landBlocker } from "../engine/estate";
import { PLOTS, landCost, plotById, plotTier, type Plot } from "../data/estate";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";

/** Land for sale on the estate. The more you spend, the bigger the plot: a wider walled compound, more lawn parking and a
 *  bigger house. Buying one moves you out of the rented flat (no more rent). A bigger plot later gives back 60% of the old one. */
export default function LandSheet({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t, tx } = useLang();
  const have = plotTier(state.property);
  const [pending, setPending] = useState<Plot | null>(null);

  const card = (p: Plot) => {
    const pt = tx.plot(p.tier);
    const mine = have === p.tier;
    const problem = have >= p.tier ? null : landBlocker(state, p.tier);
    return (
      <div className={`plan-card plot-card ${mine ? "current" : ""}`} key={p.tier}>
        <span className="plot-emoji" aria-hidden>{p.emoji}</span>
        <div className="plan-info">
          <b>{pt.name}</b>
          <span className="note">{pt.desc}</span>
          <span className="note">{t("land.perks", { w: p.width, lawn: p.lawn, n: p.house })}</span>
          {mine && <b className="plot-yours">✓ {t("land.yours")}</b>}
          {have < p.tier && (
            <>
              <button className="btn" disabled={!!problem} onClick={() => setPending(p)}>
                {have ? t("land.upgrade", { price: naira(landCost(have, p.tier)) }) : t("land.buy", { price: naira(p.price) })}
              </button>
              {problem && <span className="note bad">{problem}</span>}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <p className="lede">{have ? t("land.have", { name: tx.plot(have).name }) : t("land.rented")}</p>
      <p className="note">{t("land.lede")}</p>
      {pending && (
        <div className="build-confirm" role="alertdialog" aria-label={t("land.confirmTitle")}>
          <div>
            <b>{plotById(pending.tier)?.emoji} {tx.plot(pending.tier).name}</b>
            <div className="note">{have ? t("land.confirmBigger", { price: naira(landCost(have, pending.tier)) }) : t("land.confirmMove", { price: naira(pending.price) })}</div>
          </div>
          <button className="btn" onClick={() => { dispatch({ type: "buyLand", tier: pending.tier }); setPending(null); }}>{t("land.confirm")}</button>
          <button className="btn plain" onClick={() => setPending(null)}>{t("place.cancel")}</button>
        </div>
      )}
      {PLOTS.map(card)}
    </>
  );
}
