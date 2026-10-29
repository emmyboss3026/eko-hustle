import { goalBlocker, goalChance, type Command, type GameState } from "../engine/game";
import { goalSteps, PROOF_OF_FUNDS, type GoalStepId } from "../data/goals";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";
import { duration, Progress } from "./ui";
import Leaderboard from "./Leaderboard";

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

export default function GoalsTab({ state, dispatch }: Props) {
  const { t } = useLang();
  return (
    <>
      <p className="lede">{t("goals.lede")}</p>

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

      <Leaderboard ending="japa" title={t("goals.boardJapa")} />
      <Leaderboard ending="landlord" title={t("goals.boardHome")} />
    </>
  );
}
