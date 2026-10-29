import { useAccount } from "../lib/account";

// Banner shown after the player comes back from the Bachs payment page
export default function PaymentNotice() {
  const { notice, clearNotice } = useAccount();
  if (!notice) return null;
  return (
    <div className="rush" role="status" style={{ margin: "10px 14px 0", display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ flex: 1 }}>{notice}</span>
      <button className="btn plain" style={{ padding: "2px 8px" }} onClick={clearNotice} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
