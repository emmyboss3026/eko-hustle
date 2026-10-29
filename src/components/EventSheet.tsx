import type { Command, GameState } from "../engine/game";
import { eventById } from "../data/events";
import { naira } from "../engine/economy";
import { duration } from "./ui";

type Props = { state: GameState; dispatch: (c: Command) => void };

export default function EventSheet({ state, dispatch }: Props) {
  const e = state.eventId ? eventById(state.eventId) : undefined;
  if (!e) return null;

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="event-title">
      <div className="sheet">
        <div className="sheet-emoji" aria-hidden>{e.emoji}</div>
        <h2 className="sheet-title" id="event-title">{e.title}</h2>
        <p>{e.text}</p>
        {e.choices.map((c, i) => {
          const tooPoor = (c.cost ?? 0) > state.money;
          const details = [
            c.cost ? `Costs ${naira(c.cost)}` : "",
            c.minutes ? `Takes ${duration(c.minutes)}` : "",
            c.chance ? `${Math.round(c.chance.odds * 100)}% chance it pays off` : "",
          ].filter(Boolean).join(". ");
          return (
            <button
              key={c.label}
              className="btn"
              disabled={tooPoor}
              autoFocus={i === 0}
              onClick={() => dispatch({ type: "choose", index: i, roll: Math.random() })}
            >
              {c.label}
              {(details || tooPoor) && <small>{tooPoor ? "You can't afford this." : details}</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
