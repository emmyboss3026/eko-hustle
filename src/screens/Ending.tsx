import { useEffect, useState } from "react";
import { useAccount } from "../lib/account";
import { play } from "../lib/sound";
import Leaderboard from "../components/Leaderboard";
import type { EndingKind, GameState } from "../engine/game";
import { naira } from "../engine/economy";
import { traits } from "../data/traits";
import { careers } from "../data/careers";

const endings: Record<EndingKind, { title: string; line: string; good: boolean }> = {
  japa: { title: "Japa successful!", line: "boarded a plane to a new life abroad", good: true },
  landlord: { title: "Landlord at last!", line: "bought their own flat in Lagos", good: true },
  evicted: { title: "Evicted", line: "couldn't pay rent and was thrown out", good: false },
  collapsed: { title: "Rushed to hospital", line: "ignored their needs and collapsed", good: false },
};

type Props = { state: GameState; onRestart: () => void };

export default function Ending({ state, onRestart }: Props) {
  const [copied, setCopied] = useState(false);
  const { profile } = useAccount();
  const gold = !!profile?.supporter;
  const e = endings[state.ending?.kind ?? "collapsed"];
  useEffect(() => {
    play(e.good ? "win" : "lose");
  }, [e.good]);
  const day = state.ending?.day ?? 1;
  const s = state.stats;
  const job = state.career ? careers[state.career.id].levels[state.career.level].title : "Unemployed";

  const lines: [string, string][] = [
    ["Days in Lagos", String(day)],
    ["Last job", job],
    ["Shifts worked", String(s.shifts)],
    ["Promotions", String(s.promotions)],
    ["Trips taken", String(s.trips)],
    ["Life events", String(s.events)],
    ["Sent to family", naira(s.sentHome)],
    ["Total earned", naira(s.earned)],
    ["Total spent", naira(s.spent)],
  ];

  const summary =
    `${state.sim.avatar} ${state.sim.name} (${traits[state.sim.trait].name}) ${e.line} after ${day} days in Lagos. ` +
    `Earned ${naira(s.earned)}, sent ${naira(s.sentHome)} home. #EkoHustle`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function download() {
    try {
      await document.fonts.ready;
    } catch {
      // fonts not ready: draw with fallbacks
    }
    const W = 1080, H = 1350;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    if (!g) return;
    // danfo yellow with a black band
    g.fillStyle = "#F2C200";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#262622";
    g.fillRect(0, 300, W, 40);
    g.fillStyle = "#262622";
    g.font = "64px Bungee, 'Arial Black', sans-serif";
    g.fillText("EKO HUSTLE", 70, 130);
    g.font = "bold 44px 'Atkinson Hyperlegible', sans-serif";
    g.fillText(`${state.sim.name} · ${e.title}`, 70, 220);
    // receipt
    g.fillStyle = gold ? "#FFE680" : "#FFFDF7";
    g.fillRect(110, 400, W - 220, 820);
    g.fillStyle = "#262622";
    g.font = "bold 40px 'Courier Prime', monospace";
    g.textAlign = "center";
    g.fillText("LAGOS LIFE RECEIPT", W / 2, 480);
    g.font = "32px 'Courier Prime', monospace";
    g.fillText(`${state.sim.name} ${e.line}`.slice(0, 44), W / 2, 535);
    g.textAlign = "left";
    lines.forEach(([k, v], i) => {
      const y = 620 + i * 62;
      g.fillText(k, 160, y);
      g.textAlign = "right";
      g.fillText(v, W - 160, y);
      g.textAlign = "left";
    });
    g.textAlign = "center";
    g.font = "bold 34px 'Courier Prime', monospace";
    g.fillText("*** THANK YOU, COME AGAIN ***", W / 2, 1180);
    const a = document.createElement("a");
    a.download = `eko-hustle-${state.sim.name.toLowerCase().replace(/\W+/g, "-")}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  }

  return (
    <main className="app ending">
      <div style={{ fontSize: 56 }} aria-hidden>{e.good ? "🎉" : "😓"}</div>
      <h1 className="ending-head">{e.title}</h1>
      <p>{state.sim.avatar} {state.sim.name} {e.line} on day {day}.</p>

      <section className={`receipt ${gold ? "gold" : ""}`} aria-label="Your Lagos life receipt">
        <div className="receipt-center">
          <b>LAGOS LIFE RECEIPT</b>
          <br />
          {state.sim.name} · {traits[state.sim.trait].name}
        </div>
        <hr />
        {lines.map(([k, v]) => (
          <div key={k} className="receipt-line"><span>{k}</span><span>{v}</span></div>
        ))}
        <hr />
        <div className="receipt-line receipt-total"><span>Final balance</span><span>{naira(state.money)}</span></div>
        <hr />
        <div className="receipt-center">*** THANK YOU, COME AGAIN ***</div>
      </section>

      <div className="ending-actions">
        <button className="btn" onClick={download}>Download your receipt</button>
        <button className="btn plain" onClick={copy}>{copied ? "Copied!" : "Copy a summary to share"}</button>
        <button className="btn plain" onClick={onRestart}>Start a new life</button>
      </div>

      {profile ? (
        <p className="note">Your result was added to the leaderboard.</p>
      ) : null}
      <Leaderboard ending={state.ending?.kind === "landlord" ? "landlord" : "japa"} title="🏆 All-time fastest" />
    </main>
  );
}
