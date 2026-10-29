import { useEffect, useState } from "react";
import { getPrefs, onPrefs, play, setPrefs, type MusicChoice } from "../lib/audio";
import { TRACKS } from "../lib/music";
import { useLang } from "../i18n/react";

/** 👤 Me → Sound: effects, background sounds, music (or none) and volume. */
export default function SoundSettings() {
  const { t } = useLang();
  const [p, setP] = useState(getPrefs);
  useEffect(() => {
    const off = onPrefs(setP);
    return () => { off(); };
  }, []);

  const choices: { id: MusicChoice; emoji: string }[] = [
    { id: "off", emoji: "🔇" },
    { id: "auto", emoji: "🌍" },
    ...TRACKS.map(tr => ({ id: tr.id as MusicChoice, emoji: tr.emoji })),
  ];

  return (
    <>
      <h3>🔊 {t("sound.title")}</h3>
      <div className="group">
        <button className="row" aria-pressed={p.sfx} onClick={() => { setPrefs({ sfx: !p.sfx }); if (!p.sfx) setTimeout(() => play("pop"), 50); }}>
          <span className="row-emoji" aria-hidden>{p.sfx ? "🔊" : "🔇"}</span>
          <span className="row-main"><span className="row-title">{t("sound.sfx")}</span><span className="note">{t("sound.sfxInfo")}</span></span>
          <span className="row-price">{p.sfx ? t("me.on") : t("me.off")}</span>
        </button>
        <button className="row" aria-pressed={p.ambience} onClick={() => setPrefs({ ambience: !p.ambience })}>
          <span className="row-emoji" aria-hidden>🌆</span>
          <span className="row-main"><span className="row-title">{t("sound.ambience")}</span><span className="note">{t("sound.ambienceInfo")}</span></span>
          <span className="row-price">{p.ambience ? t("me.on") : t("me.off")}</span>
        </button>
        <div className="row sound-music">
          <span className="row-emoji" aria-hidden>🎵</span>
          <span className="row-main">
            <span className="row-title">{t("sound.music")}</span>
            <span className="note">{t("sound.musicInfo")}</span>
            <span className="music-choices" role="radiogroup" aria-label={t("sound.music")}>
              {choices.map(c => (
                <button key={c.id} role="radio" aria-checked={p.music === c.id} className="chip-btn" onClick={() => setPrefs({ music: c.id })}>
                  {c.emoji} {c.id === "off" ? t("sound.off") : c.id === "auto" ? t("sound.auto") : t(`music.${c.id}`)}
                </button>
              ))}
            </span>
          </span>
        </div>
        <label className="row sound-volume">
          <span className="row-emoji" aria-hidden>🎚️</span>
          <span className="row-main">
            <span className="row-title">{t("sound.volume")}</span>
            <input type="range" min={0} max={100} step={5} value={Math.round(p.volume * 100)} onChange={e => setPrefs({ volume: Number(e.target.value) / 100 })} aria-label={t("sound.volume")} />
          </span>
          <span className="row-price">{Math.round(p.volume * 100)}%</span>
        </label>
      </div>
    </>
  );
}
