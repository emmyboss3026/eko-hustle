import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { getPrivacy, onPrivacy } from "../lib/privacy";

/** Visit statistics (Vercel Web Analytics) only after the player says yes. */
export default function ConsentedAnalytics() {
  const [on, setOn] = useState(() => getPrivacy().stats);
  useEffect(() => onPrivacy(p => setOn(p.stats)), []);
  return on ? <Analytics /> : null;
}
