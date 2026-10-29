import { lazy, Suspense, useState } from "react";
import { avatars, supporterAvatars, traits, type Sim, type TraitId } from "../data/traits";
import { bottomColors, hairColors, hairStyles, outfitColors, presets, skinTones, type Look } from "../data/characters";
import { useAccount } from "../lib/account";
import PaymentNotice from "../components/PaymentNotice";
import LangPicker from "../components/LangPicker";
import { naira, RENT, START_MONEY } from "../engine/economy";
import { loadLives } from "../lib/lives";
import { useLang, Rich } from "../i18n/react";

// The 3D preview loads in the background so the first screen opens fast.
const CharacterPreview = lazy(() => import("../components/CharacterPreview"));

function Swatches({ label, colors, value, onPick }: { label: string; colors: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="swatch-row" role="radiogroup" aria-label={label}>
      <span>{label}</span>
      {colors.map(c => (
        <button key={c} role="radio" aria-checked={value === c} aria-label={c} style={{ background: c }} onClick={() => onPick(c)} />
      ))}
    </div>
  );
}

export default function CreateSim({ onDone }: { onDone: (sim: Sim) => void }) {
  const { t, tx } = useLang();
  const { profile } = useAccount();
  const [presetId, setPresetId] = useState(presets[0].id);
  const preset = presets.find(p => p.id === presetId) ?? presets[0];
  const [name, setName] = useState(preset.name);
  const [look, setLook] = useState<Look>(preset.look);
  const [trait, setTrait] = useState<TraitId>(preset.trait);
  const [avatar, setAvatar] = useState(preset.avatar);
  const [custom, setCustom] = useState(false);
  const ready = name.trim().length > 0;
  const lives = loadLives();
  const emojiLooks = profile?.supporter ? [...avatars, ...supporterAvatars] : avatars;

  function pick(id: string) {
    const p = presets.find(x => x.id === id);
    if (!p) return;
    setPresetId(p.id);
    setName(p.name);
    setLook(p.look);
    setTrait(p.trait);
    setAvatar(p.avatar);
  }
  const change = (part: Partial<Look>) => setLook(l => ({ ...l, ...part }));

  return (
    <main className="app create">
      <header className="create-hero">
        <h1>Eko Hustle</h1>
        <LangPicker big />
        <p><Rich text={t("create.intro", { money: naira(START_MONEY), rent: naira(RENT) })} /></p>
      </header>

      <PaymentNotice />
      <div className="create-body">
        <h3>{t("create.pick")}</h3>
        <div className="presets">
          {presets.map(p => (
            <button key={p.id} className="preset" aria-pressed={presetId === p.id} onClick={() => pick(p.id)}>
              <span className="preset-face" aria-hidden>{p.avatar}</span>
              <b>{p.name}</b>
              <small>{tx.presetFrom(p.id)}</small>
              <small className="preset-trait">{traits[p.trait].emoji} {tx.trait(p.trait).name}</small>
            </button>
          ))}
        </div>

        <div className="char-card">
          <Suspense fallback={<div className="char-preview" />}>
            <CharacterPreview look={look} />
          </Suspense>
          <div className="char-info">
            <b>{avatar} {name || preset.name}</b>
            <span className="note">{tx.presetFrom(preset.id)}</span>
            <p>“{tx.presetStory(preset.id)}”</p>
            <button className="btn plain" aria-expanded={custom} onClick={() => setCustom(c => !c)}>
              🎨 {custom ? t("create.doneCustom") : t("create.customise")}
            </button>
          </div>
        </div>

        {custom && (
          <section className="customise">
            <Swatches label={t("create.skin")} colors={skinTones} value={look.skin} onPick={c => change({ skin: c })} />
            <div className="swatch-row" role="radiogroup" aria-label={t("create.hair")}>
              <span>{t("create.hair")}</span>
              {hairStyles.map(h => (
                <button key={h.id} role="radio" className="hair" aria-checked={look.hair === h.id} aria-label={t(`hair.${h.id}`)} title={t(`hair.${h.id}`)} onClick={() => change({ hair: h.id })}>
                  {h.emoji}
                </button>
              ))}
            </div>
            <Swatches label={t("create.hairColor")} colors={hairColors} value={look.hairColor} onPick={c => change({ hairColor: c })} />
            <Swatches label={t("create.top")} colors={outfitColors} value={look.outfit} onPick={c => change({ outfit: c })} />
            <Swatches label={t("create.bottom")} colors={bottomColors} value={look.bottom} onPick={c => change({ bottom: c })} />
            <div className="swatch-row" role="radiogroup" aria-label={t("create.clothes")}>
              <span>{t("create.clothes")}</span>
              <button role="radio" className="text-choice" aria-checked={look.build === "m"} onClick={() => change({ build: "m" })}>👖 {t("create.trousers")}</button>
              <button role="radio" className="text-choice" aria-checked={look.build === "f"} onClick={() => change({ build: "f" })}>👗 {t("create.wrapper")}</button>
            </div>
            <div className="avatars" role="radiogroup" aria-label={t("create.face")}>
              {emojiLooks.map(a => (
                <button key={a} type="button" role="radio" aria-checked={avatar === a} aria-label={a} onClick={() => setAvatar(a)}>{a}</button>
              ))}
            </div>
            {profile?.supporter && <p className="note">{t("create.supporter")}</p>}
          </section>
        )}

        <label className="field">
          {t("create.name")}
          <input value={name} onChange={e => setName(e.target.value)} maxLength={20} />
        </label>

        <h3>{t("create.trait")}</h3>
        {(Object.keys(traits) as TraitId[]).map(id => (
          <button key={id} type="button" className="trait" aria-pressed={trait === id} onClick={() => setTrait(id)}>
            <span className="row-emoji">{traits[id].emoji}</span>
            <span>
              <b>{tx.trait(id).name}</b>
              <br />
              <span className="note">{tx.trait(id).desc}</span>
            </span>
          </button>
        ))}

        <button
          className="btn block"
          disabled={!ready}
          onClick={() => onDone({ name: name.trim(), avatar, trait, look, preset: preset.id })}
        >
          {ready ? t("create.start", { name: name.trim() }) : t("create.typeName")}
        </button>

        {lives.length > 0 && (
          <>
            <h3>👻 {t("lives.title")}</h3>
            <div className="group">
              {lives.slice(0, 5).map(l => (
                <div key={l.id} className="plan-row">
                  <b>{l.avatar} {l.name}</b>
                  <span>{t(`ending.${l.ending}.short`)} · {t("diary.day", { day: l.day })} · {t("lives.earned", { money: naira(l.earned) })}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="note footer-links">
          <a href="/privacy.html">{t("me.privacy")}</a> · <a href="/terms.html">{t("me.terms")}</a>
        </p>
      </div>
    </main>
  );
}
