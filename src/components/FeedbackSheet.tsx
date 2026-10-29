import { useState } from "react";
import { dayOf, type GameState } from "../engine/game";
import { sendFeedback, type FeedbackCategory } from "../lib/cloud";
import { useLang } from "../i18n/react";

const cats: { id: FeedbackCategory; emoji: string }[] = [
  { id: "bug", emoji: "🐞" },
  { id: "idea", emoji: "💡" },
  { id: "confusing", emoji: "😕" },
  { id: "like", emoji: "❤️" },
];

/** The feedback box: what's broken, confusing, or great. */
export default function FeedbackSheet({ state }: { state: GameState }) {
  const { t, lang } = useLang();
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "queued">("idle");

  if (status === "sent" || status === "queued") {
    return (
      <div className="feedback-done">
        <div className="sheet-emoji" aria-hidden>🙏🏾</div>
        <h3>{t("feedback.thanks")}</h3>
        <p className="note">{t(status === "sent" ? "feedback.sent" : "feedback.queued")}</p>
        <button className="btn" onClick={() => { setMessage(""); setRating(null); setStatus("idle"); }}>{t("feedback.another")}</button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        if (!message.trim()) return;
        setStatus("sending");
        setStatus(await sendFeedback({ category, rating, message: message.trim(), lang, gameDay: dayOf(state.time) }));
      }}
    >
      <p className="lede">{t("feedback.lede")}</p>
      <div className="feedback-cats" role="radiogroup" aria-label={t("feedback.kind")}>
        {cats.map(c => (
          <button type="button" key={c.id} role="radio" aria-checked={category === c.id} onClick={() => setCategory(c.id)}>
            <span aria-hidden>{c.emoji}</span> {t(`feedback.${c.id}`)}
          </button>
        ))}
      </div>
      <div className="feedback-stars" role="radiogroup" aria-label={t("feedback.rate")}>
        <span>{t("feedback.rate")}</span>
        {[1, 2, 3, 4, 5].map(n => (
          <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n}/5`} onClick={() => setRating(rating === n ? null : n)}>
            {rating !== null && n <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <label className="field">
        {t("feedback.message")}
        <textarea
          value={message}
          maxLength={1000}
          rows={5}
          onChange={e => setMessage(e.target.value)}
          placeholder={t(`feedback.hint.${category}`)}
          required
        />
      </label>
      <div className="note">{message.length}/1000 · {t("feedback.private")}</div>
      <button className="btn block" disabled={!message.trim() || status === "sending"}>
        {status === "sending" ? t("feedback.sending") : t("feedback.send")}
      </button>
    </form>
  );
}
