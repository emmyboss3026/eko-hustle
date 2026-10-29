import { useEffect, useMemo, useState } from "react";
import type { GameState } from "../engine/game";
import { tipsFor } from "../data/tips";

/** A small "💡 Tip" bubble that reacts to what's going on. Tap › for the next tip, ✕ to hide. */
export default function TipBubble({ state, onHelp }: { state: GameState; onHelp: () => void }) {
  const tips = useMemo(() => tipsFor(state), [state]);
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const firstUrgent = tips.find(t => t.urgent)?.id ?? null;

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
    const t = window.setInterval(() => setIndex(i => i + 1), 25_000);
    return () => window.clearInterval(t);
  }, [firstUrgent, hidden]);

  if (hidden || tips.length === 0) {
    return (
      <button className="tip-mini" onClick={() => setHidden(false)} aria-label="Show tips">💡</button>
    );
  }
  const tip = tips[index % tips.length];
  return (
    <div className={`tip ${tip.urgent ? "urgent" : ""}`} role="status">
      <span className="tip-emoji" aria-hidden>{tip.emoji}</span>
      <span className="tip-text"><b>{tip.urgent ? "Heads up: " : "Tip: "}</b>{tip.text}</span>
      <span className="tip-buttons">
        <button onClick={() => setIndex(i => i + 1)} aria-label="Next tip">›</button>
        <button onClick={onHelp} aria-label="Help">?</button>
        <button onClick={() => setHidden(true)} aria-label="Hide tips">✕</button>
      </span>
    </div>
  );
}
