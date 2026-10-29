import { itemBlocker, type GameState } from "../engine/game";
import { actionsFor } from "../data/actions";
import { CATALOG, roomAt, shopList, type FurnitureType } from "../data/home";
import { missionTags } from "../data/missions";
import { naira } from "../engine/economy";
import { Tag } from "./ui";

type Props = {
  state: GameState;
  onBuy: (type: FurnitureType) => void;
  onPick: (uid: number) => void;
};

/** The furniture shop, and everything already in your room. */
export default function ShopSheet({ state, onBuy, onPick }: Props) {
  const tags = missionTags(state);
  const atHome = state.location === "mushin";
  return (
    <>
      {!atHome && <p className="note bad">You can only buy and arrange furniture at home in Mushin. Travel home first.</p>}
      <p className="lede">Pick an item, then tap the floor where it should go. Furniture unlocks new things to do at home.</p>
      <div className="group">
        {shopList.map(t => {
          const f = CATALOG[t];
          const problem = itemBlocker(state, t);
          const does = actionsFor(t).map(a => a.label).join(" · ");
          return (
            <button key={t} className="row" disabled={!!problem} onClick={() => onBuy(t)}>
              <span className="row-emoji" aria-hidden>{f.emoji}</span>
              <span className="row-main">
                <span className="row-title">{f.name}</span>
                <span className="note">{does || f.blurb}</span>
                <span className="tags">
                  {f.power && <Tag kind="light" />}
                  {problem && atHome && <Tag kind="lock" text={problem} />}
                </span>
              </span>
              <span className="row-price">{naira(f.price)}</span>
            </button>
          );
        })}
      </div>

      <h3>🏠 Already in your room</h3>
      <div className="group">
        {state.home.objects.map(o => (
          <button key={o.uid} className={`row ${tags.furniture === o.type ? "row-mission" : ""}`} onClick={() => onPick(o.uid)}>
            <span className="row-emoji" aria-hidden>{CATALOG[o.type].emoji}</span>
            <span className="row-main">
              <span className="row-title">{CATALOG[o.type].name}</span>
              <span className="row-meta"> · {roomAt(o.x, o.y)}</span>
              {tags.furniture === o.type && <span className="tags"><Tag kind="mission" /></span>}
            </span>
            <span aria-hidden>›</span>
          </button>
        ))}
      </div>
    </>
  );
}
