import { playthrough, storyFinished } from "../engine/story";
import { goalBlocker, goalChance, type Command, type GameState } from "../engine/game";
import { goalSteps, PROOF_OF_FUNDS, type GoalStepId } from "../data/goals";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";
import { duration, Progress } from "./ui";
import { HOME_GOALS } from "../data/homeGoals";
import { homeGoalState, homeGoalsDone } from "../engine/estate";
import { progressText, taskLabel } from "../lib/storyText";
import { Fragment } from "react";

type Props = { state: GameState; dispatch: (c: Command) => void };

const japaTarget = goalSteps.ielts.cost + goalSteps.visa.cost + PROOF_OF_FUNDS + goalSteps.flight.cost;

function Step({ id, n, state, dispatch }: { id: GoalStepId; n: number } & Props) {
  const { t, tx } = useLang();
  const done: Record<GoalStepId, boolean> = { ielts: state.ielts, visa: state.visa, flight: false, house: false };
  const g = goalSteps[id];
  const gt = tx.goal(id);
  const blocker = goalBlocker(state, id);
  const chance = goalChance(state, id);
  return (
    <div className={`step ${done[id] ? "done" : ""}`}>
      <span className="step-mark">{done[id] ? "✓" : n}</span>
      <div className="step-body">
        <div className="row-title">{g.emoji} {gt.name}</div>
        <div className="note">{gt.desc}</div>
        <div className="note">
          {gt.place} · {naira(g.cost)} · {duration(g.minutes)}
          {chance !== null && !done[id] ? ` · ${t("goals.chance", { pct: Math.round(chance * 100) })}` : ""}
        </div>
        {!done[id] && (
          <>
            <button
              className="btn"
              style={{ marginTop: 8 }}
              disabled={!!blocker}
              onClick={() => dispatch({ type: "goal", id, roll: Math.random() })}
            >
              {id === "flight" ? t("goals.book") : id === "house" ? t("goals.buyFlat") : t("goals.try")}
            </button>
            {blocker && <div className="note bad">{blocker}</div>}
          </>
        )}
      </div>
    </div>
  );
}

/** Your flat, yard and cars as a ladder of goals. Claiming one pays a reward and opens a side mission in the 📖 Story app. */
function HomeGoals({ state, dispatch }: Props) {
  const { t, tx } = useLang();
  return (
    <>
      <h3>🏠 {t("homegoals.title", { done: homeGoalsDone(state), n: HOME_GOALS.length })}</h3>
      <p className="note">{t("homegoals.lede")}</p>
      <div className="group">
        {HOME_GOALS.map(g => {
          const st = homeGoalState(state, g);
          const gt = tx.homeGoal(g.id);
          return (
            <div className={`step ${st.claimed ? "done" : ""}`} key={g.id}>
              <span className="step-mark">{st.claimed ? "✓" : g.emoji}</span>
              <div className="step-body">
                <div className="row-title">{g.emoji} {gt.name}</div>
                <div className="note">{gt.desc}</div>
                {!st.claimed && st.open && (
                  <ul className="story-tasks">
                    {g.tasks.map((task, i) => {
                      const pr = st.tasks[i];
                      return (
                        <li key={i} className={pr.done ? "done" : ""}>
                          <span className="story-check" aria-hidden>{pr.done ? "✅" : "⬜"}</span>
                          <span className="story-task-text">
                            <span>{taskLabel(t, tx, task)}</span>
                            {!pr.done && progressText(task, pr.have, pr.need) && <small>{progressText(task, pr.have, pr.need)}</small>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!st.open && <div className="note bad">{t("homegoals.locked", { n: g.ch ?? 0 })}</div>}
                {st.ready && (
                  <Fragment>
                    <button className="btn" style={{ marginTop: 8 }} onClick={() => dispatch({ type: "homeGoal", id: g.id })}>
                      {t("homegoals.claim")}
                    </button>
                  </Fragment>
                )}
                {st.claimed && <div className="note">{t("homegoals.claimed")}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function GoalsTab({ state, dispatch }: Props) {
  const { t } = useLang();
  return (
    <>
      <p className="lede">{t("goals.lede")}</p>
      {!storyFinished(state) && <p className="note bad">⚠️ {t("goals.endsStory", { n: (state.story?.route ? playthrough(state.story.route, state.story.flags).length : 100) - (state.mission ?? 0) })}</p>}

      <h3>✈️ {t("goals.japa")}</h3>
      <div className="note">{t("goals.japaSavings", { money: naira(state.money), target: naira(japaTarget) })}</div>
      <Progress value={state.money} max={japaTarget} label={t("goals.japa")} />
      <div className="group" style={{ marginTop: 8 }}>
        <Step id="ielts" n={1} state={state} dispatch={dispatch} />
        <Step id="visa" n={2} state={state} dispatch={dispatch} />
        <Step id="flight" n={3} state={state} dispatch={dispatch} />
      </div>

      <h3>🏡 {t("goals.home")}</h3>
      <div className="note">{t("goals.homeSavings", { money: naira(state.money), target: naira(goalSteps.house.cost) })}</div>
      <Progress value={state.money} max={goalSteps.house.cost} label={t("goals.home")} />
      <div className="group" style={{ marginTop: 8 }}>
        <Step id="house" n={1} state={state} dispatch={dispatch} />
      </div>

      <HomeGoals state={state} dispatch={dispatch} />

    </>
  );
}
