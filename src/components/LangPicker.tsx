import { LANGS } from "../i18n/core";
import { useLang } from "../i18n/react";

/** English · Deutsch · Naija Pidgin */
export default function LangPicker({ big = false }: { big?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`lang-picker ${big ? "big" : ""}`} role="radiogroup" aria-label={t("lang.choose")}>
      {LANGS.map(l => (
        <button key={l.id} role="radio" aria-checked={lang === l.id} onClick={() => setLang(l.id)}>
          <span aria-hidden>{l.flag}</span>
          <b>{l.label}</b>
          {big && <small>{l.hint}</small>}
        </button>
      ))}
    </div>
  );
}
