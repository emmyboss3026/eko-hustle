import { canDo, earnings, type Command, type GameState } from "../engine/game";
import type { Action } from "../data/actions";
import { meets, skillInfo, type SkillId } from "../data/skills";
import { spotOpen } from "../data/spots";
import { naira } from "../engine/economy";
import { duration, EffectChips, Tag } from "./ui";

type Props = {
  state: GameState;
  action: Action;
  dispatch: (c: Command) => void;
  mission?: boolean;
  onDo?: () => void;   // called just before the action runs (e.g. to animate the Sim)
};

/** One thing you can do: what it costs, what it gives, and tags that explain it. */
export default function ActionRow({ state, action: a, dispatch, mission, onDo }: Props) {
  const problem = canDo(state, a);
  const earned = earnings(state, a);
  const skills = Object.keys(a.skill ?? {}) as SkillId[];
  const locked = a.req && !meets(state.skills, a.req);
  const closed = !spotOpen(a.spot, state.time);
  return (
    <button
      className={`row ${mission ? "row-mission" : ""}`}
      disabled={!!problem}
      onClick={() => {
        onDo?.();
        dispatch({ type: "act", id: a.id });
      }}
    >
      <span className="row-emoji" aria-hidden>{a.emoji}</span>
      <span className="row-main">
        <span className="row-title">{a.label}</span>
        <span className="row-meta">
          {" "}· {duration(a.minutes)}{a.cost ? ` · costs ${naira(a.cost)}` : ""}
        </span>
        <span className="tags">
          {mission && <Tag kind="mission" />}
          {earned > 0 && <Tag kind="money" text={`Earns ${naira(earned)}`} />}
          {skills.map(k => <Tag key={k} kind="skill" text={`${skillInfo[k].name}`} />)}
          {a.power && <Tag kind="light" />}
          {a.food && <Tag kind="food" />}
          {locked && <Tag kind="lock" text="Locked" />}
          {closed && <Tag kind="closed" />}
        </span>
        {problem && problem !== "Not enough money." ? <span className="note bad">{problem}</span> : <EffectChips effect={a.effect} />}
      </span>
      {!earned && <span className="row-price">{a.cost ? naira(a.cost) : "Free"}</span>}
    </button>
  );
}
