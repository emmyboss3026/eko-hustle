import { openHours, shiftPay, type Command, type GameState } from "../engine/game";
import { actionsAt, actionsFor } from "../data/actions";
import type { FurnitureType } from "../data/home";
import { careers } from "../data/careers";
import { districts, type DistrictId } from "../data/places";
import { spotList, spotOpen, spots, type SpotId } from "../data/spots";
import { missionTags } from "../data/missions";
import { naira } from "../engine/economy";
import { storyFlag } from "../engine/progress";
import { useLang } from "../i18n/react";
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
  const { t, tx } = useLang();
  const here = spotList.filter(s => s.district === state.location && s.id !== "home");
  const tags = missionTags(state);
  const job = state.career ? careers[state.career.id] : null;
  const jobHere = job && job.where === state.location;
  const elsewhere = (Object.keys(districts) as DistrictId[]).filter(d => d !== state.location);

  return (
    <>
      <p className="lede">{t("places.lede")}</p>

      {jobHere && job && state.career && (
        <div className="work-card">
          <div className="title">{job.emoji} {t("places.jobHere", { title: tx.title(job.id, state.career.level) })}</div>
          <div className="sub">{t("places.shiftInfo", { hours: job.hours, money: naira(shiftPay(state)) })}</div>
          <button className="btn block" disabled={state.needs.energy < 15} onClick={() => dispatch({ type: "work" })}>
            {state.needs.energy < 15 ? t("work.tooTired") : t("work.doShift", { hours: job.hours })}
          </button>
        </div>
      )}

      {state.location === "mushin" && <RoomSection state={state} dispatch={dispatch} missionActions={tags.actions} />}

      {[...here, spots.phone].map(spot => (
        <SpotCard key={spot.id} id={spot.id} state={state} dispatch={dispatch} missionSpot={tags.spot} missionActions={tags.actions} />
      ))}

      <h3>🗺️ {t("places.elsewhere")}</h3>
      <div className="group">
        {elsewhere.map(d => (
          <button key={d} className="row" onClick={() => goTo("go")}>
            <span className="row-emoji" aria-hidden>🚌</span>
            <span className="row-main">
              <span className="row-title">{tx.district(d)}</span>
              <span className="note">
                {spotList.filter(s => s.district === d && s.id !== "home").map(s => `${s.emoji} ${tx.spot(s.id)}`).join(" · ")}
              </span>
            </span>
            <span className="row-price">{t("places.travel")}</span>
          </button>
        ))}
      </div>

      <RewardAd state={state} dispatch={dispatch} />
    </>
  );
}

/** Everything you can do at home, grouped by the furniture it uses. */
function RoomSection({ state, dispatch, missionActions }: { state: GameState; dispatch: (c: Command) => void; missionActions: Set<string> }) {
  const { t, tx } = useLang();
  const owned = [...new Set(state.home.objects.map(o => o.type))] as FurnitureType[];
  const free = actionsAt("home").filter(a => !a.uses);
  const isMission = owned.some(f => actionsFor(f).some(a => missionActions.has(a.id))) || free.some(a => missionActions.has(a.id));
  return (
    <section className={`spot ${isMission ? "spot-mission" : ""}`} id="spot-home">
      <div className="spot-art"><Art id="home" time={state.time} /></div>
      <div className="spot-head">
        <div>
          <h3>🏠 {tx.spot("home")}</h3>
          <p className="note">{t("places.roomTip")}</p>
        </div>
        {isMission && <span className="tags"><Tag kind="mission" /></span>}
      </div>
      <div className="group">
        {owned.flatMap(f => actionsFor(f).map(a => (
          <ActionRow key={`${f}-${a.id}`} state={state} action={a} suffix={tx.furniture(f)} dispatch={dispatch} mission={missionActions.has(a.id)} />
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
  const { t, tx } = useLang();
  const spot = spots[id];
  const list = actionsAt(id).filter(a => storyFlag(state, a.flag));
  const open = spotOpen(id, state.time);
  const isMission = missionSpot === id || list.some(a => missionActions.has(a.id));
  const hours = openHours(state, id);
  return (
    <section className={`spot ${isMission ? "spot-mission" : ""}`} id={`spot-${id}`}>
      {spot.art && (
        <div className="spot-art">
          <Art id={spot.art} time={state.time} />
        </div>
      )}
      <div className="spot-head">
        <div>
          <h3>{spot.emoji} {tx.spot(id)}</h3>
          <p className="note">{tx.spotBlurb(id)}</p>
        </div>
        <span className="tags">
          {isMission && <Tag kind="mission" />}
          {spot.open && (open ? <Tag kind="open" text={hours} /> : <Tag kind="closed" text={`${t("tag.closed")} · ${hours}`} />)}
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
