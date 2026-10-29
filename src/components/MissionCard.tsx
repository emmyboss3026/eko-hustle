import { useEffect, useState } from "react";
import type { GameState } from "../engine/game";
import { currentMission, missions } from "../data/missions";
import { naira } from "../engine/economy";

/** The current mission as a small card over the game: tap it for the steps. */
export default function MissionCard({ state, onShow }: { state: GameState; onShow: () => void }) {
  const m = currentMission(state);
  const index = state.mission ?? 0;
  const [open, setOpen] = useState(false);
  // A new mission starts folded up again
  useEffect(() => setOpen(false), [index]);
  if (!m) {
    return <div className="mission-chip done">🏆 All missions done! Chase your dream in ✈️ Goals.</div>;
  }
  return (
    <section className={`mission-chip ${open ? "open" : ""}`} aria-label="Current mission">
      <button className="mission-line" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="mission-emoji" aria-hidden>{m.emoji}</span>
        <span className="mission-text">
          <small>🎯 Mission {index + 1}/{missions.length}{m.reward ? ` · ${naira(m.reward)}` : ""}</small>
          <b>{m.title}</b>
          {!open && <span>{m.goal}</span>}
        </span>
        <span className="mission-toggle">{open ? "Hide" : "How?"}</span>
      </button>
      {open && (
        <div className="mission-body">
          <p>{m.goal}</p>
          <ol>
            {m.steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
          <button
            className="btn"
            onClick={() => {
              setOpen(false);
              onShow();
            }}
          >
            👉 Show me
          </button>
        </div>
      )}
      <div className="mission-progress" aria-hidden><i style={{ width: `${(index / missions.length) * 100}%` }} /></div>
    </section>
  );
}
