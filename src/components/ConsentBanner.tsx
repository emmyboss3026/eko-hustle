import { useEffect, useState } from "react";
import { getPrivacy, onPrivacy, setPrivacy, type AgeBand } from "../lib/privacy";
import { useLang } from "../i18n/react";

const AGES: AgeBand[] = ["under13", "13-15", "16-17", "adult"];

/** First launch: your age group and what you allow. All choices are equal; nothing is ticked for you. */
export default function ConsentBanner() {
  const { t } = useLang();
  const [p, setP] = useState(getPrivacy);
  const [choose, setChoose] = useState(false);
  const [age, setAge] = useState<AgeBand | null>(p.age);
  const [stats, setStats] = useState(false);
  const [ads, setAds] = useState(false);
  useEffect(() => onPrivacy(setP), []);
  if (p.decided) return null;

  const child = age === "under13" || age === "13-15";
  const save = (s: boolean, a: boolean) => age && setPrivacy({ decided: true, age, stats: s, ads: a && !child });

  return (
    <div className="consent-backdrop">
      <section className="consent" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <h2 id="consent-title">🍪 {t("consent.title")}</h2>
        <p>{t("consent.lede")}</p>

        <fieldset className="consent-age">
          <legend>{t("consent.age")}</legend>
          <div className="seg">
            {AGES.map(a => (
              <button key={a} type="button" aria-pressed={age === a} onClick={() => setAge(a)}>{t(`consent.age.${a}`)}</button>
            ))}
          </div>
          {age === "under13" && <p className="note">{t("consent.under13")}</p>}
          {age === "13-15" && <p className="note">{t("consent.teen")}</p>}
        </fieldset>

        {choose && (
          <div className="consent-choices">
            <label className="consent-row">
              <input type="checkbox" checked disabled />
              <span><b>{t("consent.essential")}</b><small>{t("consent.essentialInfo")}</small></span>
            </label>
            <label className="consent-row">
              <input type="checkbox" checked={stats} onChange={e => setStats(e.target.checked)} />
              <span><b>{t("consent.stats")}</b><small>{t("consent.statsInfo")}</small></span>
            </label>
            <label className="consent-row">
              <input type="checkbox" checked={ads && !child} disabled={child} onChange={e => setAds(e.target.checked)} />
              <span><b>{t("consent.ads")}</b><small>{t(child ? "consent.adsChild" : "consent.adsInfo")}</small></span>
            </label>
          </div>
        )}

        {!age && <p className="note bad">{t("consent.pickAge")}</p>}
        <div className="consent-buttons">
          {choose ? (
            <button className="btn" disabled={!age} onClick={() => save(stats, ads)}>{t("consent.save")}</button>
          ) : (
            <>
              <button className="btn" disabled={!age} onClick={() => save(true, true)}>{t("consent.all")}</button>
              <button className="btn" disabled={!age} onClick={() => save(false, false)}>{t("consent.essentialOnly")}</button>
              <button className="btn plain" onClick={() => setChoose(true)}>{t("consent.choose")}</button>
            </>
          )}
        </div>
        <p className="note consent-links">
          <a href="/privacy.html" target="_blank" rel="noopener">{t("me.privacy")}</a> ·{" "}
          <a href="/cookies.html" target="_blank" rel="noopener">{t("legal.cookies")}</a> ·{" "}
          <a href="/terms.html" target="_blank" rel="noopener">{t("me.terms")}</a>
        </p>
      </section>
    </div>
  );
}
