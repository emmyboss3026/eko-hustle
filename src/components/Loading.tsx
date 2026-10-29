import { useLang } from "../i18n/react";

/** Shown while a big part of the game (the 3D room or streets) downloads. */
export default function Loading() {
  const { t } = useLang();
  return (
    <div className="loading" role="status">
      <div className="loading-danfo" aria-hidden>🚌</div>
      <b>{t("loading.title")}</b>
      <span className="note">{t("loading.note")}</span>
      <div className="loading-bar" aria-hidden><i /></div>
    </div>
  );
}
