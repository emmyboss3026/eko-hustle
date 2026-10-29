import { useEffect, useState } from "react";
import type { GameState } from "../engine/game";
import { currentMission, missions } from "../data/missions";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";

/** The current mission as a small card over the game: tap it for the steps. */
export default function MissionCard({ state, onShow }: { state: GameState; onShow: () => void }) {
  const { t, tx } = useLang();
  const m = currentMission(state);
  const index = state.mission ?? 0;
  const [open, setOpen] = useState(false);
  // A new mission starts folded up again
  useEffect(() => setOpen(false), [index]);
  if (!m) return <div className="mission-chip done">{t("mission.allDone")}</div>;
  const mt = tx.mission(m);
  return (
    <section className={`mission-chip ${open ? "open" : ""}`} aria-label={t("mission.current")}>
      <button className="mission-line" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="mission-emoji" aria-hidden>{m.emoji}</span>
        <span className="mission-text">
          <small>{t("mission.counter", { n: index + 1, total: missions.length })}{m.reward ? ` · ${naira(m.reward)}` : ""}</small>
          <b>{mt.title}</b>
          {!open && <span>{mt.goal}</span>}
        </span>
        <span className="mission-toggle">{open ? t("mission.hide") : t("mission.how")}</span>
      </button>
      {open && (
        <div className="mission-body">
          <p>{mt.goal}</p>
          <ol>
            {mt.steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
          <button
            className="btn"
            onClick={() => {
              setOpen(false);
              onShow();
            }}
          >
            {t("mission.show")}
          </button>
        </div>
      )}
      <div className="mission-progress" aria-hidden><i style={{ width: `${(index / missions.length) * 100}%` }} /></div>
    </section>
  );
}
