import { type Command, type GameState } from "../../engine/game";
import { naira } from "../../engine/economy";
import { phoneBlocker } from "../../engine/phone";
import { storyFlag } from "../../engine/progress";
import { BIZ_RESALE, BUSINESSES, expectedProfit, MAX_BIZ_LEVEL, bizById } from "../../data/business";
import { useLang } from "../../i18n/react";

/** 🏪 Business: buy small businesses, upgrade them, hire staff, and watch the daily profit. */
export default function BizApp({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t, tx } = useLang();
  const owned = state.businesses ?? [];
  const totalLast = owned.reduce((a, o) => a + (o.lastProfit ?? 0), 0);
  const hustle = state.skills.hustle;

  return (
    <>
      <p className="note">{t("biz.lede")}</p>
      {owned.length > 0 && (
        <div className="bank-card biz">
          <small>{t("biz.yesterday")}</small>
          <b className={totalLast < 0 ? "bad-text" : ""}>{totalLast >= 0 ? "+" : "−"}{naira(Math.abs(totalLast))}</b>
          <div className="bank-card-row"><span>{t("biz.count", { n: owned.length })}</span></div>
        </div>
      )}

      {owned.map(o => {
        const b = bizById(o.id)!;
        const up = { type: "upgradeBiz", id: o.id } as const;
        const upProblem = phoneBlocker(state, up);
        return (
          <div key={o.id} className="biz-card">
            <div className="biz-head">
              <span className="row-emoji" aria-hidden>{b.emoji}</span>
              <span className="row-main">
                <b>{t(`biz.${o.id}.name`)}</b>
                <small>{t("biz.levelStaff", { level: o.level, max: MAX_BIZ_LEVEL, staff: o.staff, maxStaff: b.maxStaff })}</small>
              </span>
              <span className="fund-price">
                <small>{t("biz.last")}</small>
                <b className={(o.lastProfit ?? 0) < 0 ? "bad-text" : "good-text"}>{o.lastProfit === undefined ? "—" : `${o.lastProfit >= 0 ? "+" : "−"}${naira(Math.abs(o.lastProfit))}`}</b>
              </span>
            </div>
            <div className="biz-stats">
              <span>{t("biz.expected", { money: naira(expectedProfit(b, o, hustle)) })}</span>
              <span>{t("biz.wages", { money: naira(b.wage * o.staff + b.upkeep) })}</span>
            </div>
            <div className="btn-row wrap">
              <button className="btn" disabled={!!upProblem} onClick={() => dispatch(up)}>
                ⬆️ {o.level >= MAX_BIZ_LEVEL ? t("biz.maxed") : t("biz.upgrade", { money: naira(b.upgrade * o.level) })}
              </button>
              <button className="btn plain" disabled={!!phoneBlocker(state, { type: "staff", id: o.id, by: 1 })} onClick={() => dispatch({ type: "staff", id: o.id, by: 1 })}>➕ {t("biz.hire")}</button>
              <button className="btn plain" disabled={!!phoneBlocker(state, { type: "staff", id: o.id, by: -1 })} onClick={() => dispatch({ type: "staff", id: o.id, by: -1 })}>➖ {t("biz.fire")}</button>
              <button className="btn plain" onClick={() => dispatch({ type: "sellBiz", id: o.id })}>💸 {t("biz.sell", { money: naira(o.invested * BIZ_RESALE) })}</button>
            </div>
            {o.staff === 0 && <p className="note">{t("biz.noStaff")}</p>}
          </div>
        );
      })}

      <h3>{t("biz.forSale")}</h3>
      <div className="group">
        {BUSINESSES.filter(b => !owned.some(o => o.id === b.id) && storyFlag(state, b.flag)).map(b => {
          const cmd = { type: "buyBiz", id: b.id } as const;
          const problem = phoneBlocker(state, cmd);
          return (
            <button key={b.id} className="row" disabled={!!problem} onClick={() => dispatch(cmd)}>
              <span className="row-emoji" aria-hidden>{b.emoji}</span>
              <span className="row-main">
                <span className="row-title">{t(`biz.${b.id}.name`)}</span>
                <span className="note">{t(`biz.${b.id}.desc`)}</span>
                <span className="note">{t("biz.expected", { money: naira(expectedProfit(b, { level: 1, staff: 1 }, hustle)) })}</span>
                {b.req && <span className="note">{t("biz.needs", { req: tx.req(b.req) })}</span>}
                {problem && problem !== "problem.noMoney" && <span className="note bad">{t(problem)}</span>}
              </span>
              <span className="row-price">{naira(b.price)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
