import { useEffect, useMemo, useState } from "react";
import type { GameState } from "../engine/game";
import { tipsFor } from "../data/tips";
import { useLang } from "../i18n/react";

/** A small "💡 Tip" bubble that reacts to what's going on. Tap › for the next tip, ✕ to hide. */
export default function TipBubble({ state, onHelp }: { state: GameState; onHelp: () => void }) {
  const { t, tx } = useLang();
  const tips = useMemo(() => tipsFor(state), [state]);
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const firstUrgent = tips.find(x => x.urgent)?.id ?? null;

  // A new urgent problem brings the bubble back and shows it first.
  useEffect(() => {
    if (firstUrgent) {
      setHidden(false);
      setIndex(0);
    }
  }, [firstUrgent]);

  // Calm moments: rotate through the general tips every 25 seconds.
  useEffect(() => {
    if (firstUrgent || hidden) return;
    const id = window.setInterval(() => setIndex(i => i + 1), 25_000);
    return () => window.clearInterval(id);
  }, [firstUrgent, hidden]);

  if (hidden || tips.length === 0) {
    return <button className="tip-mini" onClick={() => setHidden(false)} aria-label={t("tipui.show")}>💡</button>;
  }
  const tip = tips[index % tips.length];
  const vars = { ...tip.vars, ...(tip.place ? { place: tx.district(tip.place) } : {}) };
  return (
    <div className={`tip ${tip.urgent ? "urgent" : ""}`} role="status">
      <span className="tip-emoji" aria-hidden>{tip.emoji}</span>
      <span className="tip-text"><b>{t(tip.urgent ? "tipui.urgent" : "tipui.tip")}</b>{t(tip.key, vars)}</span>
      <span className="tip-buttons">
        <button onClick={() => setIndex(i => i + 1)} aria-label={t("tipui.next")}>›</button>
        <button onClick={onHelp} aria-label={t("side.help")}>?</button>
        <button onClick={() => setHidden(true)} aria-label={t("tipui.hide")}>✕</button>
      </span>
    </div>
  );
}
