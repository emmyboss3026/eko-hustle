import { useState } from "react";
import { clockOf, dayOf, type GameState } from "../../engine/game";
import { naira } from "../../engine/economy";
import { flows, type TxnCat } from "../../engine/phone";
import { businessValue, netWorth, portfolioValue } from "../../engine/progress";
import { useLang } from "../../i18n/react";

const CAT_EMOJI: Record<TxnCat, string> = {
  work: "💼", hustle: "💰", mission: "🎯", reward: "🎁", event: "🎲", family: "👪🏾", food: "🍲", home: "🛋️",
  rent: "🏠", transport: "🚌", goals: "✈️", invest: "📈", business: "🏪", social: "🎉", other: "•",
};

type Range = "today" | "week" | "all";

/** 🏦 Bank: balance, net worth, income vs spending, and every transaction. */
export default function BankApp({ state, onRewards }: { state: GameState; onRewards: () => void }) {
  const { t } = useLang();
  const [range, setRange] = useState<Range>("today");
  const [show, setShow] = useState(15);
  const day = dayOf(state.time);
  const since = range === "today" ? (day - 1) * 1440 : range === "week" ? Math.max(0, (day - 7) * 1440) : 0;
  const f = flows(state, since);
  const cats = (Object.entries(f.byCat) as [TxnCat, number][]).filter(([, v]) => v !== 0).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const list = [...(state.bank ?? [])].reverse();

  return (
    <>
      <div className="bank-card">
        <small>{t("bank.balance")}</small>
        <b>{naira(state.money)}</b>
        <div className="bank-card-row">
          <span>{t("bank.netWorth")}: <b>{naira(netWorth(state))}</b></span>
          {state.rentOwed > 0 && <span className="bad-text">{t("bank.owed", { money: naira(state.rentOwed) })}</span>}
        </div>
        <div className="bank-card-row small">
          <span>📈 {naira(portfolioValue(state))}</span>
          <span>🏪 {naira(businessValue(state))}</span>
        </div>
      </div>

      <div className="seg" role="tablist" aria-label={t("bank.range")}>
        {(["today", "week", "all"] as Range[]).map(r => (
          <button key={r} role="tab" aria-selected={range === r} onClick={() => setRange(r)}>{t(`bank.${r}`)}</button>
        ))}
      </div>
      <div className="flow">
        <div className="flow-in"><small>{t("bank.income")}</small><b>+{naira(f.income)}</b></div>
        <div className="flow-out"><small>{t("bank.spent")}</small><b>−{naira(f.spent)}</b></div>
      </div>
      {cats.length > 0 && (
        <div className="group cat-bars">
          {cats.slice(0, 6).map(([c, v]) => {
            const max = Math.max(...cats.map(([, x]) => Math.abs(x)));
            return (
              <div key={c} className="cat-bar">
                <span>{CAT_EMOJI[c]} {t(`bank.cat.${c}`)}</span>
                <span className="cat-track"><i className={v > 0 ? "up" : "down"} style={{ width: `${(Math.abs(v) / max) * 100}%` }} /></span>
                <b className={v > 0 ? "good-text" : ""}>{v > 0 ? "+" : "−"}{naira(Math.abs(v))}</b>
              </div>
            );
          })}
        </div>
      )}

      <button className="btn plain block" onClick={onRewards}>🎁 {t("bank.rewards")}</button>

      <h3>{t("bank.history")}</h3>
      <div className="group">
        {list.length === 0 && <p className="note pad">{t("bank.empty")}</p>}
        {list.slice(0, show).map((x, i) => (
          <div key={i} className="txn">
            <span className="txn-emoji" aria-hidden>{CAT_EMOJI[x.cat]}</span>
            <span className="txn-main">
              <span>{x.label || t(`bank.cat.${x.cat}`)}</span>
              <small>{t("hud.day", { day: dayOf(x.t) })} · {clockOf(x.t)}</small>
            </span>
            <b className={x.amt > 0 ? "good-text" : ""}>{x.amt > 0 ? "+" : "−"}{naira(Math.abs(x.amt))}</b>
          </div>
        ))}
      </div>
      {list.length > show && <button className="btn plain block" onClick={() => setShow(n => n + 30)}>{t("bank.more")}</button>}
    </>
  );
}
