import { useState } from "react";
import { useAccount } from "../lib/account";
import { signInWithEmail, signInWithGoogle, signOut } from "../lib/cloud";
import { buySupporterPack, paymentsEnabled, SUPPORTER_PRICE_NAIRA } from "../lib/payments";
import { naira } from "../engine/economy";

type Props = { synced: "off" | "syncing" | "saved" | "error" };

const syncText = {
  off: "",
  syncing: "Saving to the cloud…",
  saved: "✓ Saved to the cloud",
  error: "Couldn't reach the cloud. Your game is still saved on this device.",
};

export default function AccountPanel({ synced }: Props) {
  const { enabled, ready, profile } = useAccount();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!enabled) {
    return (
      <p className="note">
        Cloud save is off. Your game is saved on this device only.
      </p>
    );
  }
  if (!ready) return <p className="note">Checking your account…</p>;

  if (!profile) {
    return (
      <div className="group" style={{ padding: 12 }}>
        <p style={{ marginTop: 0 }}>Sign in to keep your game on every device and join the leaderboard.</p>
        <form
          onSubmit={async e => {
            e.preventDefault();
            setBusy(true);
            const err = await signInWithEmail(email.trim());
            setBusy(false);
            setMessage(err ?? `Check ${email.trim()} for a sign-in link.`);
          }}
        >
          <label className="field">
            Email
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <button className="btn block" disabled={busy || !email.includes("@")}>Email me a sign-in link</button>
        </form>
        <button
          className="btn plain block"
          onClick={async () => {
            const err = await signInWithGoogle();
            if (err) setMessage(err);
          }}
        >
          Continue with Google
        </button>
        {message && <p className="note">{message}</p>}
      </div>
    );
  }

  return (
    <div className="group" style={{ padding: 12 }}>
      <div className="row-title">Signed in as {profile.email}</div>
      <div className={`note ${synced === "error" ? "bad" : ""}`}>{syncText[synced]}</div>

      {profile.supporter ? (
        <p>🌟 You're a supporter. Thank you! Supporter looks are unlocked when you start a new life.</p>
      ) : paymentsEnabled ? (
        <>
          <p className="note">
            Like the game? The supporter pack ({naira(SUPPORTER_PRICE_NAIRA)}, one time) unlocks 8 extra looks and a gold
            receipt. It changes nothing in gameplay. Pay by card, bank transfer or mobile money on Bachs's secure page.
          </p>
          <button
            className="btn block"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMessage("Opening the secure payment page…");
              const r = await buySupporterPack(); // leaves the page on success
              setBusy(false);
              setMessage(r.message);
            }}
          >
            Get the supporter pack
          </button>
        </>
      ) : null}

      <button className="btn plain block" onClick={() => void signOut()}>Sign out</button>
      {message && <p className="note">{message}</p>}
    </div>
  );
}
