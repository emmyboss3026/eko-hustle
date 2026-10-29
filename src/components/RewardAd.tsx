import { useState } from "react";
import { AD_REWARD, canClaimReward, type Command, type GameState } from "../engine/game";
import { adsAvailable, showRewardedAd } from "../lib/ads";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";

type Props = { state: GameState; dispatch: (c: Command) => void };

// "Watch an ad: +₦3,000" — once per in-game day, always the player's choice.
export default function RewardAd({ state, dispatch }: Props) {
  const [status, setStatus] = useState<"idle" | "playing" | string>("idle");
  const { t } = useLang();
  if (!adsAvailable) return null;
  const available = canClaimReward(state);

  return (
    <div className="group" style={{ marginTop: 18 }}>
      <button
        className="row"
        disabled={!available || status === "playing"}
        onClick={() => {
          setStatus("playing");
          showRewardedAd(
            () => {
              dispatch({ type: "reward" });
              setStatus("idle");
            },
            reason => setStatus(reason),
          );
        }}
      >
        <span className="row-emoji" aria-hidden>📺</span>
        <span className="row-main">
          <span className="row-title">{t("ad.title")}</span>
          <span className="row-meta">
            {" "}· {status === "playing" ? t("ad.loading") : available ? t("ad.daily") : t("ad.tomorrow")}
          </span>
          {status !== "idle" && status !== "playing" && <span className="note bad"><br />{t(status)}</span>}
        </span>
        <span className="row-price earn">+{naira(AD_REWARD)}</span>
      </button>
    </div>
  );
}
