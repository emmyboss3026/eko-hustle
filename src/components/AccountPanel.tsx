import { useState } from "react";
import { useAccount } from "../lib/account";
import { signInWithEmail, signInWithGoogle, signOut } from "../lib/cloud";
import { buySupporterPack, paymentsEnabled, SUPPORTER_PRICE_NAIRA } from "../lib/payments";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";

type Props = { synced: "off" | "syncing" | "saved" | "error" };


export default function AccountPanel({ synced }: Props) {
  const { enabled, ready, profile } = useAccount();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useLang();

  if (!enabled) {
    return (
      <p className="note">
        {t("account.off")}
      </p>
    );
  }
  if (!ready) return <p className="note">{t("account.checking")}</p>;

  if (!profile) {
    return (
      <div className="group" style={{ padding: 12 }}>
        <p style={{ marginTop: 0 }}>{t("account.why")}</p>
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
          <button className="btn block" disabled={busy || !email.includes("@")}>{t("account.sendLink")}</button>
        </form>
        <button
          className="btn plain block"
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
          <button
            className="btn block"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMessage("account.opening");
              const r = await buySupporterPack(); // leaves the page on success
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
