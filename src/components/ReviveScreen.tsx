import { useEffect, useRef, useState } from "react";
import { canRevive, type Command, type GameState } from "../engine/game";
import { naira } from "../engine/economy";
import { REVIVE } from "../data/revive";
import { adsAvailable, showRewardedAd } from "../lib/ads";
import { gemBalance, newReviveRef, spendGem } from "../lib/gems";
import { useAccount } from "../lib/account";
import { play } from "../lib/audio";
import { useLang } from "../i18n/react";
import GemShop from "./GemShop";

/** After collapsing: come back with an ad or a Power Gem, or end this life. No timers, no pressure. */
export default function ReviveScreen({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t } = useLang();
  const { profile } = useAccount();
  const [gems, setGems] = useState<number | null>(null);
  const [busy, setBusy] = useState<"ad" | "gem" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [shop, setShop] = useState(false);
  const ref = useRef<string>(newReviveRef()); // the same id if a gem revive is retried
  const adsLeft = REVIVE.ad.perLife - (state.revives?.ad ?? 0);

  useEffect(() => {
    play("lose");
    void gemBalance().then(setGems);
  }, [profile]);

  function watchAd() {
    setBusy("ad");
    setMsg(null);
    showRewardedAd(
      () => {
        setBusy(null);
        dispatch({ type: "revive", how: "ad" });
      },
      reason => {
        setBusy(null);
        setMsg(reason);
      },
      "revive",
    );
  }

  async function spendOne() {
    setBusy("gem");
    setMsg(null);
    const r = await spendGem(ref.current);
    setBusy(null);
    if (r.ok) {
      dispatch({ type: "revive", how: "gem", ref: r.ref });
      return;
    }
    if (r.reason === "no_gems") {
      setGems(0);
      setShop(true);
    }
    setMsg(r.reason === "signin" ? "gems.signIn" : r.reason === "no_gems" ? "gems.none" : "gems.network");
  }

  return (
    <main className="app revive">
      <section className="revive-card">
        <div className="revive-emoji" aria-hidden>🚑</div>
        <h1>{t("revive.title")}</h1>
        <p>{t("revive.lede", { name: state.sim.name })}</p>

        <div className="revive-options">
          {adsAvailable && canRevive(state, "ad") && (
            <button className="revive-option" disabled={busy !== null} onClick={watchAd}>
              <span className="revive-icon" aria-hidden>📺</span>
              <b>{busy === "ad" ? t("ad.loading") : t("revive.ad")}</b>
              <small>{t("revive.adInfo", { health: REVIVE.ad.health, money: naira(REVIVE.ad.bill), n: adsLeft })}</small>
            </button>
          )}
          <button className="revive-option gem" disabled={busy !== null} onClick={() => (gems && gems > 0 ? void spendOne() : setShop(s => !s))}>
            <span className="revive-icon" aria-hidden>💎</span>
            <b>{busy === "gem" ? t("ui.loading") : gems && gems > 0 ? t("revive.gem") : t("revive.getGems")}</b>
            <small>{gems !== null ? t("revive.gemInfo", { n: gems }) : t("revive.gemInfoSignIn")}</small>
          </button>
        </div>
        {!adsAvailable && <p className="note">{t("revive.noAds")}</p>}
        {adsAvailable && !canRevive(state, "ad") && <p className="note">{t("revive.adsUsed")}</p>}
        {msg && <p className="note bad">{t(msg)}</p>}

        {shop && <GemShop balance={gems} />}

        <button className="btn plain block end-life" disabled={busy !== null} onClick={() => dispatch({ type: "finalize" })}>
          {t("revive.end")}
        </button>
        <p className="note">{t("revive.fair")}</p>
      </section>
    </main>
  );
}
