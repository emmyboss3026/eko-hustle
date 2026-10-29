import { useEffect, useState } from "react";
import { gemBalance } from "../lib/gems";
import { useAccount } from "../lib/account";
import { paymentsEnabled } from "../lib/payments";
import { useLang } from "../i18n/react";
import GemShop from "./GemShop";

/** 👤 Me → your Power Gems (used to revive after collapsing), with the shop. */
export default function GemsSection() {
  const { t } = useLang();
  const { profile } = useAccount();
  const [gems, setGems] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    void gemBalance().then(setGems);
  }, [profile]);
  if (!paymentsEnabled) return null;
  return (
    <div className="group gems-row">
      <button className="row" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="row-emoji" aria-hidden>💎</span>
        <span className="row-main"><span className="row-title">{t("gems.title")}</span><span className="note">{t("gems.what")}</span></span>
        <span className="row-price">{gems ?? "—"}</span>
      </button>
      {open && <div className="pad"><GemShop balance={gems} /></div>}
    </div>
  );
}
