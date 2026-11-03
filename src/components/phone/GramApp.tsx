import { useState } from "react";
import type { Command, GameState } from "../../engine/game";
import { GRAM_MILESTONES, gramGain, gramPostedToday } from "../../engine/apps";
import { naira } from "../../engine/economy";
import { useLang } from "../../i18n/react";

const CAPTIONS = ["📸", "🍛", "😎"];

/** Gram: post once a day to gain followers. Reputation and a good mood help. Followers bring sponsor deals. */
export default function GramApp({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t } = useLang();
  const [caption, setCaption] = useState(0);
  const g = state.gram ?? { followers: 0, posts: 0, lastPost: -1, paid: [] };
  const posted = gramPostedToday(state);
  const next = GRAM_MILESTONES.find(m => !g.paid.includes(m.followers));
  return (
    <>
      <div className="gram-head">
        <b className="gram-count">{g.followers}</b>
        <span>{t("gram.followers")}</span>
        <span className="note">{t("gram.posts", { n: g.posts })}</span>
      </div>
      <h3>{t("gram.new")}</h3>
      <div className="swatch-row" role="radiogroup" aria-label={t("gram.new")}>
        {CAPTIONS.map((c, i) => (
          <button key={c} role="radio" aria-checked={caption === i} className="gram-pick" onClick={() => setCaption(i)}>{c} {t(`gram.cap${i}`)}</button>
        ))}
      </div>
      <button className="btn block" disabled={posted} onClick={() => dispatch({ type: "gramPost", caption })}>
        {posted ? t("gram.done") : t("gram.post", { n: gramGain(state) + (caption === 0 ? 1 : 0) })}
      </button>
      {next && <p className="note">{t("gram.next", { followers: next.followers, prize: naira(next.prize) })}</p>}
    </>
  );
}
