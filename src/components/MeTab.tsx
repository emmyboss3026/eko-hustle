import { useState } from "react";
import { dayOf, mood, moodPay, type GameState } from "../engine/game";
import { moodlets } from "../data/moodlets";
import { skillInfo, MAX_SKILL, type SkillId } from "../data/skills";
import { traits } from "../data/traits";
import { naira } from "../engine/economy";
import { Progress } from "./ui";
import AccountPanel from "./AccountPanel";
import LangPicker from "./LangPicker";
import SoundSettings from "./SoundSettings";
import { exportSave, importSave } from "../engine/save";
import { useLang } from "../i18n/react";
import { RELAXED_SURVIVAL, isRelaxed } from "../data/survival";

type Props = {
  state: GameState;
  onRestart: () => void;
  onLoad: (s: GameState) => void;
  onGuide: () => void;
  onDiary: () => void;
  onFeedback: () => void;
  onRelaxed: (on: boolean) => void;
  synced: "off" | "syncing" | "saved" | "error";
};

export default function MeTab({ state, onRestart, onLoad, onGuide, onDiary, onFeedback, onRelaxed, synced }: Props) {
  const { t, tx } = useLang();
  const [confirming, setConfirming] = useState(false);
  const [fileMsg, setFileMsg] = useState<string | null>(null);
  const s = state.stats;
  const tr = tx.trait(state.sim.trait);

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
    setFileMsg("me.saved");
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      onLoad(importSave(await file.text()));
      setFileMsg("me.loaded");
    } catch (e) {
      setFileMsg((e as Error).message);
    }
  }

  return (
    <>
      <h2>{state.sim.avatar} {state.sim.name}</h2>
      <p className="lede">{traits[state.sim.trait].emoji} {tr.name}: {tr.desc}</p>
      {state.sim.preset && tx.presetStory(state.sim.preset) && <p className="note">“{tx.presetStory(state.sim.preset)}”</p>}

      <h3>🌍 {t("me.language")}</h3>
      <LangPicker />

      <SoundSettings />

      <h3>{t("me.skills")}</h3>
      <div className="group">
        {(Object.keys(skillInfo) as SkillId[]).map(id => (
          <div key={id} className="skill" title={tx.skillDesc(id)}>
            <span>{skillInfo[id].emoji} {tx.skill(id)}</span>
            <Progress value={state.skills[id]} max={MAX_SKILL} />
            <b>{state.skills[id].toFixed(1)}</b>
          </div>
        ))}
      </div>
      <p className="note">{t("me.skillsHow")}</p>

      <h3>{t("me.mood", { mood: mood(state) })}</h3>
      <div className="group">
        {(state.moodlets ?? []).length === 0 && <p className="note pad">{t("me.noMoods")}</p>}
        {(state.moodlets ?? []).map(x => {
          const info = moodlets[x.id];
          const mt = tx.mood(x.id);
          const hoursLeft = Math.max(1, Math.round((x.until - state.time) / 60));
          return (
            <div key={x.id} className="skill" title={mt.desc}>
              <span>{info.emoji} {mt.label}</span>
              <span className="note">{mt.desc} {t("me.hoursLeft", { h: hoursLeft })}</span>
              <b className={info.value < 0 ? "bad-text" : "good-text"}>{info.value > 0 ? "+" : ""}{info.value}</b>
            </div>
          );
        })}
      </div>
      <p className="note">
        {t("me.moodHow")}{" "}
        {moodPay(state) > 1 ? t("me.moodGood") : moodPay(state) < 1 ? t("me.moodBad") : t("me.moodAim")}
      </p>

      <h3>{t("me.story")}</h3>
      <div className="group stats">
        <div className="stat"><b>{dayOf(state.time)}</b><span>{t("me.days")}</span></div>
        <div className="stat"><b>{naira(s.earned)}</b><span>{t("me.earned")}</span></div>
        <div className="stat"><b>{s.shifts}</b><span>{t("me.shifts")}</span></div>
        <div className="stat"><b>{s.promotions}</b><span>{t("me.promotions")}</span></div>
        <div className="stat"><b>{s.trips}</b><span>{t("me.trips")}</span></div>
        <div className="stat"><b>{naira(s.sentHome)}</b><span>{t("me.sentHome")}</span></div>
      </div>
      <button className="btn block" onClick={onDiary}>📖 {t("me.openDiary")}</button>

      <h3>{t("me.account")}</h3>
      <AccountPanel synced={synced} />

      <h3>{t("me.settings")}</h3>
      <div className="group">
        <button className="row" onClick={onGuide}>
          <span className="row-emoji" aria-hidden>❓</span>
          <span className="row-main"><span className="row-title">{t("me.howToPlay")}</span><span className="note">{t("me.howToPlayInfo")}</span></span>
        </button>
        <button className="row" onClick={onFeedback}>
          <span className="row-emoji" aria-hidden>💬</span>
          <span className="row-main"><span className="row-title">{t("me.feedback")}</span><span className="note">{t("me.feedbackInfo")}</span></span>
        </button>
        {RELAXED_SURVIVAL && (
          <button className="row" aria-pressed={isRelaxed(state)} onClick={() => onRelaxed(!isRelaxed(state))}>
            <span className="row-emoji" aria-hidden>{isRelaxed(state) ? "🛟" : "💀"}</span>
            <span className="row-main">
              <span className="row-title">{t("me.survival")}</span>
              <span className="note">{t(isRelaxed(state) ? "me.survivalRelaxedInfo" : "me.survivalClassicInfo")}</span>
            </span>
            <span className="row-price">{t(isRelaxed(state) ? "me.survivalRelaxed" : "me.survivalClassic")}</span>
          </button>
        )}
        <button className="row" onClick={download}>
          <span className="row-emoji" aria-hidden>💾</span>
          <span className="row-main"><span className="row-title">{t("me.download")}</span></span>
        </button>
        <label className="row">
          <span className="row-emoji" aria-hidden>📂</span>
          <span className="row-main"><span className="row-title">{t("me.upload")}</span></span>
          <input type="file" accept="application/json,.json" hidden onChange={e => void upload(e.target.files?.[0])} />
        </label>
      </div>
      {fileMsg && <p className="note" role="status">{t(fileMsg)}</p>}
      <p className="note footer-links">
        <a href="/privacy.html">{t("me.privacy")}</a> · <a href="/terms.html">{t("me.terms")}</a>
      </p>

      <div className="confirm">
        {confirming ? (
          <>
            <p className="note bad">{t("me.deleteWarn", { name: state.sim.name })}</p>
            <button className="btn" onClick={onRestart}>{t("me.yesNew")}</button>{" "}
            <button className="btn plain" onClick={() => setConfirming(false)}>{t("me.keep")}</button>
          </>
        ) : (
          <button className="btn plain" onClick={() => setConfirming(true)}>{t("me.newLife")}</button>
        )}
      </div>
    </>
  );
}
