import { useState } from "react";
import type { Command, GameState } from "../engine/game";
import { MAX_CARS, carBlocker } from "../engine/estate";
import { CARS, CAR_RESALE, REPAINT_PRICE, carById, type CarId } from "../data/estate";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";
import CarPreview from "./CarPreview";

/** The car dealership: turn each car on the showroom floor, pick a colour, see the specs and price, and buy.
 *  Below it: your cars, which you can sell or repaint. */
export default function DealershipSheet({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t } = useLang();
  const [model, setModel] = useState<CarId>("compact");
  const spec = carById(model)!;
  const [color, setColor] = useState(spec.colors[0]);
  const problem = carBlocker(state, model);
  const mine = state.vehicles ?? [];

  const choose = (id: CarId) => {
    setModel(id);
    setColor(carById(id)!.colors[0]);
  };

  return (
    <>
      <CarPreview model={model} color={color} />
      <div className="car-tabs" role="tablist" aria-label={t("panel.cars")}>
        {CARS.map(c => (
          <button key={c.id} role="tab" aria-selected={model === c.id} onClick={() => choose(c.id)}>
            <span aria-hidden>{c.emoji}</span>
            <small>{c.kind}</small>
          </button>
        ))}
      </div>

      <div className="car-info">
        <div>
          <b>{spec.name}</b>
          <div className="note">{spec.desc}</div>
          <div className="note">{t("cars.specs", { speed: spec.topKmh, seats: spec.seats })}</div>
        </div>
        <b className="car-price">{naira(spec.price)}</b>
      </div>
      <div className="swatch-row" role="radiogroup" aria-label={t("cars.colour")}>
        <span>{t("cars.colour")}</span>
        {spec.colors.map(c => (
          <button key={c} role="radio" aria-checked={color === c} aria-label={c} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>
      <button className="btn block" disabled={!!problem} onClick={() => dispatch({ type: "buyCar", model, color })}>
        {t("cars.buy", { price: naira(spec.price) })}
      </button>
      {problem && <p className="note bad">{problem}</p>}

      <h3>🅿️ {t("cars.owned", { n: mine.length, max: MAX_CARS })}</h3>
      {mine.length === 0 && <p className="note">{t("cars.none")}</p>}
      <div className="group">
        {mine.map(v => {
          const c = carById(v.model)!;
          return (
            <div className="row" key={v.uid}>
              <span className="row-emoji" aria-hidden>{c.emoji}</span>
              <span className="row-main">
                <span className="row-title">{c.name}</span>
                <span className="note"><i className="dot" style={{ background: v.color }} /> {c.kind}</span>
              </span>
              <button className="chip-btn" disabled={state.money < REPAINT_PRICE || v.color === color} onClick={() => dispatch({ type: "paintCar", uid: v.uid, color })}>
                🎨 {naira(REPAINT_PRICE)}
              </button>
              <button className="chip-btn" onClick={() => dispatch({ type: "sellCar", uid: v.uid })}>
                {t("cars.sell", { price: naira(Math.round(c.price * CAR_RESALE)) })}
              </button>
            </div>
          );
        })}
      </div>
      {mine.length > 0 && <p className="note">{t("cars.repaintNote", { color: "" }).trim()}</p>}
    </>
  );
}
