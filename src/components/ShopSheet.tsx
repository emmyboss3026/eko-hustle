import { itemBlocker, type GameState } from "../engine/game";
import { actionsFor } from "../data/actions";
import { CATALOG, roomAt, shopList, type FurnitureType } from "../data/home";
import { missionTags } from "../data/missions";
import { naira } from "../engine/economy";
import { Tag } from "./ui";
import { useLang } from "../i18n/react";

type Props = {
  state: GameState;
  onBuy: (type: FurnitureType) => void;
  onPick: (uid: number) => void;
};

/** The furniture shop, and everything already in your room. */
export default function ShopSheet({ state, onBuy, onPick }: Props) {
  const { t, tx } = useLang();
  const tags = missionTags(state);
  const atHome = state.location === "mushin";
  return (
    <>
      {!atHome && <p className="note bad">{t("shop.awayNote")}</p>}
      <p className="lede">{t("shop.lede")}</p>
      <div className="group">
        {shopList.map(f => {
          const spec = CATALOG[f];
          const problem = itemBlocker(state, f);
          const does = actionsFor(f).map(a => tx.action(a)).join(" · ");
          return (
            <button key={f} className="row" disabled={!!problem} onClick={() => onBuy(f)}>
              <span className="row-emoji" aria-hidden>{spec.emoji}</span>
              <span className="row-main">
                <span className="row-title">{tx.furniture(f)}</span>
                <span className="note">{does || tx.furnitureBlurb(f)}</span>
                <span className="tags">
                  {spec.power && <Tag kind="light" />}
                  {problem && atHome && <Tag kind="lock" text={problem} />}
                </span>
              </span>
              <span className="row-price">{naira(spec.price)}</span>
            </button>
          );
        })}
      </div>

      <h3>🏠 {t("shop.inRoom")}</h3>
      <div className="group">
        {state.home.objects.map(o => (
          <button key={o.uid} className={`row ${tags.furniture === o.type ? "row-mission" : ""}`} onClick={() => onPick(o.uid)}>
            <span className="row-emoji" aria-hidden>{CATALOG[o.type].emoji}</span>
            <span className="row-main">
              <span className="row-title">{tx.furniture(o.type)}</span>
              <span className="row-meta"> · {tx.room(roomAt(o.x, o.y))}</span>
              {tags.furniture === o.type && <span className="tags"><Tag kind="mission" /></span>}
            </span>
            <span aria-hidden>›</span>
          </button>
        ))}
      </div>
    </>
  );
}
