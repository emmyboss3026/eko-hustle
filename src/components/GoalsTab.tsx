import { goalBlocker, goalChance, type Command, type GameState } from "../engine/game";
import { goalSteps, PROOF_OF_FUNDS, type GoalStepId } from "../data/goals";
import { naira } from "../engine/economy";
import { duration, Progress } from "./ui";
import Leaderboard from "./Leaderboard";

type Props = { state: GameState; dispatch: (c: Command) => void };

const japaTarget = goalSteps.ielts.cost + goalSteps.visa.cost + PROOF_OF_FUNDS + goalSteps.flight.cost;

export default function GoalsTab({ state, dispatch }: Props) {
  const done: Record<GoalStepId, boolean> = { ielts: state.ielts, visa: state.visa, flight: false, house: false };

  function Step({ id, n }: { id: GoalStepId; n: number }) {
    const g = goalSteps[id];
    const blocker = goalBlocker(state, id);
    const chance = goalChance(state, id);
    return (
      <div className={`step ${done[id] ? "done" : ""}`}>
        <span className="step-mark">{done[id] ? "✓" : n}</span>
        <div className="step-body">
          <div className="row-title">{g.emoji} {g.name}</div>
          <div className="note">{g.desc}</div>
          <div className="note">
            {g.place} · {naira(g.cost)} · {duration(g.minutes)}
            {chance !== null && !done[id] ? ` · ${Math.round(chance * 100)}% chance right now` : ""}
          </div>
          {!done[id] && (
            <>
              <button
                className="btn"
                style={{ marginTop: 8 }}
                disabled={!!blocker}
                onClick={() => dispatch({ type: "goal", id, roll: Math.random() })}
              >
                {id === "flight" ? "Book flight" : id === "house" ? "Buy the flat" : "Try now"}
              </button>
              {blocker && <div className="note bad">{blocker}</div>}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="lede">There are two ways to win. Finish either one and your story ends happily. Each step must be done at the place shown, so travel there first.</p>

      <h3>✈️ Japa abroad</h3>
      <div className="note">Savings toward everything you need: {naira(state.money)} of {naira(japaTarget)}</div>
      <Progress value={state.money} max={japaTarget} />
      <div className="group" style={{ marginTop: 8 }}>
        <Step id="ielts" n={1} />
        <Step id="visa" n={2} />
        <Step id="flight" n={3} />
      </div>

      <h3>🏡 Make it at home</h3>
      <div className="note">Savings: {naira(state.money)} of {naira(goalSteps.house.cost)}</div>
      <Progress value={state.money} max={goalSteps.house.cost} />
      <div className="group" style={{ marginTop: 8 }}>
        <Step id="house" n={1} />
      </div>

      <Leaderboard ending="japa" title="🏆 Fastest japa (all players)" />
      <Leaderboard ending="landlord" title="🏆 Fastest landlords (all players)" />
    </>
  );
}
