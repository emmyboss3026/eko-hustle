import { useEffect, useRef, useState } from "react";
import type { Command, GameState } from "../engine/game";
import { currentStory, storyOf, tasksDone } from "../engine/story";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";

/** Missions no longer sit on the screen. A small notification slides in when a mission opens or its tasks are done,
 *  stays a few seconds, then goes away. Tap it to open the story. The 📖 Story app on the phone always has the full list. */
export default function MissionCard({ state, onStory }: {
  state: GameState;
  dispatch?: (c: Command) => void;
  onShow?: () => void;
  onStory: () => void;
}) {
  const { t, tx } = useLang();
  const st = storyOf(state);
  const m = currentStory(st);
  const ready = m ? tasksDone(state, m, st.cur) : false;
  const key = m ? `${m.id}:${ready ? "ready" : "new"}` : null;
  const [shown, setShown] = useState<string | null>(null);
  const seen = useRef<string | null>(null);

  useEffect(() => {
    if (!key || seen.current === key) return;
    seen.current = key;
    setShown(key);
    const id = setTimeout(() => setShown(null), 8_000);
    return () => clearTimeout(id);
  }, [key]);

  if (!m || shown !== key) return null;
  const mt = tx.story(m);
  return (
    <button
      className={`toast ${ready ? "ready" : ""}`}
      role="status"
      onClick={() => { setShown(null); onStory(); }}
    >
      <span className="toast-icon" aria-hidden>{ready ? "✅" : m.emoji}</span>
      <span className="toast-text">
        <small>{ready ? t("toast.ready") : t("toast.newMission")}{m.reward.money ? ` · ${naira(m.reward.money)}` : ""}</small>
        <b>{mt.title}</b>
        <span>{ready ? t("story.finish") : mt.goal}</span>
      </span>
      <span className="toast-go" aria-hidden>›</span>
      <span className="toast-timer" aria-hidden />
    </button>
  );
}
