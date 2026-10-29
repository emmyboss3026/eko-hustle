import { useEffect, useState } from "react";
import { useAccount } from "../lib/account";
import { play } from "../lib/sound";
import Leaderboard from "../components/Leaderboard";
import type { EndingKind, GameState } from "../engine/game";
import { naira } from "../engine/economy";
import { useLang } from "../i18n/react";

const good: Record<EndingKind, boolean> = { japa: true, landlord: true, evicted: false, collapsed: false };

type Props = { state: GameState; onRestart: () => void };

export default function Ending({ state, onRestart }: Props) {
  const { t, tx } = useLang();
  const [copied, setCopied] = useState(false);
  const { profile } = useAccount();
  const gold = !!profile?.supporter;
  const kind = state.ending?.kind ?? "collapsed";
  const e = { title: t(`ending.${kind}.title`), line: t(`ending.${kind}.line`), good: good[kind] };
  useEffect(() => {
    play(e.good ? "win" : "lose");
  }, [e.good]);
  const day = state.ending?.day ?? 1;
  const s = state.stats;
  const job = state.career ? tx.title(state.career.id, state.career.level) : t("ending.unemployed");

  const lines: [string, string][] = [
    [t("ending.r.days"), String(day)],
    [t("ending.r.job"), job],
    [t("ending.r.shifts"), String(s.shifts)],
    [t("ending.r.promotions"), String(s.promotions)],
    [t("ending.r.trips"), String(s.trips)],
    [t("ending.r.events"), String(s.events)],
    [t("ending.r.sentHome"), naira(s.sentHome)],
    [t("ending.r.earned"), naira(s.earned)],
    [t("ending.r.spent"), naira(s.spent)],
  ];

  const summary = t("ending.share", {
    avatar: state.sim.avatar, name: state.sim.name, trait: tx.trait(state.sim.trait).name, line: e.line, day,
    earned: naira(s.earned), sent: naira(s.sentHome),
  });

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
    g.fillText(t("ending.receipt"), W / 2, 480);
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
    g.fillText(t("ending.thanks"), W / 2, 1180);
    const a = document.createElement("a");
    a.download = `eko-hustle-${state.sim.name.toLowerCase().replace(/\W+/g, "-")}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  }

  return (
    <main className="app ending">
      <div style={{ fontSize: 56 }} aria-hidden>{e.good ? "🎉" : "😓"}</div>
      <h1 className="ending-head">{e.title}</h1>
      <p>{t("ending.summary", { avatar: state.sim.avatar, name: state.sim.name, line: e.line, day })}</p>

      <section className={`receipt ${gold ? "gold" : ""}`} aria-label={t("ending.receipt")}>
        <div className="receipt-center">
          <b>{t("ending.receipt")}</b>
          <br />
          {state.sim.name} · {tx.trait(state.sim.trait).name}
        </div>
        <hr />
        {lines.map(([k, v]) => (
          <div key={k} className="receipt-line"><span>{k}</span><span>{v}</span></div>
        ))}
        <hr />
        <div className="receipt-line receipt-total"><span>{t("ending.r.balance")}</span><span>{naira(state.money)}</span></div>
        <hr />
        <div className="receipt-center">{t("ending.thanks")}</div>
      </section>

      <div className="ending-actions">
        <button className="btn" onClick={download}>{t("ending.download")}</button>
        <button className="btn plain" onClick={copy}>{copied ? t("ending.copied") : t("ending.copy")}</button>
        <button className="btn plain" onClick={onRestart}>{t("me.newLife")}</button>
      </div>

      {profile ? (
        <p className="note">{t("ending.onBoard")}</p>
      ) : null}
      <Leaderboard ending={state.ending?.kind === "landlord" ? "landlord" : "japa"} title={t("ending.board")} />
    </main>
  );
}
