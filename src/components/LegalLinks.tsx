import { useLang } from "../i18n/react";
import { LEGAL_PAGES } from "../data/legal";

/** Links to every legal page (footer of the start screen, Me and the ending). */
export default function LegalLinks() {
  const { t } = useLang();
  return (
    <p className="note footer-links">
      {LEGAL_PAGES.map((p, i) => (
        <span key={p}>
          {i > 0 && " · "}
          <a href={`/${p}.html`} target="_blank" rel="noopener">{t(`legal.${p}`)}</a>
        </span>
      ))}
    </p>
  );
}
