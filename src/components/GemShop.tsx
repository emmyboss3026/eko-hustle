import { useState } from "react";
import { GEM_PACKS, type GemPackId } from "../data/revive";
import { naira } from "../engine/economy";
import { buyProduct, paymentsEnabled } from "../lib/payments";
import { canHaveAccount, getPrivacy, isMinor } from "../lib/privacy";
import { useAccount } from "../lib/account";
import { useLang } from "../i18n/react";
import AccountPanel from "./AccountPanel";

/** Buy Power Gems. Prices are final (no hidden fees), and both boxes must be ticked by the player. */
export default function GemShop({ balance }: { balance: number | null }) {
  const { t } = useLang();
  const { profile } = useAccount();
  const [pack, setPack] = useState<GemPackId>("gems-5");
  const [terms, setTerms] = useState(false);
  const [now, setNow] = useState(false);
  const [parent, setParent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const privacy = getPrivacy();
  const minor = isMinor(privacy);

  if (!canHaveAccount(privacy)) return <p className="note pad">{t("gems.under13")}</p>;
  if (!paymentsEnabled) return <p className="note pad">{t("gems.notYet")}</p>;
  if (!profile) {
    return (
      <>
        <p className="note">{t("gems.signIn")}</p>
        <AccountPanel synced="off" />
      </>
    );
  }

  const chosen = GEM_PACKS.find(p => p.id === pack)!;
  const ready = terms && now && (!minor || parent);

  return (
    <div className="gem-shop">
      <p className="note">{t("gems.lede")}</p>
      {balance !== null && <p className="gem-balance">💎 {t("gems.balance", { n: balance })}</p>}
      <div className="gem-packs" role="radiogroup" aria-label={t("gems.packs")}>
        {GEM_PACKS.map(p => (
          <button key={p.id} role="radio" aria-checked={pack === p.id} className="gem-pack" onClick={() => setPack(p.id)}>
            <span className="gem-icon" aria-hidden>{"💎".repeat(Math.min(3, p.gems === 1 ? 1 : p.gems < 10 ? 2 : 3))}</span>
            <b>{t("gems.count", { n: p.gems })}</b>
            <span>{naira(p.price)}</span>
            <small>{t("gems.each", { money: naira(Math.round(p.price / p.gems)) })}</small>
          </button>
        ))}
      </div>
      <label className="check">
        <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />
        <span>{t("gems.agreeTerms")} (<a href="/terms.html" target="_blank" rel="noopener">{t("me.terms")}</a>, <a href="/refunds.html" target="_blank" rel="noopener">{t("legal.refunds")}</a>)</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={now} onChange={e => setNow(e.target.checked)} />
        <span>{t("gems.agreeNow")}</span>
      </label>
      {minor && (
        <label className="check">
          <input type="checkbox" checked={parent} onChange={e => setParent(e.target.checked)} />
          <span>{t("gems.parent")}</span>
        </label>
      )}
      <button
        className="btn block"
        disabled={!ready || busy}
        onClick={async () => {
          setBusy(true);
          setMsg("account.opening");
          try {
            sessionStorage.setItem("eko-hustle-gems-before", String(balance ?? 0));
          } catch {
            // ignore
          }
          const r = await buyProduct(chosen.id, { terms, immediate: now });
          setBusy(false);
          setMsg(r.message);
        }}
      >
        {t("gems.buy", { n: chosen.gems, money: naira(chosen.price) })}
      </button>
      <p className="note">{t("gems.fine")}</p>
      {msg && <p className="note">{t(msg)}</p>}
    </div>
  );
}
