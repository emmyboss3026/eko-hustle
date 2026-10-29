import { useState } from "react";
import { clockOf, dayOf, type GameState } from "../engine/game";
import { naira } from "../engine/economy";
import { loadLives } from "../lib/lives";
import { useLang } from "../i18n/react";

/** Your diary (everything that has happened, by day) and your past lives. */
export default function DiarySheet({ state }: { state: GameState }) {
  const { t } = useLang();
  const [days, setDays] = useState(3);
  const [query, setQuery] = useState("");
  const diary = state.diary ?? state.log.slice().reverse().map(line => ({ t: state.time, line }));
  const q = query.trim().toLowerCase();
  const filtered = q ? diary.filter(d => d.line.toLowerCase().includes(q)) : diary;
  // Group by day, newest day first
  const byDay = new Map<number, typeof diary>();
  for (const d of filtered) {
    const day = dayOf(d.t);
    byDay.set(day, [...(byDay.get(day) ?? []), d]);
  }
  const dayList = [...byDay.keys()].sort((a, b) => b - a);
  const lives = loadLives();

  return (
    <>
      <p className="lede">{t("diary.lede")}</p>
      <label className="field">
        {t("diary.search")}
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("diary.searchHint")} />
      </label>
      {dayList.length === 0 && <p className="note">{t("diary.empty")}</p>}
      {dayList.slice(0, days).map(day => (
        <section key={day}>
          <h3>{t("diary.day", { day })}</h3>
          <div className="group">
            <ul className="log diary">
              {[...(byDay.get(day) ?? [])].reverse().map((d, i) => (
                <li key={i}><span className="diary-time">{clockOf(d.t)}</span> {d.line}</li>
              ))}
            </ul>
          </div>
        </section>
      ))}
      {dayList.length > days && (
        <button className="btn plain block" onClick={() => setDays(d => d + 5)}>{t("diary.more")}</button>
      )}

      <h3>👻 {t("lives.title")}</h3>
      <div className="group">
        {lives.length === 0 && <p className="note pad">{t("lives.none")}</p>}
        {lives.map(l => (
          <div key={l.id} className="plan-row">
            <b>{l.avatar} {l.name}</b>
            <span>{t(`ending.${l.ending}.short`)} · {t("diary.day", { day: l.day })} · {t("lives.earned", { money: naira(l.earned) })}</span>
          </div>
        ))}
      </div>
    </>
  );
}
