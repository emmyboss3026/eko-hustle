import type { Command, GameState } from "../engine/game";
import { taskProgress, type Progress } from "../engine/story";
import type { StoryMission } from "../data/story/types";
import { taskKind } from "../data/story/types";
import { naira } from "../engine/economy";
import { progressText, taskLabel } from "../lib/storyText";
import { useLang } from "../i18n/react";

/** A mission's tasks as a checklist, with progress and a Pay button for fees. */
export default function StoryTasks({ state, mission: m, progress: p, dispatch }: {
  state: GameState;
  mission: StoryMission;
  progress: Progress | undefined;
  dispatch: (c: Command) => void;
}) {
  const { t, tx } = useLang();
  return (
    <ul className="story-tasks">
      {m.tasks.map((task, i) => {
        const pr = taskProgress(state, task, p, i);
        const pay = taskKind(task) === "pay" ? (task as { pay: number }).pay : 0;
        return (
          <li key={i} className={pr.done ? "done" : ""}>
            <span className="story-check" aria-hidden>{pr.done ? "✅" : "⬜"}</span>
            <span className="story-task-text">
              <span>{taskLabel(t, tx, task)}</span>
              {!pr.done && progressText(task, pr.have, pr.need) && (
                <small>
                  {progressText(task, pr.have, pr.need)}
                  <span className="story-bar" aria-hidden><i style={{ width: `${Math.round((pr.have / pr.need) * 100)}%` }} /></span>
                </small>
              )}
            </span>
            {pay > 0 && !pr.done && (
              <button className="btn small" disabled={state.money < pay} onClick={() => dispatch({ type: "story", act: "pay", id: m.id, task: i })}>
                {t("story.payBtn", { money: naira(pay) })}
              </button>
            )}
            <span className="sr-only">{pr.done ? t("story.taskDone") : t("story.taskOpen")}</span>
          </li>
        );
      })}
    </ul>
  );
}
