import { useState } from "react";
import { useAccount } from "../lib/account";
import { signInWithEmail, signInWithGoogle, signOut } from "../lib/cloud";
import { buySupporterPack, paymentsEnabled, SUPPORTER_PRICE_NAIRA } from "../lib/payments";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";
import { canHaveAccount, getPrivacy, isChild, isMinor } from "../lib/privacy";

type Props = { synced: "off" | "syncing" | "saved" | "error" };


export default function AccountPanel({ synced }: Props) {
  const { enabled, ready, profile } = useAccount();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useLang();
  const privacy = getPrivacy();
  const [agree, setAgree] = useState(false);
  const [parentOk, setParentOk] = useState(false);
  const [buyTerms, setBuyTerms] = useState(false);
  const [buyNow, setBuyNow] = useState(false);
  const [buyParent, setBuyParent] = useState(false);
  const signInReady = agree && (!isChild(privacy) || parentOk);

  if (!enabled) {
    return (
      <p className="note">
        {t("account.off")}
      </p>
    );
  }
  if (!ready) return <p className="note">{t("account.checking")}</p>;

  if (!profile && !canHaveAccount(privacy)) return <p className="note">{t("account.under13")}</p>;

  if (!profile) {
    return (
      <div className="group" style={{ padding: 12 }}>
        <p style={{ marginTop: 0 }}>{t("account.why")}</p>
        <label className="check">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
          <span>{t("account.agree")} (<a href="/terms.html" target="_blank" rel="noopener">{t("me.terms")}</a>, <a href="/privacy.html" target="_blank" rel="noopener">{t("me.privacy")}</a>)</span>
        </label>
        {isChild(privacy) && (
          <label className="check">
            <input type="checkbox" checked={parentOk} onChange={e => setParentOk(e.target.checked)} />
            <span>{t("account.parent")}</span>
          </label>
        )}
        <form
          onSubmit={async e => {
            e.preventDefault();
            setBusy(true);
            const err = await signInWithEmail(email.trim());
            setBusy(false);
            setMessage(err ?? t("account.checkEmail", { email: email.trim() }));
          }}
        >
          <label className="field">
            {t("account.email")}
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <button className="btn block" disabled={busy || !email.includes("@") || !signInReady}>{t("account.sendLink")}</button>
        </form>
        <button
          className="btn plain block"
          disabled={!signInReady}
          onClick={async () => {
            const err = await signInWithGoogle();
            if (err) setMessage(err);
          }}
        >
          {t("account.google")}
        </button>
        {message && <p className="note">{t(message)}</p>}
      </div>
    );
  }

  return (
    <div className="group" style={{ padding: 12 }}>
      <div className="row-title">{t("account.signedIn", { email: profile.email })}</div>
      <div className={`note ${synced === "error" ? "bad" : ""}`}>{synced === "off" ? "" : t(`sync.${synced}`)}</div>

      {profile.supporter ? (
        <p>{t("account.supporter")}</p>
      ) : paymentsEnabled ? (
        <>
          <p className="note">
            {t("account.packPitch", { price: naira(SUPPORTER_PRICE_NAIRA) })}
          </p>
          <label className="check">
            <input type="checkbox" checked={buyTerms} onChange={e => setBuyTerms(e.target.checked)} />
            <span>{t("gems.agreeTerms")} (<a href="/terms.html" target="_blank" rel="noopener">{t("me.terms")}</a>, <a href="/refunds.html" target="_blank" rel="noopener">{t("legal.refunds")}</a>)</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={buyNow} onChange={e => setBuyNow(e.target.checked)} />
            <span>{t("gems.agreeNow")}</span>
          </label>
          {isMinor(privacy) && (
            <label className="check">
              <input type="checkbox" checked={buyParent} onChange={e => setBuyParent(e.target.checked)} />
              <span>{t("gems.parent")}</span>
            </label>
          )}
          <button
            className="btn block"
            disabled={busy || !buyTerms || !buyNow || (isMinor(privacy) && !buyParent)}
            onClick={async () => {
              setBusy(true);
              setMessage("account.opening");
              const r = await buySupporterPack({ terms: buyTerms, immediate: buyNow }); // leaves the page on success
              setBusy(false);
              setMessage(r.message);
            }}
          >
            {t("account.getPack")}
          </button>
        </>
      ) : null}

      <button className="btn plain block" onClick={() => void signOut()}>{t("account.signOut")}</button>
      {message && <p className="note">{t(message)}</p>}
    </div>
  );
}
