import { useState } from "react";
import { dayOf, type Command, type GameState } from "../../engine/game";
import { naira } from "../../engine/economy";
import { holdings, phoneBlocker } from "../../engine/phone";
import { seedOf } from "../../engine/progress";
import { FUNDS, MIN_INVEST, priceHistory, type Fund, type FundId } from "../../data/invest";
import { useLang } from "../../i18n/react";

/** A small price chart for the last few weeks. */
function Spark({ values }: { values: number[] }) {
  const v = values.slice(-28);
  if (v.length < 2) return <svg className="spark" viewBox="0 0 100 30" aria-hidden />;
  const min = Math.min(...v);
  const max = Math.max(...v);
  const pts = v.map((p, i) => `${(i / (v.length - 1)) * 100},${28 - ((p - min) / (max - min || 1)) * 26}`).join(" ");
  const up = v[v.length - 1] >= v[0];
  return (
    <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke={up ? "#0b7a4b" : "#c8341e"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const pct = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n * 100).toFixed(1)}%`;

/** 📈 Invest: fictional funds with daily price moves. Low risk is steady, high risk swings. */
export default function InvestApp({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState<FundId | null>(null);
  const [amount, setAmount] = useState(5_000);
  const day = dayOf(state.time);
  const seed = seedOf(state);
  const mine = holdings(state);
  const total = mine.reduce((a, h) => a + h.value, 0);
  const pnl = mine.reduce((a, h) => a + h.pnl, 0);
  const realised = (state.trades ?? []).reduce((a, x) => a + (x.pnl ?? 0), 0);

  return (
    <>
      <p className="note">{t("invest.lede")}</p>
      <div className="bank-card invest">
        <small>{t("invest.portfolio")}</small>
        <b>{naira(total)}</b>
        <div className="bank-card-row">
          <span>{t("invest.open")}: <b className={pnl >= 0 ? "good-text" : "bad-text"}>{pnl >= 0 ? "+" : "−"}{naira(Math.abs(pnl))}</b></span>
          <span>{t("invest.realised")}: <b className={realised >= 0 ? "good-text" : "bad-text"}>{realised >= 0 ? "+" : "−"}{naira(Math.abs(realised))}</b></span>
        </div>
      </div>

      <h3>{t("invest.funds")}</h3>
      <div className="group">
        {FUNDS.map((f: Fund) => {
          const hist = priceHistory(seed, f, day);
          const price = hist[hist.length - 1];
          const dayChange = hist.length > 1 ? price / hist[hist.length - 2] - 1 : 0;
          const weekChange = price / hist[Math.max(0, hist.length - 8)] - 1;
          const held = mine.find(h => h.fund.id === f.id);
          const isOpen = open === f.id;
          const min = Math.max(MIN_INVEST, f.min ?? 0);
          const buy = { type: "invest", fund: f.id, amount } as const;
          const buyProblem = phoneBlocker(state, buy);
          return (
            <div key={f.id} className={`fund ${isOpen ? "open" : ""}`}>
              <button className="fund-head" aria-expanded={isOpen} onClick={() => { setOpen(isOpen ? null : f.id); setAmount(Math.max(min, Math.min(amount, state.money))); }}>
                <span className="row-emoji" aria-hidden>{f.emoji}</span>
                <span className="fund-main">
                  <b>{t(`fund.${f.id}.name`)}</b>
                  <span className="risk" aria-label={t("invest.riskAria", { risk: f.risk })}>
                    {t("invest.risk")} {"●".repeat(f.risk)}<i>{"●".repeat(5 - f.risk)}</i>
                  </span>
                </span>
                <Spark values={hist} />
                <span className="fund-price">
                  <b>{naira(price)}</b>
                  <small className={dayChange >= 0 ? "good-text" : "bad-text"}>{pct(dayChange)}</small>
                </span>
              </button>
              {held && (
                <div className="fund-held">
                  {t("invest.youHold", { money: naira(held.value) })} · <span className={held.pnl >= 0 ? "good-text" : "bad-text"}>{held.pnl >= 0 ? "+" : "−"}{naira(Math.abs(held.pnl))}</span>
                </div>
              )}
              {isOpen && (
                <div className="fund-body">
                  <p className="note">{t(`fund.${f.id}.desc`)}</p>
                  <p className="note">{t("invest.week", { change: pct(weekChange) })} · {t("invest.minimum", { money: naira(min) })}</p>
                  <label className="field">
                    {t("invest.amount")}
                    <input type="number" inputMode="numeric" min={min} step={1000} value={amount}
                      onChange={e => setAmount(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
                  </label>
                  <div className="chips-row">
                    {[min, 10_000, 50_000, Math.floor(state.money / 1000) * 1000].filter((v, i, a) => v >= min && a.indexOf(v) === i).map(v => (
                      <button key={v} className="chip-btn" onClick={() => setAmount(v)}>{naira(v)}</button>
                    ))}
                  </div>
                  <button className="btn block" disabled={!!buyProblem} onClick={() => dispatch(buy)}>
                    {t("invest.buy", { money: naira(amount) })}
                  </button>
                  {buyProblem && <p className="note bad">{t(buyProblem)}</p>}
                  {held && (
                    <div className="btn-row">
                      <button className="btn plain" onClick={() => dispatch({ type: "sellFund", fund: f.id, share: 0.5 })}>{t("invest.sellHalf")}</button>
                      <button className="btn plain" onClick={() => dispatch({ type: "sellFund", fund: f.id, share: 1 })}>{t("invest.sellAll", { money: naira(held.value) })}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(state.trades ?? []).length > 0 && (
        <>
          <h3>{t("invest.history")}</h3>
          <div className="group">
            {[...(state.trades ?? [])].reverse().slice(0, 12).map((x, i) => (
              <div key={i} className="txn">
                <span className="txn-emoji" aria-hidden>{FUNDS.find(f => f.id === x.fund)?.emoji}</span>
                <span className="txn-main">
                  <span>{t(x.side === "buy" ? "invest.bought" : "invest.sold", { fund: t(`fund.${x.fund}.name`) })}</span>
                  <small>{t("hud.day", { day: dayOf(x.t) })}{x.pnl !== undefined ? ` · ${x.pnl >= 0 ? "+" : "−"}${naira(Math.abs(x.pnl))}` : ""}</small>
                </span>
                <b>{naira(x.amount)}</b>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="note">{t("invest.disclaimer")}</p>
    </>
  );
}
