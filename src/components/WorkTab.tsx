import { shiftPay, type Command, type GameState } from "../engine/game";
import { careerList, careers } from "../data/careers";
import { meets } from "../data/skills";
import { naira } from "../engine/economy";
import { payBonus } from "../data/traits";
import { useLang, Rich } from "../i18n/react";
import { Progress } from "./ui";
import { storyFlag } from "../engine/progress";

type Props = { state: GameState; dispatch: (c: Command) => void; goTo: () => void };

// Story careers show once you're on their route (locked until you qualify) or qualified.
const ROUTE_OF: Partial<Record<string, string>> = { med: "med", law: "law", ent: "ent" };

export default function WorkTab({ state, dispatch, goTo }: Props) {
  const { t, tx } = useLang();
  const current = state.career ? careers[state.career.id] : null;
  const bonus = payBonus(state.sim.trait);
  const next = current && state.career ? current.levels[state.career.level + 1] : undefined;
  const shiftsLeft = current && state.career ? Math.max(0, current.shiftsToPromote - state.career.shifts) : 0;
  const missing = next && !meets(state.skills, next.req) ? tx.req(next.req) : "";

  return (
    <>
      <ol className="how">
        {[1, 2, 3, 4].map(i => <li key={i}><Rich text={t(`jobs.how${i}`)} /></li>)}
      </ol>

      {current && state.career ? (
        <div className="work-card">
          <div className="title">{current.emoji} {tx.title(current.id, state.career.level)}</div>
          <div className="sub">
            {t("jobs.payLine", { money: naira(shiftPay(state)), hours: current.hours, place: tx.district(current.where) })}
          </div>
          {next ? (
            <>
              <Progress value={current.shiftsToPromote - shiftsLeft} max={current.shiftsToPromote} label={tx.title(current.id, state.career.level + 1)} />
              <div className="note">
                {t("jobs.next", { title: tx.title(current.id, state.career.level + 1) })}{" "}
                {shiftsLeft > 0 ? t(shiftsLeft > 1 ? "jobs.shiftsLeft" : "jobs.shiftLeft", { n: shiftsLeft }) : t("jobs.shiftsDone")}{" "}
                {missing && t("jobs.alsoNeeds", { req: missing })}
              </div>
            </>
          ) : (
            <div className="note">{t("jobs.top")}</div>
          )}
          {state.location === current.where ? (
            <button className="btn block" disabled={state.needs.energy < 15} onClick={() => dispatch({ type: "work" })}>
              {state.needs.energy < 15 ? t("work.tooTired") : t("work.doShift", { hours: current.hours })}
            </button>
          ) : (
            <button className="btn block" onClick={goTo}>{t("jobs.travelTo", { place: tx.district(current.where) })}</button>
          )}
          <button className="btn plain block" onClick={() => dispatch({ type: "quit" })}>{t("jobs.quit")}</button>
        </div>
      ) : (
        <p className="lede"><Rich text={t("jobs.none")} /></p>
      )}

      <h3>{t("jobs.careers")}</h3>
      <div className="group">
        {careerList.filter(c => !c.flag || storyFlag(state, c.flag) || state.story?.route === ROUTE_OF[c.id]).map(c => {
          const mine = state.career?.id === c.id;
          const qual = !storyFlag(state, c.flag) ? c.flag : !storyFlag(state, c.levels[0].flag) ? c.levels[0].flag : undefined;
          const canApply = meets(state.skills, c.levels[0].req) && !qual;
          return (
            <div key={c.id} className="career">
              <div className="career-head">
                <span className="row-emoji" aria-hidden>{c.emoji}</span>
                <span className="row-main">
                  <span className="row-title">{tx.career(c.id)}</span>
                  <br />
                  <span className="row-meta">{t("jobs.where", { place: tx.district(c.where), hours: c.hours })}</span>
                </span>
                {mine ? (
                  <span className="note">{t("jobs.yours")}</span>
                ) : (
                  <button className="btn" disabled={!canApply} onClick={() => dispatch({ type: "apply", career: c.id })}>
                    {canApply ? t("jobs.apply") : t("jobs.locked")}
                  </button>
                )}
              </div>
              {qual && !mine && <p className="note">🎓 {t("jobs.needsQual", { qual: t(`qual.${qual}`) })}</p>}
              <ol className="ladder">
                {c.levels.map((l, i) => (
                  <li key={l.title} className={mine && state.career?.level === i ? "current" : ""}>
                    <span>{tx.title(c.id, i)}{l.req ? <span className="note"> ({tx.req(l.req)})</span> : null}{l.flag && i > 0 ? <span className="note"> · 🎓 {t(`qual.${l.flag}`)}</span> : null}</span>
                    <span>{naira(Math.round(l.pay * bonus))}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
      <p className="note">{t("jobs.switch")}</p>
    </>
  );
}
