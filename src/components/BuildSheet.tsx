import { useMemo, useState } from "react";
import type { Command, GameState } from "../engine/game";
import { buildBlocker } from "../engine/estate";
import { UPGRADES, homeTier, slotsFor, type Property } from "../data/estate";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";
import LotPreview from "./LotPreview";

/** Build mode: pick an upgrade, see it on your lot in 3D with your cars, see the price, then confirm. */
export default function BuildSheet({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t } = useLang();
  const [pick, setPick] = useState<string | null>(null);
  const built = state.property ?? {};
  const upgrade = UPGRADES.find(u => u.id === pick) ?? null;
  const preview: Property = useMemo(() => (upgrade ? { ...built, [upgrade.id]: true } : built), [built, upgrade]);
  const problem = upgrade ? buildBlocker(state, upgrade.id) : null;
  const tier = homeTier(built);

  return (
    <>
      <LotPreview property={preview} vehicles={state.vehicles ?? []} />
      <p className="lede">
        <b>{t(`build.tier.${tier}`)}</b> · {t("build.slots", { n: slotsFor(built).length })}
      </p>

      {upgrade && (
        <div className="build-confirm">
          <div>
            <b>{upgrade.emoji} {upgrade.name}</b>
            <div className="note">{upgrade.desc}</div>
            {problem && !built[upgrade.id] && <div className="note bad">{problem}</div>}
          </div>
          <button
            className="btn"
            disabled={!!problem}
            onClick={() => { dispatch({ type: "build", id: upgrade.id }); setPick(null); }}
          >
            {t("build.confirm", { price: naira(upgrade.price) })}
          </button>
        </div>
      )}

      <div className="group">
        {UPGRADES.map(u => {
          const done = !!built[u.id];
          return (
            <button key={u.id} className={`row ${pick === u.id ? "row-picked" : ""}`} aria-pressed={pick === u.id} disabled={done} onClick={() => setPick(pick === u.id ? null : u.id)}>
              <span className="row-emoji" aria-hidden>{u.emoji}</span>
              <span className="row-main">
                <span className="row-title">{u.name}</span>
                <span className="note">{done ? t("build.built") : u.desc}</span>
              </span>
              <span className="row-price">{done ? "✓" : naira(u.price)}</span>
            </button>
          );
        })}
      </div>
      <p className="note">{t("build.note")}</p>
    </>
  );
}
