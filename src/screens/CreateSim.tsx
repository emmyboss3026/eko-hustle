import { lazy, Suspense, useState } from "react";
import LegalLinks from "../components/LegalLinks";
import { avatars, supporterAvatars, traits, type Sim, type TraitId } from "../data/traits";
import { accessories, bottomColors, fits, hairColors, hairStyles, outfitColors, presets, shoeColors, skinTones, type AccId, type Look } from "../data/characters";
import { useAccount } from "../lib/account";
import PaymentNotice from "../components/PaymentNotice";
import LangPicker from "../components/LangPicker";
import { naira, RENT, START_MONEY } from "../engine/economy";
import { loadLives } from "../lib/lives";
import { useLang, Rich } from "../i18n/react";
import { CITIZEN_COUNT_PLAIN, CITIZEN_CLIPS, CITIZEN_OUTFITS, CITIZEN_STATURES, citizenLook } from "../data/citizens";

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

  const TABS = ["style", "citizen", "face", "hair", "outfit", "acc", "body"] as const;
  const [clip, setClip] = useState<string>("Idle");
  const [tab, setTab] = useState<(typeof TABS)[number]>("style");
  const TAB_EMOJI = { style: "✨", citizen: "👥", face: "🙂", hair: "💇🏾", outfit: "👕", acc: "🕶️", body: "🧍🏾" };
  const toggleAcc = (id: AccId) => setLook(l => ({ ...l, acc: l.acc?.includes(id) ? l.acc.filter(x => x !== id) : [...(l.acc ?? []), id] }));

  return (
    <main className="app create nv-create">
      <header className="create-hero nv-hero">
        <h1>Eko Hustle</h1>
        <span className="nv-tag">{t("create.tagline")}</span>
        <LangPicker big />
        <p><Rich text={t("create.intro", { money: naira(START_MONEY), rent: naira(RENT) })} /></p>
      </header>

      <PaymentNotice />
      <div className="create-body">
        <section className="nv-stage">
          <div className="nv-viewer">
            <Suspense fallback={<div className="char-preview" />}>
              <CharacterPreview look={look} clip={look.model === "citizen" ? clip : null} />
            </Suspense>
            <div className="nv-viewer-info">
              <b>{avatar} {name || preset.name}</b>
              <span>{tx.presetFrom(preset.id)}</span>
            </div>
          </div>
          <div className="nv-customise">
            <div className="nv-tabs" role="tablist" aria-label={t("create.customise")}>
              {TABS.map(k => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                  <span aria-hidden>{TAB_EMOJI[k]}</span>
                  <small>{t(`create.tab.${k}`)}</small>
                </button>
              ))}
            </div>
            <div className="nv-panel" role="tabpanel">
              {tab === "style" && (
                <>
                  <p className="note">{t("create.pick")}</p>
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
                  <p className="nv-story">“{tx.presetStory(preset.id)}”</p>
                </>
              )}
              {tab === "citizen" && (
                <>
                  <div className="swatch-row" role="radiogroup" aria-label={t("citizen.model")}>
                    <span>{t("citizen.model")}</span>
                    <button role="radio" className="text-choice" aria-checked={look.model !== "citizen"} onClick={() => change({ model: "classic" })}>🧸 {t("citizen.classic")}</button>
                    <button role="radio" className="text-choice" aria-checked={look.model === "citizen"} onClick={() => change({ model: "citizen", cz: look.cz ?? "1" })}>🧍🏾 {t("citizen.skinned")}</button>
                  </div>
                  <p className="note">{look.model === "citizen" ? t("citizen.hint") : t("citizen.classicHint")}</p>
                  {look.model === "citizen" && (
                    <>
                      <div className="citizen-grid" role="radiogroup" aria-label={t("citizen.pick")}>
                        {Array.from({ length: CITIZEN_COUNT_PLAIN }, (_, i) => i + 1).map(n => {
                          const c = citizenLook(n);
                          return (
                            <button key={n} role="radio" aria-checked={look.cz === String(n)} aria-label={t("citizen.number", { n })} className="citizen-card" onClick={() => change(c)}>
                              <i style={{ background: c.skin }} /><i style={{ background: c.outfit }} /><i style={{ background: c.bottom }} />
                              <small>{n}</small>
                            </button>
                          );
                        })}
                      </div>
                      <div className="swatch-row" role="radiogroup" aria-label={t("citizen.style")}>
                        <span>{t("citizen.style")}</span>
                        {CITIZEN_OUTFITS.map(o => (
                          <button key={o} role="radio" className="text-choice" aria-checked={(look.style ?? "tee") === o} onClick={() => change({ style: o })}>{t(`citizen.outfit.${o}`)}</button>
                        ))}
                      </div>
                      <div className="swatch-row" role="radiogroup" aria-label={t("citizen.stature")}>
                        <span>{t("citizen.stature")}</span>
                        {CITIZEN_STATURES.map(s => (
                          <button key={s} role="radio" className="text-choice" aria-checked={(look.stature ?? "average") === s} onClick={() => change({ stature: s })}>{t(`citizen.stature.${s}`)}</button>
                        ))}
                      </div>
                      <div className="swatch-row" role="radiogroup" aria-label={t("citizen.move")}>
                        <span>{t("citizen.move")}</span>
                        {CITIZEN_CLIPS.map(c => (
                          <button key={c} role="radio" className="text-choice" aria-checked={clip === c} onClick={() => setClip(c)}>{t(`citizen.clip.${c}`)}</button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
              {tab === "face" && (
                <>
                  <Swatches label={t("create.skin")} colors={skinTones} value={look.skin} onPick={c => change({ skin: c })} />
                  <div className="avatars" role="radiogroup" aria-label={t("create.face")}>
                    {emojiLooks.map(a => (
                      <button key={a} type="button" role="radio" aria-checked={avatar === a} aria-label={a} onClick={() => setAvatar(a)}>{a}</button>
                    ))}
                  </div>
                  {profile?.supporter && <p className="note">{t("create.supporter")}</p>}
                </>
              )}
              {tab === "hair" && (
                <>
                  <div className="swatch-row" role="radiogroup" aria-label={t("create.hair")}>
                    <span>{t("create.hair")}</span>
                    {hairStyles.map(h => (
                      <button key={h.id} role="radio" className="hair" aria-checked={look.hair === h.id} aria-label={t(`hair.${h.id}`)} title={t(`hair.${h.id}`)} onClick={() => change({ hair: h.id })}>
                        {h.emoji}
                      </button>
                    ))}
                  </div>
                  <Swatches label={t("create.hairColor")} colors={hairColors} value={look.hairColor} onPick={c => change({ hairColor: c })} />
                </>
              )}
              {tab === "outfit" && (
                <>
                  <Swatches label={t("create.top")} colors={outfitColors} value={look.outfit} onPick={c => change({ outfit: c })} />
                  <Swatches label={t("create.bottom")} colors={bottomColors} value={look.bottom} onPick={c => change({ bottom: c })} />
                  <Swatches label={t("create.shoes")} colors={shoeColors} value={look.shoes ?? shoeColors[0]} onPick={c => change({ shoes: c })} />
                  <div className="swatch-row" role="radiogroup" aria-label={t("create.clothes")}>
                    <span>{t("create.clothes")}</span>
                    <button role="radio" className="text-choice" aria-checked={look.build === "m"} onClick={() => change({ build: "m" })}>👖 {t("create.trousers")}</button>
                    <button role="radio" className="text-choice" aria-checked={look.build === "f"} onClick={() => change({ build: "f" })}>👗 {t("create.wrapper")}</button>
                  </div>
                </>
              )}
              {tab === "acc" && (
                <div className="swatch-row" role="group" aria-label={t("create.tab.acc")}>
                  {accessories.map(a => (
                    <button key={a.id} className="text-choice" aria-pressed={!!look.acc?.includes(a.id)} onClick={() => toggleAcc(a.id)}>
                      {a.emoji} {t(`acc.${a.id}`)}
                    </button>
                  ))}
                </div>
              )}
              {tab === "body" && (
                <div className="swatch-row" role="radiogroup" aria-label={t("create.tab.body")}>
                  {fits.map(f => (
                    <button key={f} role="radio" className="text-choice" aria-checked={(look.fit ?? "regular") === f} onClick={() => change({ fit: f })}>
                      {t(`fit.${f}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

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
      <LegalLinks />
      </div>
    </main>
  );
}
