import { useState } from "react";
import { dayOf, mood, moodPay, type GameState } from "../engine/game";
import { moodlets } from "../data/moodlets";
import { skillInfo, MAX_SKILL, type SkillId } from "../data/skills";
import { traits } from "../data/traits";
import { naira } from "../engine/economy";
import { Progress } from "./ui";
import AccountPanel from "./AccountPanel";
import { isMuted, setMuted } from "../lib/sound";
import { exportSave, importSave } from "../engine/save";

type Props = { state: GameState; onRestart: () => void; onLoad: (s: GameState) => void; onGuide: () => void; synced: "off" | "syncing" | "saved" | "error" };

export default function MeTab({ state, onRestart, onLoad, onGuide, synced }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [fileMsg, setFileMsg] = useState<string | null>(null);

  function download() {
    const blob = new Blob([exportSave(state)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `eko-hustle-${state.sim.name.toLowerCase().replace(/\W+/g, "-")}-day${dayOf(state.time)}.json`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setFileMsg("Save file downloaded. Keep it somewhere safe.");
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      onLoad(importSave(await file.text()));
      setFileMsg("Save loaded. Welcome back!");
    } catch (e) {
      setFileMsg((e as Error).message);
    }
  }
  const [muted, setMutedState] = useState(isMuted());
  const s = state.stats;

  return (
    <>
      <h2>{state.sim.avatar} {state.sim.name}</h2>
      <p className="lede">
        {traits[state.sim.trait].emoji} {traits[state.sim.trait].name}: {traits[state.sim.trait].desc}
      </p>

      <h3>Account</h3>
      <AccountPanel synced={synced} />

      <h3>Skills</h3>
      <div className="group">
        {(Object.keys(skillInfo) as SkillId[]).map(id => (
          <div key={id} className="skill" title={skillInfo[id].desc}>
            <span>{skillInfo[id].emoji} {skillInfo[id].name}</span>
            <Progress value={state.skills[id]} max={MAX_SKILL} />
            <b>{state.skills[id].toFixed(1)}</b>
          </div>
        ))}
      </div>
      <p className="note">Grow skills in the 📚 Learn & grow actions, at work, and through some events.</p>

      <h3>Mood: {mood(state)} / 100</h3>
      <div className="group">
        {(state.moodlets ?? []).length === 0 && <p className="note pad">No special moods right now. Eat, sleep, have fun and get paid to collect good ones.</p>}
        {(state.moodlets ?? []).map(x => {
          const info = moodlets[x.id];
          const hoursLeft = Math.max(1, Math.round((x.until - state.time) / 60));
          return (
            <div key={x.id} className="skill" title={info.desc}>
              <span>{info.emoji} {info.label}</span>
              <span className="note">{info.desc} {hoursLeft} h left</span>
              <b className={info.value < 0 ? "bad-text" : "good-text"}>{info.value > 0 ? "+" : ""}{info.value}</b>
            </div>
          );
        })}
      </div>
      <p className="note">
        Your mood is the average of your needs plus these moods.{" "}
        {moodPay(state) > 1 ? "😄 Good mood: your shifts pay 10% more right now." : moodPay(state) < 1 ? "😣 Bad mood: your shifts pay 10% less right now." : "Get it to 70 or more and shifts pay 10% more."}
      </p>

      <h3>Your story so far</h3>
      <div className="group stats">
        <div className="stat"><b>{dayOf(state.time)}</b><span>days in Lagos</span></div>
        <div className="stat"><b>{naira(s.earned)}</b><span>earned</span></div>
        <div className="stat"><b>{s.shifts}</b><span>shifts worked</span></div>
        <div className="stat"><b>{s.promotions}</b><span>promotions</span></div>
        <div className="stat"><b>{s.trips}</b><span>trips</span></div>
        <div className="stat"><b>{naira(s.sentHome)}</b><span>sent to family</span></div>
      </div>

      <h3>What happened</h3>
      <div className="group">
        <ul className="log">
          {state.log.slice(0, 15).map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      </div>

      <h3>Settings</h3>
      <div className="group">
        <button className="row" onClick={onGuide}>
          <span className="row-emoji" aria-hidden>❓</span>
          <span className="row-main"><span className="row-title">How to play</span><span className="note">The beginner guide: the screen, the tabs, missions and tags.</span></span>
        </button>
        <button
          className="row"
          aria-pressed={!muted}
          onClick={() => {
            setMuted(!muted);
            setMutedState(!muted);
          }}
        >
          <span className="row-emoji" aria-hidden>{muted ? "🔇" : "🔊"}</span>
          <span className="row-main"><span className="row-title">Sound effects</span></span>
          <span className="row-price">{muted ? "Off" : "On"}</span>
        </button>
        <button className="row" onClick={download}>
          <span className="row-emoji" aria-hidden>💾</span>
          <span className="row-main"><span className="row-title">Download a save file</span></span>
        </button>
        <label className="row">
          <span className="row-emoji" aria-hidden>📂</span>
          <span className="row-main"><span className="row-title">Load a save file</span></span>
          <input type="file" accept="application/json,.json" hidden onChange={e => void upload(e.target.files?.[0])} />
        </label>
      </div>
      {fileMsg && <p className="note" role="status">{fileMsg}</p>}
      <p className="note footer-links">
        <a href="/privacy.html">Privacy policy</a> · <a href="/terms.html">Terms of use</a>
      </p>

      <div className="confirm">
        {confirming ? (
          <>
            <p className="note bad">This deletes {state.sim.name}'s save for good.</p>
            <button className="btn" onClick={onRestart}>Yes, start a new life</button>{" "}
            <button className="btn plain" onClick={() => setConfirming(false)}>Keep playing</button>
          </>
        ) : (
          <button className="btn plain" onClick={() => setConfirming(true)}>Start a new life</button>
        )}
      </div>
    </>
  );
}
