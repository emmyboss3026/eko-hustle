import { nextPromotion, shiftPay, type Command, type GameState } from "../engine/game";
import { careerList, careers } from "../data/careers";
import { districts } from "../data/places";
import { describeReq, meets } from "../data/skills";
import { naira } from "../engine/economy";
import { payBonus } from "../data/traits";
import { Progress } from "./ui";

type Props = { state: GameState; dispatch: (c: Command) => void; goTo: () => void };

export default function WorkTab({ state, dispatch, goTo }: Props) {
  const current = state.career ? careers[state.career.id] : null;
  const promo = nextPromotion(state);
  const bonus = payBonus(state.sim.trait);

  return (
    <>
      <ol className="how">
        <li><b>Apply</b> for a job below (🔒 ones need a skill first).</li>
        <li><b>Go</b> to the job's area with 🚌 Travel.</li>
        <li>Tap <b>Work a shift</b>. It takes a few hours and pays at the end.</li>
        <li>Work enough shifts and train the right skill to get <b>promoted</b>.</li>
      </ol>

      {current && state.career ? (
        <div className="work-card">
          <div className="title">{current.emoji} {current.levels[state.career.level].title}</div>
          <div className="sub">
            {naira(shiftPay(state))} per {current.hours} h shift in {districts[current.where].name}
          </div>
          {promo ? (
            <>
              <Progress value={current.shiftsToPromote - promo.shiftsLeft} max={current.shiftsToPromote} />
              <div className="note">
                Next: {promo.title}.{" "}
                {promo.shiftsLeft > 0 ? `${promo.shiftsLeft} more shift${promo.shiftsLeft > 1 ? "s" : ""}.` : "Shifts done."}{" "}
                {promo.missing && <>Also needs {promo.missing}.</>}
              </div>
            </>
          ) : (
            <div className="note">You're at the top of this career. 👑</div>
          )}
          {state.location === current.where ? (
            <button className="btn block" disabled={state.needs.energy < 15} onClick={() => dispatch({ type: "work" })}>
              {state.needs.energy < 15 ? "😴 Too tired: sleep first" : `💼 Work a shift (${current.hours} h)`}
            </button>
          ) : (
            <button className="btn block" onClick={goTo}>🚌 Travel to {districts[current.where].name} to work</button>
          )}
          <button className="btn plain block" onClick={() => dispatch({ type: "quit" })}>Quit this job</button>
        </div>
      ) : (
        <p className="lede">You don't have a job yet. Pick one below and tap <b>Apply</b>. 🏧 POS business needs no skills, so it's the easiest start.</p>
      )}

      <h3>Careers</h3>
      <div className="group">
        {careerList.map(c => {
          const mine = state.career?.id === c.id;
          const canApply = meets(state.skills, c.levels[0].req);
          return (
            <div key={c.id} className="career">
              <div className="career-head">
                <span className="row-emoji" aria-hidden>{c.emoji}</span>
                <span className="row-main">
                  <span className="row-title">{c.name}</span>
                  <br />
                  <span className="row-meta">{districts[c.where].name} · {c.hours} h shifts</span>
                </span>
                {mine ? (
                  <span className="note">Your job</span>
                ) : (
                  <button className="btn" disabled={!canApply} onClick={() => dispatch({ type: "apply", career: c.id })}>
                    {canApply ? "Apply" : "🔒 Locked"}
                  </button>
                )}
              </div>
              <ol className="ladder">
                {c.levels.map((l, i) => (
                  <li key={l.title} className={mine && state.career?.level === i ? "current" : ""}>
                    <span>{l.title}{l.req ? <span className="note"> ({describeReq(l.req)})</span> : null}</span>
                    <span>{naira(Math.round(l.pay * bonus))}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
      <p className="note">Switching careers starts you at the bottom of the new ladder.</p>
    </>
  );
}
