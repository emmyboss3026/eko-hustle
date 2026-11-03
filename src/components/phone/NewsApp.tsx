import type { GameState } from "../../engine/game";
import { dayOf } from "../../engine/game";
import { useLang } from "../../i18n/react";

export const HEADLINES = 12;
const ICONS = ["📰", "⚡", "🚌", "🌧️", "⚽", "🎶", "🏗️", "🛒", "🎓", "🏥", "🌳", "💡"];

/** Three headlines a day, the same for everyone on the same day. Just for flavour. */
export function headlinesFor(day: number): number[] {
  const out: number[] = [];
  for (let k = 0; out.length < 3; k++) {
    const n = (day * 7 + k * 5 + Math.floor(day / 3)) % HEADLINES;
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

export default function NewsApp({ state }: { state: GameState }) {
  const { t } = useLang();
  const day = dayOf(state.time);
  return (
    <>
      <p className="note">{t("news.date", { day })}</p>
      <div className="group">
        {headlinesFor(day).map(n => (
          <div className="row news-row" key={n}>
            <span className="row-emoji" aria-hidden>{ICONS[n]}</span>
            <span className="row-main">
              <span className="row-title">{t(`news.h${n}`)}</span>
              <span className="note">{t(`news.b${n}`)}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
