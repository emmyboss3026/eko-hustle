import { useEffect, useState } from "react";
import { DEVICE_KEYS_PREFIX, getPrivacy, onPrivacy, setPrivacy, isChild, type AgeBand } from "../lib/privacy";
import { deleteMyAccount, exportMyData } from "../lib/cloud";
import { useAccount } from "../lib/account";
import type { GameState } from "../engine/game";
import { useLang } from "../i18n/react";

const AGES: AgeBand[] = ["under13", "13-15", "16-17", "adult"];
import { LEGAL_PAGES } from "../data/legal";

function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 👤 Me → Privacy & your data: choices, legal pages, download and delete. */
export default function PrivacySettings({ state }: { state: GameState }) {
  const { t } = useLang();
  const { profile } = useAccount();
  const [p, setP] = useState(getPrivacy);
  const [confirm, setConfirm] = useState<"device" | "account" | null>(null);
  const [typed, setTyped] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => onPrivacy(setP), []);
  const child = isChild(p);

  async function download() {
    setBusy(true);
    const online = profile ? await exportMyData() : null;
    const device: Record<string, unknown> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (k.startsWith(DEVICE_KEYS_PREFIX)) device[k] = localStorage.getItem(k);
      }
    } catch {
      // ignore
    }
    downloadJson(`eko-hustle-my-data-${new Date().toISOString().slice(0, 10)}.json`, { game: state, device, online });
    setBusy(false);
    setMsg(profile && !online ? "privacy.exportPartial" : "privacy.exported");
  }

  function wipeDevice() {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (k.startsWith(DEVICE_KEYS_PREFIX) || k.startsWith("sb-")) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {
      // ignore
    }
    location.reload();
  }

  async function wipeAccount() {
    setBusy(true);
    const ok = await deleteMyAccount();
    setBusy(false);
    if (ok) wipeDevice();
    else setMsg("privacy.deleteFailed");
  }

  return (
    <>
      <h3>🔒 {t("privacy.title")}</h3>
      <div className="group">
        <div className="row static">
          <span className="row-emoji" aria-hidden>🎂</span>
          <span className="row-main">
            <span className="row-title">{t("consent.age")}</span>
            <span className="seg small">
              {AGES.map(a => (
                <button key={a} type="button" aria-pressed={p.age === a} onClick={() => setPrivacy({ age: a, decided: true })}>{t(`consent.age.${a}`)}</button>
              ))}
            </span>
          </span>
        </div>
        <button className="row" aria-pressed={p.stats} onClick={() => setPrivacy({ stats: !p.stats, decided: true })}>
          <span className="row-emoji" aria-hidden>📊</span>
          <span className="row-main"><span className="row-title">{t("consent.stats")}</span><span className="note">{t("consent.statsInfo")}</span></span>
          <span className="row-price">{p.stats ? t("me.on") : t("me.off")}</span>
        </button>
        <button className="row" aria-pressed={p.ads && !child} disabled={child} onClick={() => setPrivacy({ ads: !p.ads, decided: true })}>
          <span className="row-emoji" aria-hidden>🎯</span>
          <span className="row-main"><span className="row-title">{t("consent.ads")}</span><span className="note">{t(child ? "consent.adsChild" : "consent.adsInfo")}</span></span>
          <span className="row-price">{p.ads && !child ? t("me.on") : t("me.off")}</span>
        </button>
      </div>

      <div className="group legal-links">
        {LEGAL_PAGES.map(page => (
          <a key={page} className="row" href={`/${page}.html`} target="_blank" rel="noopener">
            <span className="row-emoji" aria-hidden>📄</span>
            <span className="row-main"><span className="row-title">{t(`legal.${page}`)}</span></span>
            <span className="row-price" aria-hidden>↗</span>
          </a>
        ))}
      </div>

      <div className="group">
        <button className="row" disabled={busy} onClick={() => void download()}>
          <span className="row-emoji" aria-hidden>⬇️</span>
          <span className="row-main"><span className="row-title">{t("privacy.export")}</span><span className="note">{t(profile ? "privacy.exportInfo" : "privacy.exportLocal")}</span></span>
        </button>
        <button className="row" onClick={() => { setConfirm("device"); setTyped(""); }}>
          <span className="row-emoji" aria-hidden>🧹</span>
          <span className="row-main"><span className="row-title">{t("privacy.wipeDevice")}</span><span className="note">{t("privacy.wipeDeviceInfo")}</span></span>
        </button>
        {profile && (
          <button className="row danger" onClick={() => { setConfirm("account"); setTyped(""); }}>
            <span className="row-emoji" aria-hidden>🗑️</span>
            <span className="row-main"><span className="row-title">{t("privacy.deleteAccount")}</span><span className="note">{t("privacy.deleteAccountInfo")}</span></span>
          </button>
        )}
      </div>
      {msg && <p className="note">{t(msg)}</p>}

      {confirm && (
        <div className="confirm-box" role="alertdialog" aria-labelledby="confirm-title">
          <b id="confirm-title">{t(confirm === "account" ? "privacy.confirmAccount" : "privacy.confirmDevice")}</b>
          {confirm === "account" && (
            <label className="field">
              {t("privacy.typeDelete")}
              <input value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" />
            </label>
          )}
          <div className="btn-row">
            <button className="btn plain" onClick={() => setConfirm(null)}>{t("privacy.cancel")}</button>
            <button
              className="btn danger"
              disabled={busy || (confirm === "account" && typed.trim().toUpperCase() !== t("privacy.deleteWord").toUpperCase())}
              onClick={() => (confirm === "account" ? void wipeAccount() : wipeDevice())}
            >
              {t("privacy.confirmButton")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
