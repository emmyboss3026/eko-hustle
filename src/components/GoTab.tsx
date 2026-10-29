import type { Command, GameState } from "../engine/game";
import { districts, distanceKm, isRushHour, modes, trip, type DistrictId } from "../data/places";
import { spotList } from "../data/spots";
import { fareFor } from "../data/traits";
import { naira } from "../engine/economy";
import { duration, Tag } from "./ui";
import Art from "./Art";
import type { Ride } from "./Cutscene";

type Props = {
  state: GameState;
  dispatch: (c: Command) => void;
  onRide: (ride: Ride) => void;
  onWalk: () => void;
  missionTab: boolean;
};

// The picture for each district
export const districtArt: Partial<Record<DistrictId, string>> = { mushin: "market", yaba: "hub", island: "beach" };

export default function GoTab({ state, dispatch, onRide, onWalk, missionTab }: Props) {
  const others = (Object.keys(districts) as DistrictId[]).filter(d => d !== state.location);
  const canWalk = state.location !== "ikeja";

  return (
    <>
      <p className="lede">You're in <b>{districts[state.location].name}</b>. Pick a place and a ride. Faster rides cost more. Every trip takes time and energy.</p>

      <button className={`walk-card ${missionTab ? "row-mission" : ""}`} onClick={onWalk} disabled={!canWalk}>
        <span className="walk-emoji" aria-hidden>🚶🏾</span>
        <span>
          <b>Walk the streets (3D)</b>
          <span className="note">
            {canWalk
              ? "Walk around town yourself and go into any building. Free, but it takes time."
              : "Ikeja isn't on the walking map. Take a ride back to Mushin, Yaba or the Island first."}
          </span>
        </span>
        {missionTab && <Tag kind="mission" />}
      </button>

      {isRushHour(state.time) && (
        <div className="rush">🚦 Rush hour (7–10 am, 4–8 pm): danfo and keke crawl. Okada still weaves through.</div>
      )}

      {others.map(to => (
        <div key={to} className="place">
          {districtArt[to] && <div className="place-art"><Art id={districtArt[to]!} time={state.time} /></div>}
          <div className="place-name">{districts[to].name}</div>
          <div className="note">{distanceKm(state.location, to)} km · {districts[to].blurb}</div>
          <div className="note">
            {spotList.filter(s => s.district === to && s.id !== "home").map(s => `${s.emoji} ${s.name}`).join(" · ")}
          </div>
          <div className="modes">
            {modes.map(m => {
              const t = trip(state.location, to, m, state.time);
              const fare = fareFor(t.cost, state.sim.trait);
              return (
                <button
                  key={m.id}
                  className="mode"
                  disabled={fare > state.money}
                  onClick={() => {
                    dispatch({ type: "travel", to, mode: m.id });
                    onRide({
                      mode: m.id, to: districts[to].name, art: districtArt[to], minutes: t.minutes,
                      km: distanceKm(state.location, to), label: `${m.emoji} ${m.label}`, time: state.time,
                    });
                  }}
                >
                  <b>{m.emoji} {m.label}</b>
                  <span>{duration(t.minutes)} · {fare ? naira(fare) : "free"}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
