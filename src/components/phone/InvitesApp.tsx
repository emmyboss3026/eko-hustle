import { useState } from "react";
import { dayOf, type Command, type GameState } from "../../engine/game";
import { naira } from "../../engine/economy";
import { phoneBlocker } from "../../engine/phone";
import { inviteById } from "../../data/invites";
import { contactById } from "../../data/contacts";
import { useLang } from "../../i18n/react";
import { duration, EffectChips } from "../ui";

type View = "open" | "past";

/** 💌 Invites: parties, business events, VIP nights and job chances. Accept, decline or let them expire. */
export default function InvitesApp({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t, tx } = useLang();
  const [view, setView] = useState<View>("open");
  const day = dayOf(state.time);
  const all = [...(state.invites ?? [])].reverse();
  const open = all.filter(i => i.status === "open" && i.until >= day);
  const past = all.filter(i => !(i.status === "open" && i.until >= day));
  const list = view === "open" ? open : past;

  return (
    <>
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={view === "open"} onClick={() => setView("open")}>{t("invites.open", { n: open.length })}</button>
        <button role="tab" aria-selected={view === "past"} onClick={() => setView("past")}>{t("invites.past")}</button>
      </div>
      {list.length === 0 && <p className="note pad">{t(view === "open" ? "invites.none" : "invites.noPast")}</p>}
      {list.map(inv => {
        const type = inviteById(inv.id);
        if (!type) return null;
        const from = type.from ? contactById(type.from) : null;
        const problem = phoneBlocker(state, { type: "invite", uid: inv.uid, accept: true });
        const status = inv.status === "open" && inv.until < day ? "expired" : inv.status;
        return (
          <article key={inv.uid} className={`invite-card kind-${type.kind}`}>
            <div className="invite-top">
              <span className="invite-emoji" aria-hidden>{type.emoji}</span>
              <div>
                <b>{t(`invite.${type.id}.name`)}</b>
                <small>
                  {from ? t("invites.from", { name: `${from.emoji} ${t(`contact.${from.id}.name`)}` }) : t("invites.fromClub")}
                  {" · "}{t(`invites.kind.${type.kind}`)}
                </small>
              </div>
            </div>
            <p>{t(`invite.${type.id}.desc`)}</p>
            <div className="invite-meta">
              <span>🕒 {duration(type.minutes)}</span>
              <span>{type.cost ? `💸 ${naira(type.cost)}` : `💸 ${t("ui.free")}`}</span>
              <span>⭐ +{type.rep} {t("invites.rep")}</span>
              {type.pay && <span className="good-text">💰 +{naira(type.pay)}</span>}
              {type.skill && <span>📈 {Object.keys(type.skill).map(k => tx.skill(k as never)).join(", ")}</span>}
            </div>
            <EffectChips effect={type.effect} />
            {status === "open" ? (
              <>
                <small className="note">{t(inv.until === day ? "invites.lastDay" : "invites.until", { day: inv.until })}</small>
                <div className="btn-row">
                  <button className="btn" disabled={!!problem} onClick={() => dispatch({ type: "invite", uid: inv.uid, accept: true })}>✅ {t("invites.accept")}</button>
                  <button className="btn plain" onClick={() => dispatch({ type: "invite", uid: inv.uid, accept: false })}>{t("invites.decline")}</button>
                </div>
                {problem && <p className="note bad">{t(problem)}</p>}
              </>
            ) : (
              <span className={`invite-status st-${status}`}>{t(`invites.status.${status}`)}</span>
            )}
          </article>
        );
      })}
    </>
  );
}
