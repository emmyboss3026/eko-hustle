import { useState } from "react";
import type { Command, GameState } from "../engine/game";
import {
  choiceState, currentStory, daysLeft, sceneLines, storyBlocker, storyOf, tasksDone,
} from "../engine/story";
import { storyById } from "../data/story";
import { castById } from "../data/story/cast";
import type { Effect, StoryMission } from "../data/story/types";
import { spots } from "../data/spots";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";
import StoryTasks from "./StoryTasks";

type Done = { m: StoryMission; choice?: number; won: boolean };

/** A mission's story: where and who, the intro, the tasks; then the scene, your choice and what it led to. */
export default function StorySheet({ state, dispatch, id, onShow, onClose }: {
  state: GameState;
  dispatch: (c: Command) => void;
  id: string | null;            // null: the main mission you're on
  onShow: () => void;
  onClose: () => void;
}) {
  const { t, tx } = useLang();
  const [done, setDone] = useState<Done | null>(null);
  const [scene, setScene] = useState(false);
  const st = storyOf(state);
  const m = done?.m ?? (id ? storyById(id) : currentStory(st)) ?? null;

  if (done) return <Result done={done} onNext={() => { setDone(null); setScene(false); }} onClose={onClose} />;
  if (!m) {
    return (
      <div className="story">
        <div className="story-badge">🏛️ {t("story.theEnd")}</div>
        <p>{t("story.finished")}</p>
        <button className="btn block" onClick={onClose}>{t("story.continue")}</button>
      </div>
    );
  }

  const mt = tx.story(m);
  const p = st.cur?.id === m.id ? st.cur : st.sides?.find(x => x.id === m.id);
  const active = !!p;
  const ready = active && tasksDone(state, m, p);
  const left = daysLeft(state, m, p);
  const place = spots[m.place];
  const ch = tx.chapter(m.ch);

  function choose(index?: number) {
    const roll = Math.random();
    const c = index !== undefined ? m!.choices?.[index] : undefined;
    const won = !!c?.chance && roll < c.chance.odds;
    const cmd: Command = { type: "story", act: "finish", id: m!.id, choice: index, roll };
    if (storyBlocker(state, cmd)) return;
    dispatch(cmd);
    setDone({ m: m!, choice: index, won });
  }

  return (
    <div className="story">
      <div className="story-badge">{m.side ? `🧩 ${t("story.side")}` : `${t("story.chapterShort", { n: m.ch })} · ${ch.title}`}</div>
      <h3 className="story-title"><span aria-hidden>{m.emoji}</span> {mt.title}</h3>
      <p className="story-where">{place.emoji} {tx.spot(m.place)}{place.district !== "any" ? ` · ${tx.district(place.district)}` : ""}</p>
      <ul className="story-cast" aria-label={t("story.cast")}>
        {m.cast.map(c => (
          <li key={c}><span aria-hidden>{castById(c)?.emoji ?? "🙂"}</span> {tx.castName(c)}<small>{tx.castRole(c)}</small></li>
        ))}
      </ul>

      {!scene && (
        <>
          <p className="story-intro">{mt.intro}</p>
          <p className="story-goal">🎯 {mt.goal}</p>
          {left !== null && <p className="note bad">⏰ {t(left === 1 ? "story.dayLeft" : "story.daysLeft", { n: Math.max(0, left) })} · {t("story.deadlineInfo")}</p>}
          {(st.fails?.[m.id] ?? 0) > 0 && <p className="note">{t("story.retry")}</p>}
          {active && <StoryTasks state={state} mission={m} progress={p} dispatch={dispatch} />}
          <Rewards fx={m.reward} />
          {ready ? (
            <button className="btn block" onClick={() => setScene(true)}>▶ {t("story.playScene")}</button>
          ) : active ? (
            <button className="btn block" onClick={() => { onClose(); onShow(); }}>{t("mission.show")}</button>
          ) : (
            <p className="note">{t("story.notStarted")}</p>
          )}
        </>
      )}

      {scene && (
        <>
          <div className="story-scene">
            {sceneLines(state, m).map(({ line, i }) => {
              const who = castById(line.who);
              return (
                <p key={i} className={`story-line ${line.who === "you" ? "me" : ""}`}>
                  <b><span aria-hidden>{who?.emoji ?? "🙂"}</span> {line.who === "you" ? state.sim.name : tx.castName(line.who)}</b>
                  {line.who === "you" ? mt.line(i).replace(/\{name\}/g, state.sim.name) : mt.line(i)}
                </p>
              );
            })}
          </div>
          <h4 className="story-decide">{t("story.decide")}</h4>
          <div className="story-choices">
            {choiceState(state, m).map(({ index, choice, locked }) => (
              <button key={index} className="btn story-choice" disabled={locked} onClick={() => choose(index)}>
                <span>{mt.choice(index)}</span>
                {choice.fx?.cost ? <small>−{naira(choice.fx.cost)}</small> : null}
                {choice.chance && <small>🎲 {t("story.gamble")}</small>}
                {locked && <small>🔒 {t("story.lockedChoice")}</small>}
              </button>
            ))}
            {choiceState(state, m).length === 0 && <button className="btn block" onClick={() => choose()}>{t("story.finish")}</button>}
          </div>
          <button className="btn plain block" onClick={() => setScene(false)}>‹ {t("story.back")}</button>
        </>
      )}
    </div>
  );
}

function Rewards({ fx }: { fx: Effect }) {
  const { t } = useLang();
  const parts = [
    fx.money ? `💰 ${naira(fx.money)}` : "",
    fx.xp ? `⭐ ${t("story.xp", { n: fx.xp })}` : "",
    fx.rep ? `🌟 ${t("story.rep", { n: fx.rep > 0 ? `+${fx.rep}` : fx.rep })}` : "",
  ].filter(Boolean);
  if (!parts.length) return null;
  return <p className="story-reward">{t("story.reward")}: {parts.join(" · ")}</p>;
}

function Result({ done, onNext, onClose }: { done: Done; onNext: () => void; onClose: () => void }) {
  const { t, tx } = useLang();
  const mt = tx.story(done.m);
  const line = done.choice !== undefined ? (done.won ? mt.win(done.choice) : mt.result(done.choice)) : "";
  return (
    <div className="story story-result" role="status">
      <div className="story-badge">🎯 {t("story.complete")}</div>
      <h3 className="story-title"><span aria-hidden>{done.m.emoji}</span> {mt.title}</h3>
      {done.choice !== undefined && <p className="story-picked">“{mt.choice(done.choice)}”</p>}
      {line && <p className="story-intro">{line}</p>}
      <Rewards fx={done.m.reward} />
      <div className="btn-row">
        {!done.m.side && <button className="btn" onClick={onNext}>{t("story.next")} ›</button>}
        <button className="btn plain" onClick={onClose}>{t("story.continue")}</button>
      </div>
    </div>
  );
}
