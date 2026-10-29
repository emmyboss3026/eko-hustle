import { canDo, earnings, type Command, type GameState } from "../engine/game";
import type { Action } from "../data/actions";
import { meets, type SkillId } from "../data/skills";
import { spotOpen } from "../data/spots";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";
import { duration, EffectChips, Tag } from "./ui";

type Props = {
  state: GameState;
  action: Action;
  dispatch: (c: Command) => void;
  mission?: boolean;
  suffix?: string;     // e.g. which piece of furniture it uses
  onDo?: () => void;   // called just before the action runs (e.g. to animate the Sim)
};

/** One thing you can do: what it costs, what it gives, and tags that explain it. */
export default function ActionRow({ state, action: a, dispatch, mission, suffix, onDo }: Props) {
  const { t, tx } = useLang();
  const problem = canDo(state, a);
  const earned = earnings(state, a);
  const skills = Object.keys(a.skill ?? {}) as SkillId[];
  const locked = a.req && !meets(state.skills, a.req);
  const closed = !spotOpen(a.spot, state.time);
  const tooPoor = state.money < a.cost;
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
        <span className="row-title">{tx.action(a)}{suffix ? ` (${suffix})` : ""}</span>
        <span className="row-meta">
          {" "}· {duration(a.minutes)}{a.cost ? ` · ${t("action.costs", { money: naira(a.cost) })}` : ""}
        </span>
        <span className="tags">
          {mission && <Tag kind="mission" />}
          {earned > 0 && <Tag kind="money" text={t("action.earns", { money: naira(earned) })} />}
          {skills.map(k => <Tag key={k} kind="skill" text={tx.skill(k)} />)}
          {a.power && <Tag kind="light" />}
          {a.food && <Tag kind="food" />}
          {locked && <Tag kind="lock" />}
          {closed && <Tag kind="closed" />}
        </span>
        {problem && !(tooPoor && problem === canDoMoney(state)) ? <span className="note bad">{problem}</span> : <EffectChips effect={a.effect} />}
      </span>
      {!earned && <span className="row-price">{a.cost ? naira(a.cost) : t("ui.free")}</span>}
    </button>
  );
}

// The "not enough money" problem is obvious from the price, so it isn't repeated in red.
const canDoMoney = (s: GameState) => canDo(s, { id: "", label: "", emoji: "", minutes: 0, cost: Number.MAX_SAFE_INTEGER, category: "food", where: "any", spot: "phone", effect: {} });
