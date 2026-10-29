import type { MutableRefObject } from "react";
import { sellPrice, type Command, type GameState } from "../engine/game";
import { actionsFor } from "../data/actions";
import { CATALOG, roomAt } from "../data/home";
import { missionTags } from "../data/missions";
import { naira } from "../engine/economy";
import type { HouseView } from "../three/HouseView";
import ActionRow from "./ActionRow";
import Sheet from "./Sheet";

type Props = {
  state: GameState;
  uid: number;
  dispatch: (c: Command) => void;
  viewRef: MutableRefObject<HouseView | null>;
  onClose: () => void;
  onMove: () => void;
};

/** What you can do with the piece of furniture you tapped. */
export default function ItemCard({ state, uid, dispatch, viewRef, onClose, onMove }: Props) {
  const item = state.home.objects.find(o => o.uid === uid);
  if (!item) return null;
  const spec = CATALOG[item.type];
  const tags = missionTags(state);
  const atHome = state.location === "mushin";
  return (
    <Sheet title={<>{spec.emoji} {spec.name} <small className="note">· {roomAt(item.x, item.y)}</small></>} onClose={onClose} size="small">
      <p className="note">{spec.blurb} Tap what to do:</p>
      <div className="group">
        {actionsFor(item.type).map(a => (
          <ActionRow
            key={a.id}
            state={state}
            action={a}
            dispatch={dispatch}
            mission={tags.actions.has(a.id)}
            onDo={() => {
              viewRef.current?.use(item.uid, a.id);
              onClose();
            }}
          />
        ))}
        {item.type === "generator" && (
          <p className="note pad">{state.home.fuel > 0 ? `Runs by itself when NEPA takes light. ${state.home.fuel.toFixed(1)} L of fuel left.` : "Out of fuel. Buy fuel: 📍 Places → 📱 Your phone → ⛽ Buy generator fuel."}</p>
        )}
        {actionsFor(item.type).length === 0 && item.type !== "generator" && <p className="note pad">Just for looks. It makes the room yours.</p>}
      </div>
      {!spec.fixed && (
        <div className="item-actions">
          <button className="btn plain" disabled={!atHome} onClick={onMove}>↔ Move</button>
          <button
            className="btn plain"
            disabled={!atHome}
            onClick={() => {
              dispatch({ type: "sell", uid: item.uid });
              onClose();
            }}
          >
            Sell for {naira(sellPrice(item.type))}
          </button>
        </div>
      )}
    </Sheet>
  );
}
