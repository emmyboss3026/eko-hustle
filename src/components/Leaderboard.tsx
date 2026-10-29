import { useEffect, useState } from "react";
import { fetchLeaderboard, type Run } from "../lib/cloud";
import { cloudEnabled } from "../lib/supabase";
import { traits, type TraitId } from "../data/traits";

type Props = { ending: "japa" | "landlord"; title: string };

export default function Leaderboard({ ending, title }: Props) {
  const [runs, setRuns] = useState<Run[] | null>(null);

  useEffect(() => {
    if (!cloudEnabled) return;
    let alive = true;
    fetchLeaderboard(ending).then(r => alive && setRuns(r));
    return () => {
      alive = false;
    };
  }, [ending]);

  if (!cloudEnabled) return null;

  return (
    <>
      <h3>{title}</h3>
      <div className="group">
        {runs === null && <p className="note" style={{ padding: 12 }}>Loading…</p>}
        {runs?.length === 0 && <p className="note" style={{ padding: 12 }}>No one has done it yet. Be the first!</p>}
        {runs && runs.length > 0 && (
          <ol className="log leaderboard">
            {runs.map((r, i) => (
              <li key={i}>
                <span>{i + 1}. {r.sim_name} {traits[r.trait as TraitId]?.emoji ?? ""}</span>
                <span>day {r.days}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
