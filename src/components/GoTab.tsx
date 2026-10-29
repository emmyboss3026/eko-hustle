import type { Command, GameState } from "../engine/game";
import { districts, distanceKm, isRushHour, modes, trip, type DistrictId } from "../data/places";
import { spotList } from "../data/spots";
import { fareFor } from "../data/traits";
import { naira } from "../engine/economy";
import { useLang, Rich } from "../i18n/react";
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
// eslint-disable-next-line react-refresh/only-export-components
export const districtArt: Partial<Record<DistrictId, string>> = { mushin: "market", yaba: "hub", island: "beach" };

export default function GoTab({ state, dispatch, onRide, onWalk, missionTab }: Props) {
  const { t, tx } = useLang();
  const others = (Object.keys(districts) as DistrictId[]).filter(d => d !== state.location);
  const canWalk = state.location !== "ikeja";

  return (
    <>
      <p className="lede"><Rich text={t("travel.lede", { place: tx.district(state.location) })} /></p>

      <button className={`walk-card ${missionTab ? "row-mission" : ""}`} onClick={onWalk} disabled={!canWalk}>
        <span className="walk-emoji" aria-hidden>🚶🏾</span>
        <span>
          <b>{t("travel.walk")}</b>
          <span className="note">{canWalk ? t("travel.walkInfo") : t("travel.noWalk")}</span>
        </span>
        {missionTab && <Tag kind="mission" />}
      </button>

      {isRushHour(state.time) && <div className="rush">{t("travel.rush")}</div>}

      {others.map(to => (
        <div key={to} className="place">
          {districtArt[to] && <div className="place-art"><Art id={districtArt[to]!} time={state.time} /></div>}
          <div className="place-name">{tx.district(to)}</div>
          <div className="note">{distanceKm(state.location, to)} km · {tx.districtBlurb(to)}</div>
          <div className="note">
            {spotList.filter(s => s.district === to && s.id !== "home").map(s => `${s.emoji} ${tx.spot(s.id)}`).join(" · ")}
          </div>
          <div className="modes">
            {modes.map(m => {
              const trp = trip(state.location, to, m, state.time);
              const fare = fareFor(trp.cost, state.sim.trait);
              return (
                <button
                  key={m.id}
                  className="mode"
                  disabled={fare > state.money}
                  onClick={() => {
                    dispatch({ type: "travel", to, mode: m.id });
                    onRide({
                      mode: m.id, to: tx.district(to), art: districtArt[to], minutes: trp.minutes,
                      km: distanceKm(state.location, to), label: `${m.emoji} ${tx.mode(m.id)}`, time: state.time,
                    });
                  }}
                >
                  <b>{m.emoji} {tx.mode(m.id)}</b>
                  <span>{duration(trp.minutes)} · {fare ? naira(fare) : t("ui.free").toLowerCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
