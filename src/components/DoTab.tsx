import { shiftPay, type Command, type GameState } from "../engine/game";
import { actionsAt, actionsFor } from "../data/actions";
import { CATALOG, type FurnitureType } from "../data/home";
import { careers } from "../data/careers";
import { districts, type DistrictId } from "../data/places";
import { openText, spotList, spotOpen, spots, type SpotId } from "../data/spots";
import { missionTags } from "../data/missions";
import { naira } from "../engine/economy";
import ActionRow from "./ActionRow";
import Art from "./Art";
import RewardAd from "./RewardAd";
import { Tag } from "./ui";

type Props = {
  state: GameState;
  dispatch: (c: Command) => void;
  goTo: (tab: "home" | "go" | "work") => void;
};

/** Everything you can do where you are, grouped by place. */
export default function DoTab({ state, dispatch, goTo }: Props) {
  const here = spotList.filter(s => s.district === state.location && s.id !== "home");
  const tags = missionTags(state);
  const job = state.career ? careers[state.career.id] : null;
  const jobHere = job && job.where === state.location;
  const elsewhere = (Object.keys(districts) as DistrictId[]).filter(d => d !== state.location);

  return (
    <>
      <p className="lede">Pick a place, then tap what to do. Time passes while you do it. To go somewhere else, use 🚌 Travel.</p>

      {jobHere && job && state.career && (
        <div className="work-card">
          <div className="title">{job.emoji} Your job is here: {job.levels[state.career.level].title}</div>
          <div className="sub">{job.hours} h shift · earns {naira(shiftPay(state))}</div>
          <button className="btn block" disabled={state.needs.energy < 15} onClick={() => dispatch({ type: "work" })}>
            {state.needs.energy < 15 ? "Too tired to work: sleep first" : "💼 Work a shift"}
          </button>
        </div>
      )}

      {state.location === "mushin" && <RoomSection state={state} dispatch={dispatch} missionActions={tags.actions} />}

      {[...here, spots.phone].map(spot => (
        <SpotCard key={spot.id} id={spot.id} state={state} dispatch={dispatch} missionSpot={tags.spot} missionActions={tags.actions} />
      ))}

      <h3>🗺️ Elsewhere in Lagos</h3>
      <div className="group">
        {elsewhere.map(d => (
          <button key={d} className="row" onClick={() => goTo("go")}>
            <span className="row-emoji" aria-hidden>🚌</span>
            <span className="row-main">
              <span className="row-title">{districts[d].name}</span>
              <span className="note">
                {spotList.filter(s => s.district === d && s.id !== "home").map(s => `${s.emoji} ${s.name}`).join(" · ")}
              </span>
            </span>
            <span className="row-price">Travel ›</span>
          </button>
        ))}
      </div>

      <RewardAd state={state} dispatch={dispatch} />
    </>
  );
}

/** Everything you can do at home, grouped by the furniture it uses. */
function RoomSection({ state, dispatch, missionActions }: { state: GameState; dispatch: (c: Command) => void; missionActions: Set<string> }) {
  const owned = [...new Set(state.home.objects.map(o => o.type))] as FurnitureType[];
  const free = actionsAt("home").filter(a => !a.uses);
  const isMission = owned.some(t => actionsFor(t).some(a => missionActions.has(a.id))) || free.some(a => missionActions.has(a.id));
  return (
    <section className={`spot ${isMission ? "spot-mission" : ""}`} id="spot-home">
      <div className="spot-art"><Art id="home" time={state.time} /></div>
      <div className="spot-head">
        <div>
          <h3>🏠 Your room</h3>
          <p className="note">Tip: you can also tap the furniture in your flat behind this panel.</p>
        </div>
        {isMission && <span className="tags"><Tag kind="mission" /></span>}
      </div>
      <div className="group">
        {owned.flatMap(t => actionsFor(t).map(a => (
          <ActionRow key={`${t}-${a.id}`} state={state} action={{ ...a, label: `${a.label} (${CATALOG[t].name.toLowerCase()})` }} dispatch={dispatch} mission={missionActions.has(a.id)} />
        )))}
        {free.map(a => <ActionRow key={a.id} state={state} action={a} dispatch={dispatch} mission={missionActions.has(a.id)} />)}
      </div>
    </section>
  );
}

function SpotCard({ id, state, dispatch, missionSpot, missionActions }: {
  id: SpotId;
  state: GameState;
  dispatch: (c: Command) => void;
  missionSpot: SpotId | null;
  missionActions: Set<string>;
}) {
  const spot = spots[id];
  const list = actionsAt(id);
  const open = spotOpen(id, state.time);
  const isMission = missionSpot === id || list.some(a => missionActions.has(a.id));
  return (
    <section className={`spot ${isMission ? "spot-mission" : ""}`} id={`spot-${id}`}>
      {spot.art && (
        <div className="spot-art">
          <Art id={spot.art} time={state.time} />
        </div>
      )}
      <div className="spot-head">
        <div>
          <h3>{spot.emoji} {spot.name}</h3>
          <p className="note">{spot.blurb}</p>
        </div>
        <span className="tags">
          {isMission && <Tag kind="mission" />}
          {spot.open && (open ? <Tag kind="open" text={openText(id)} /> : <Tag kind="closed" text={`Closed · ${openText(id)}`} />)}
        </span>
      </div>
      <div className="group">
        {list.map(a => (
          <ActionRow key={a.id} state={state} action={a} dispatch={dispatch} mission={missionActions.has(a.id)} />
        ))}
      </div>
    </section>
  );
}
