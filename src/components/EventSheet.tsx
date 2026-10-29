import type { Command, GameState } from "../engine/game";
import { eventById } from "../data/events";
import { naira } from "../engine/economy";
import { duration } from "./ui";
import { useLang } from "../i18n/react";

type Props = { state: GameState; dispatch: (c: Command) => void };

export default function EventSheet({ state, dispatch }: Props) {
  const { t, tx } = useLang();
  const e = state.eventId ? eventById(state.eventId) : undefined;
  if (!e) return null;
  const et = tx.event(e);

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="event-title">
      <div className="sheet">
        <div className="sheet-emoji" aria-hidden>{e.emoji}</div>
        <h2 className="sheet-title" id="event-title">{et.title}</h2>
        <p>{et.text}</p>
        {e.choices.map((c, i) => {
          const tooPoor = (c.cost ?? 0) > state.money;
          const details = [
            c.cost ? t("event.costs", { money: naira(c.cost) }) : "",
            c.minutes ? t("event.takes", { time: duration(c.minutes) }) : "",
            c.chance ? t("event.chance", { pct: Math.round(c.chance.odds * 100) }) : "",
          ].filter(Boolean).join(". ");
          return (
            <button
              key={c.label}
              className="btn"
              disabled={tooPoor}
              autoFocus={i === 0}
              onClick={() => dispatch({ type: "choose", index: i, roll: Math.random() })}
            >
              {et.choice(i)}
              {(details || tooPoor) && <small>{tooPoor ? t("event.tooPoor") : details}</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
