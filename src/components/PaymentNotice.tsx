import { useAccount } from "../lib/account";
import { useLang } from "../i18n/react";

// Banner shown after the player comes back from the Bachs payment page
export default function PaymentNotice() {
  const { notice, clearNotice } = useAccount();
  const { t } = useLang();
  if (!notice) return null;
  return (
    <div className="rush" role="status" style={{ margin: 0, display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ flex: 1 }}>{t(notice)}</span>
      <button className="btn plain" style={{ padding: "2px 8px" }} onClick={clearNotice} aria-label={t("ui.close")}>
        ✕
      </button>
    </div>
  );
}
