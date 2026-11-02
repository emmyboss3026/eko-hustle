import { useEffect, useState } from "react";
import type { Command, GameState } from "../engine/game";
import { currentStory, daysLeft, playthrough, storyOf, tasksDone } from "../engine/story";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";
import StoryTasks from "./StoryTasks";

/** The current mission as a small card over the game: tap it for the tasks, the story and "Show me". */
export default function MissionCard({ state, dispatch, onShow, onStory }: {
  state: GameState;
  dispatch: (c: Command) => void;
  onShow: () => void;
  onStory: () => void;
}) {
  const { t, tx } = useLang();
  const st = storyOf(state);
  const m = currentStory(st);
  const [open, setOpen] = useState(false);
  // A new mission starts folded up again
  useEffect(() => setOpen(false), [m?.id]);
  if (!m) return <button className="mission-chip done" onClick={onStory}>{t("mission.allDone")}</button>;

  const mt = tx.story(m);
  const total = st.route ? playthrough(st.route, st.flags).length : 100;
  const n = (state.mission ?? 0) + 1;
  const ready = tasksDone(state, m, st.cur);
  const left = daysLeft(state, m, st.cur);
  return (
    <section className={`mission-chip ${open ? "open" : ""} ${ready ? "ready" : ""}`} aria-label={t("mission.current")}>
      <button className="mission-line" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="mission-emoji" aria-hidden>{m.emoji}</span>
        <span className="mission-text">
          <small>
            {t("story.chapterShort", { n: m.ch })} · {t("mission.counter", { n, total })}
            {m.reward.money ? ` · ${naira(m.reward.money)}` : ""}
            {left !== null && ` · ⏰ ${t(left === 1 ? "story.dayLeft" : "story.daysLeft", { n: Math.max(0, left) })}`}
          </small>
          <b>{mt.title}</b>
          {!open && <span>{ready ? t("story.readyShort") : mt.goal}</span>}
        </span>
        <span className="mission-toggle">{open ? t("mission.hide") : t("mission.how")}</span>
      </button>
      {ready && !open && (
        <button className="btn mission-finish" onClick={onStory}>▶ {t("story.finish")}</button>
      )}
      {open && (
        <div className="mission-body">
          <p>{mt.goal}</p>
          <StoryTasks state={state} mission={m} progress={st.cur} dispatch={dispatch} />
          {mt.steps.length > 0 && !ready && (
            <ol className="mission-steps">
              {mt.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          )}
          <div className="btn-row">
            {ready ? (
              <button className="btn" onClick={onStory}>▶ {t("story.finish")}</button>
            ) : (
              <button className="btn" onClick={() => { setOpen(false); onShow(); }}>{t("mission.show")}</button>
            )}
            <button className="btn plain" onClick={onStory}>📖 {t("story.read")}</button>
          </div>
        </div>
      )}
      <div className="mission-progress" aria-hidden><i style={{ width: `${Math.min(100, ((n - 1) / total) * 100)}%` }} /></div>
    </section>
  );
}
