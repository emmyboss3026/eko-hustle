import type { MutableRefObject } from "react";
import { sellPrice, type Command, type GameState } from "../engine/game";
import { actionsFor } from "../data/actions";
import { CATALOG, roomAt } from "../data/home";
import { missionTags } from "../data/missions";
import { naira } from "../engine/economy";
import type { HouseView } from "../three/HouseView";
import ActionRow from "./ActionRow";
import Sheet from "./Sheet";
import { useLang } from "../i18n/react";

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
  const { t, tx } = useLang();
  const item = state.home.objects.find(o => o.uid === uid);
  if (!item) return null;
  const spec = CATALOG[item.type];
  const tags = missionTags(state);
  const atHome = state.location === "mushin";
  return (
    <Sheet title={<>{spec.emoji} {tx.furniture(item.type)} <small className="note">· {tx.room(roomAt(item.x, item.y))}</small></>} onClose={onClose} size="small">
      <p className="note">{tx.furnitureBlurb(item.type)} {t("item.tapWhat")}</p>
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
          <p className="note pad">{state.home.fuel > 0 ? t("item.genFuel", { litres: state.home.fuel.toFixed(1) }) : t("item.genEmpty")}</p>
        )}
        {actionsFor(item.type).length === 0 && item.type !== "generator" && <p className="note pad">{t("item.decor")}</p>}
      </div>
      {!spec.fixed && (
        <div className="item-actions">
          <button className="btn plain" disabled={!atHome} onClick={onMove}>↔ {t("item.move")}</button>
          <button
            className="btn plain"
            disabled={!atHome}
            onClick={() => {
              dispatch({ type: "sell", uid: item.uid });
              onClose();
            }}
          >
            {t("item.sell", { money: naira(sellPrice(item.type)) })}
          </button>
        </div>
      )}
    </Sheet>
  );
}
