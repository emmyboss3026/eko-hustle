import { useState } from "react";
import type { Command, GameState } from "../../engine/game";
import {
  activeSides, availableSides, challengeProgress, currentStory, MAX_SIDES, playthrough, storyOf, tasksDone, weekProgress,
} from "../../engine/story";
import { CHALLENGES, storyById } from "../../data/story";
import { CHAPTERS, ROUTES } from "../../data/story/cast";
import { naira } from "../../engine/economy";
import { progressText, taskLabel } from "../../lib/storyText";
import { useLang } from "../../i18n/react";

type View = "now" | "today" | "sides" | "map";

/** 📖 Story: your mission, daily challenges and the weekly event, side missions, and the choices you've made. */
export default function StoryApp({ state, dispatch, onOpen }: { state: GameState; dispatch: (c: Command) => void; onOpen: (id: string | null) => void }) {
  const { t, tx } = useLang();
  const [view, setView] = useState<View>("now");
  const st = storyOf(state);
  const m = currentStory(st);
  const route = ROUTES.find(r => r.id === st.route);

  return (
    <>
      <div className="seg" role="tablist">
        {(["now", "today", "sides", "map"] as View[]).map(v => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>{t(`storyApp.${v}`)}</button>
        ))}
      </div>

      {view === "now" && (
        <>
          {route ? (
            <p className="note">{route.emoji} {t("storyApp.route", { route: tx.route(route.id).name })}</p>
          ) : (
            <p className="note">{t("storyApp.noRoute")}</p>
          )}
          {m ? (
            <button className="row story-row" onClick={() => onOpen(null)}>
              <span className="row-emoji" aria-hidden>{m.emoji}</span>
              <span className="row-main">
                <span className="row-title">{tx.story(m).title}</span>
                <span className="note">{t("story.chapterShort", { n: m.ch })} · {tx.chapter(m.ch).title}</span>
                <span className="note">{tasksDone(state, m, st.cur) ? `✅ ${t("story.readyShort")}` : tx.story(m).goal}</span>
              </span>
              <span className="row-price">›</span>
            </button>
          ) : (
            <p className="lede">🏛️ {t("story.finished")}</p>
          )}
          <p className="note">{t("storyApp.count", { done: state.mission ?? 0, total: st.route ? playthrough(st.route, st.flags).length : 100 })}</p>
        </>
      )}

      {view === "today" && (
        <>
          <h3>✅ {t("storyApp.challenges")}</h3>
          <div className="group">
            {(st.challenges?.ids ?? []).map(cid => {
              const c = CHALLENGES.find(x => x.id === cid);
              if (!c) return null;
              const pr = challengeProgress(state, c);
              const claimed = st.challenges?.claimed.includes(cid);
              return (
                <div key={cid} className="row static">
                  <span className="row-emoji" aria-hidden>{c.emoji}</span>
                  <span className="row-main">
                    <span className="row-title">{tx.challenge(c)}</span>
                    <span className="note">{progressText(c.task, pr.have, pr.need) || (pr.done ? t("story.taskDone") : t("story.taskOpen"))} · {naira(c.money)}</span>
                  </span>
                  {claimed ? <span className="row-price">✔</span> : (
                    <button className="btn small" disabled={!pr.done} onClick={() => dispatch({ type: "story", act: "challenge", id: cid })}>{t("storyApp.claim")}</button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="note">{t("storyApp.challengesInfo")}</p>
          <WeekCard state={state} dispatch={dispatch} />
        </>
      )}

      {view === "sides" && (
        <>
          <p className="note">{t("storyApp.sidesInfo", { n: MAX_SIDES })}</p>
          {activeSides(state).length > 0 && <h3>{t("storyApp.active")}</h3>}
          <div className="group">
            {activeSides(state).map(({ m: sm, p }) => (
              <button key={sm.id} className="row" onClick={() => onOpen(sm.id)}>
                <span className="row-emoji" aria-hidden>{sm.emoji}</span>
                <span className="row-main">
                  <span className="row-title">{tx.story(sm).title}</span>
                  <span className="note">{tasksDone(state, sm, p) ? `✅ ${t("story.readyShort")}` : tx.story(sm).goal}</span>
                </span>
                <span className="row-price">›</span>
              </button>
            ))}
          </div>
          <h3>{t("storyApp.available")}</h3>
          <div className="group">
            {availableSides(state).map(sm => (
              <div key={sm.id} className="row static">
                <span className="row-emoji" aria-hidden>{sm.emoji}</span>
                <span className="row-main">
                  <span className="row-title">{tx.story(sm).title}</span>
                  <span className="note">{tx.story(sm).goal}</span>
                </span>
                <button className="btn small" disabled={(st.sides ?? []).length >= MAX_SIDES} onClick={() => dispatch({ type: "story", act: "side", id: sm.id })}>{t("storyApp.start")}</button>
              </div>
            ))}
            {availableSides(state).length === 0 && <p className="note pad">{t("storyApp.noSides")}</p>}
          </div>
        </>
      )}

      {view === "map" && (
        <div className="story-map">
          {CHAPTERS.map(ch => {
            const mine = st.done.map(id => storyById(id)).filter(x => x && x.ch === ch.n && !x.side);
            const now = m?.ch === ch.n;
            if (!mine.length && !now) return <p key={ch.n} className="note">🔒 {t("story.chapterShort", { n: ch.n })} · {tx.chapter(ch.n).title}</p>;
            return (
              <details key={ch.n} open={now}>
                <summary>{ch.emoji} {t("story.chapterShort", { n: ch.n })} · {tx.chapter(ch.n).title}</summary>
                <p className="note">{tx.chapter(ch.n).blurb}</p>
                <ol>
                  {mine.map(x => {
                    const pick = st.picks[x!.id];
                    return (
                      <li key={x!.id}>
                        {x!.emoji} {tx.story(x!).title}
                        {pick !== undefined && <small> — “{tx.story(x!).choice(pick)}”</small>}
                      </li>
                    );
                  })}
                  {now && m && <li className="now">▶ {tx.story(m).title}</li>}
                </ol>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}

function WeekCard({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t, tx } = useLang();
  const w = weekProgress(state);
  const text = tx.week(w.event);
  return (
    <div className="week-card">
      <h3>{w.event.emoji} {text.title}</h3>
      <p className="note">{text.desc}</p>
      <p><b>{taskLabel(t, tx, w.event.task)}</b> {progressText(w.event.task, w.have, w.need)}</p>
      <p className="note">{t("storyApp.weekReward", { money: naira(w.event.money), rep: w.event.rep })}</p>
      {w.claimed ? <p className="note">✔ {t("story.claimedDone")}</p> : (
        <button className="btn block" disabled={!w.done} onClick={() => dispatch({ type: "story", act: "week" })}>{t("storyApp.claim")}</button>
      )}
    </div>
  );
}
