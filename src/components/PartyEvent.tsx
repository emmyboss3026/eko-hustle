// Party games with friends at home: the owner picks a race or a dance battle, everyone in the room taps, the server counts.
import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n/react";
import { play } from "../lib/audio";
import type { HomeNet } from "./useHomeNet";

type Props = {
  net: HomeNet;
  canStart: boolean;                                      // only the owner can start one
  onDone?: (place: number, players: number) => void;      // you finished: your place and how many played
};

export default function PartyEvent({ net, canStart, onDone }: Props) {
  const { t } = useLang();
  const { party, me } = net;
  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState(0);
  const reported = useRef<unknown>(null);

  useEffect(() => {
    if (!party || party.phase === "done") return;
    const id = setInterval(() => setNow(Date.now()), 80);
    return () => clearInterval(id);
  }, [party]);

  useEffect(() => {
    if (party?.phase !== "done" || !party.ranking || reported.current === party) return;
    reported.current = party;
    const place = party.ranking.findIndex(r => r[0] === me) + 1;
    if (place > 0) onDone?.(place, party.ranking.length);
  }, [party, me, onDone]);

  useEffect(() => {
    if (!party || party.phase === "done") return;
    const key = (e: KeyboardEvent) => { if (e.code === "Space" && now >= party.startsAt) { e.preventDefault(); tap(); } };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  function tap() {
    if (!party || now < party.startsAt || now > party.endsAt) return;
    net.tap();
    play("pop");
    setFlash(f => f + 1);
  }

  if (!party) {
    if (!canStart || net.peers.length === 0) return null;
    return (
      <div className="party-start" role="group" aria-label={t("party.title")}>
        <b>🎉 {t("party.title")}</b>
        <button className="btn" onClick={() => net.startParty("race")}>🏁 {t("party.race")}</button>
        <button className="btn" onClick={() => net.startParty("dance")}>💃 {t("party.dance")}</button>
      </div>
    );
  }

  const counting = now < party.startsAt;
  const left = Math.max(0, Math.ceil((party.endsAt - now) / 1000));
  const phase = ((now - party.startsAt) % party.beatMs + party.beatMs) % party.beatMs / party.beatMs;   // 0 on the beat
  const near = Math.min(phase, 1 - phase) < 0.18;
  const rows = Object.entries(party.scores).sort((a, b) => b[1] - a[1]);
  const top = party.kind === "race" ? party.finish : Math.max(10, ...rows.map(r => r[1]));

  return (
    <div className="party" role="dialog" aria-label={t(`party.${party.kind}`)}>
      <h3>{party.kind === "race" ? "🏁" : "💃"} {t(`party.${party.kind}`)}</h3>
      {party.phase === "done" ? (
        <>
          <p className="party-big">{party.ranking?.[0]?.[0] === me ? t("party.youWon") : t("party.winner", { name: party.ranking?.[0]?.[1] ?? "" })}</p>
          <ol className="party-rank">{party.ranking?.map(([id, name, score], i) => <li key={id} className={id === me ? "me" : ""}>{["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`} {name} <b>{score}</b></li>)}</ol>
          <button className="btn" onClick={net.closeParty}>{t("party.close")}</button>
        </>
      ) : (
        <>
          <p className="note">{counting ? t("party.getReady") : party.kind === "race" ? t("party.raceHelp") : t("party.danceHelp")} {!counting && `· ⏱️ ${left}s`}</p>
          {counting ? (
            <div className="party-big">{Math.max(1, Math.ceil((party.startsAt - now) / 1000))}</div>
          ) : (
            <button className={`party-tap ${party.kind} ${near ? "beat" : ""}`} key={flash} onPointerDown={tap} aria-label={t("party.tap")}>
              {party.kind === "dance" && <span className="beat-ring" style={{ transform: `scale(${1.9 - phase * 0.9})`, opacity: 0.25 + (1 - phase) * 0.6 }} />}
              <span>{party.kind === "race" ? "🏃🏾" : "🕺🏾"}</span>
              <b>{t("party.tap")}</b>
            </button>
          )}
          <div className="party-bars">
            {rows.map(([id, score]) => (
              <div key={id} className={`party-row ${id === me ? "me" : ""}`}>
                <span>{party.names[id] ?? "?"}</span>
                <i style={{ width: `${Math.min(100, (score / top) * 100)}%` }} />
                <b>{score}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
