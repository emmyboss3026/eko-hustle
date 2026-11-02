import type { Command, GameState } from "../../engine/game";
import { naira } from "../../engine/economy";
import { activeMission, affordable, offered, storyOf, storyProgress, taskStates } from "../../engine/story";
import { CHAPTERS, STORY } from "../../data/story";
import { useLang } from "../../i18n/react";
import { Progress } from "../ui";

/** 📖 Story: the long path of chapters. Shows the mission you are on, what is open, and what you have finished. */
export default function StoryApp({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t } = useLang();
  const st = storyOf(state);
  const active = activeMission(state);
  const open = offered(state);
  const { done, total } = storyProgress(state);
  const playable = new Set(STORY.map(m => m.chapter));

  return (
    <>
      <div className="note">{t("story.progress", { done, total })}</div>
      <Progress value={done} max={total} label={t("app.story")} />
      <p className="note">{t("story.english")}</p>

      {active && (
        <div className="group" style={{ marginTop: 8 }}>
          <div className="row-title">{active.emoji} {active.title} · <small>{t("story.active")}</small></div>
          <div className="note">📍 {active.place} · {t("story.who", { who: active.who.join(", ") })}</div>
          <p>{active.intro}</p>
          {active.dialogue.map(([who, line], i) => <p key={i} className="note"><b>{who}:</b> {line}</p>)}
          {active.tasks.length > 0 && <h4>{t("story.tasks")}</h4>}
          <ul>
            {active.tasks.map((k, i) => <li key={i}>{taskStates(state, active)[i] ? "✅" : "⬜"} {k.text}</li>)}
          </ul>
          {active.days !== undefined && <div className="note">⏳ {t("story.deadline", { days: active.days, day: st.startDay + active.days })}</div>}
          {st.choosing && active.choice && (
            <>
              <h4>{t("story.choose")}</h4>
              <p>{active.choice.prompt}</p>
              {active.choice.options.map((o, i) => {
                const poor = !affordable(state, o.effect?.money);
                return (
                  <button key={o.label} className="btn" disabled={poor} onClick={() => dispatch({ type: "storyChoose", index: i })}>
                    {o.label}
                    {poor && <small>{t("story.tooPoor")}</small>}
                    {!poor && o.effect?.money ? <small>{o.effect.money > 0 ? "+" : "−"}{naira(Math.abs(o.effect.money))}</small> : null}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}

      {!active && (
        <div className="group" style={{ marginTop: 8 }}>
          {open.length === 0 && <p className="note">{t("story.none")}</p>}
          {open.map(m => (
            <div key={m.id} className="step">
              <div className="step-body">
                <div className="row-title">{m.emoji} {m.title}{st.failed.includes(m.id) && <small> · {t("story.failed")}</small>}</div>
                <div className="note">📍 {m.place} · {naira(m.reward.money ?? 0)}</div>
                <p className="note">{m.intro}</p>
                <button className="btn" onClick={() => dispatch({ type: "storyStart", id: m.id })}>{t("story.start")}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {CHAPTERS.map(c => {
        const list = STORY.filter(m => m.chapter === c.n);
        const finished = list.filter(m => st.done.includes(m.id));
        return (
          <section key={c.n} style={{ marginTop: 12 }}>
            <h3>{c.emoji} {c.n}. {c.title}</h3>
            <div className="note">{c.focus}</div>
            {!playable.has(c.n) && <div className="note">🔒 {t("story.locked")}</div>}
            {finished.length > 0 && (
              <ul>
                {finished.map(m => <li key={m.id}>✅ {m.title}{m.choice && st.choices[m.id] !== undefined ? ` · ${m.choice.options[st.choices[m.id]].label}` : ""}</li>)}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
