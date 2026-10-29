import { useState } from "react";
import { useLang } from "../i18n/react";

// Simple how-tos, written as taps on this screen. The words are in the translation files ("help.<id>.*").
const howTos = [
  { id: "phone", emoji: "📱", steps: 3 },
  { id: "eat", emoji: "🍲", steps: 3 },
  { id: "sleep", emoji: "😴", steps: 3 },
  { id: "toilet", emoji: "🚽", steps: 2 },
  { id: "money", emoji: "💰", steps: 3 },
  { id: "jobs", emoji: "💼", steps: 4 },
  { id: "around", emoji: "🚌", steps: 3 },
  { id: "furniture", emoji: "🛒", steps: 3 },
  { id: "rent", emoji: "🏠", steps: 3 },
  { id: "nepa", emoji: "🕯️", steps: 3 },
  { id: "skills", emoji: "📈", steps: 2 },
  { id: "win", emoji: "✈️", steps: 3 },
  { id: "tags", emoji: "🏷️", steps: 2 },
  { id: "fastfood", emoji: "🍔", steps: 3 },
  { id: "diary", emoji: "📖", steps: 2 },
  { id: "language", emoji: "🌍", steps: 2 },
  { id: "rewards", emoji: "🎁", steps: 2 },
  { id: "board", emoji: "🏆", steps: 2 },
  { id: "camera", emoji: "🎥", steps: 2 },
  { id: "sound", emoji: "🔊", steps: 2 },
  { id: "revive", emoji: "🚑", steps: 2 },
  { id: "privacy", emoji: "🔒", steps: 1 },
  { id: "feedback", emoji: "💬", steps: 3 },
];

const dayPlan = ["morning", "day", "evening", "night"];

/** The help panel: simple how-tos, a daily plan, and the full guide. */
export default function HelpSheet({ onGuide }: { onGuide: () => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <p className="lede">{t("help.lede")}</p>
      <div className="group faq">
        {howTos.map((h, i) => (
          <div key={h.id} className="faq-item">
            <button className="row" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span className="row-emoji" aria-hidden>{h.emoji}</span>
              <span className="row-main"><span className="row-title">{t(`help.${h.id}.q`)}</span></span>
              <span aria-hidden>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <ol className="how faq-steps">
                {Array.from({ length: h.steps }, (_, k) => <li key={k}>{t(`help.${h.id}.${k}`)}</li>)}
              </ol>
            )}
          </div>
        ))}
      </div>

      <h3>📅 {t("help.plan")}</h3>
      <div className="group">
        {dayPlan.map(p => (
          <div key={p} className="plan-row"><b>{t(`plan.${p}`)}</b><span>{t(`plan.${p}.do`)}</span></div>
        ))}
      </div>

      <button className="btn block" onClick={onGuide}>{t("help.guide")}</button>
    </>
  );
}
