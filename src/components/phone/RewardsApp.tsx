import { useEffect, useState } from "react";
import { naira } from "../../engine/economy";
import { DAILY_REWARDS } from "../../data/daily";
import type { DailyStatus } from "../../lib/daily";
import { useLang } from "../../i18n/react";

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

type Props = {
  status: DailyStatus | null;
  onClaim: () => Promise<void>;
  claiming: boolean;
  claimed: { amount: number; day: number } | null;
};

/** 🎁 Daily rewards: a 7-day calendar, your streak, a claim button and a countdown to tomorrow. */
export default function RewardsApp({ status, onClaim, claiming, claimed }: Props) {
  const { t } = useLang();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!status) return <p className="note pad">{t("ui.loading")}</p>;

  // Which calendar day is "today": the next one if you can still claim, else the one you just got
  const current = status.canClaim ? status.nextDay : (status.lastDay ?? 1);
  const streak = status.canClaim ? status.nextDay - 1 : (status.lastDay ?? 0);

  return (
    <>
      <div className="streak">
        <span className="streak-flame" aria-hidden>🔥</span>
        <div>
          <b>{t("daily.streak", { n: streak })}</b>
          <small>{t("daily.lede")}</small>
        </div>
      </div>

      <ol className="cal" aria-label={t("daily.calendar")}>
        {DAILY_REWARDS.map((amount, i) => {
          const day = i + 1;
          const done = day < current || (!status.canClaim && day === current);
          const today = day === current && status.canClaim;
          return (
            <li key={day} className={`cal-day ${done ? "done" : ""} ${today ? "today" : ""} ${day === 7 ? "big" : ""}`}>
              <small>{t("daily.day", { day })}</small>
              <span className="cal-coin" aria-hidden>{day === 7 ? "💰" : "🪙"}</span>
              <b>{naira(amount)}</b>
              {done && <i className="cal-tick" aria-label={t("daily.claimedDay")}>✓</i>}
            </li>
          );
        })}
      </ol>

      {claimed && (
        <div className="claim-pop" role="status">
          <span aria-hidden>🎉</span> {t("daily.got", { money: naira(claimed.amount), day: claimed.day })}
        </div>
      )}

      {status.canClaim ? (
        <button className="btn big block claim-btn" disabled={claiming} onClick={() => void onClaim()}>
          {claiming ? t("daily.claiming") : t("daily.claim", { money: naira(status.nextAmount) })}
        </button>
      ) : (
        <div className="next-reward">
          <small>{t("daily.next", { money: naira(status.nextAmount), day: status.nextDay })}</small>
          <b>{countdown(status.resetsAt - now)}</b>
        </div>
      )}

      <p className="note">{t(status.server ? "daily.server" : "daily.local")}</p>
      <p className="note">{t("daily.noPressure")}</p>

      {status.history.length > 0 && (
        <>
          <h3>{t("daily.history")}</h3>
          <div className="group">
            {status.history.slice(0, 10).map(h => (
              <div key={h.date} className="txn">
                <span className="txn-emoji" aria-hidden>🎁</span>
                <span className="txn-main"><span>{t("daily.day", { day: h.day })}</span><small>{h.date}</small></span>
                <b className="good-text">+{naira(h.amount)}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
