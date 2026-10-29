import { useEffect, useState } from "react";
import { clockOf, dayOf, type Command, type GameState } from "../../engine/game";
import type { PhoneMsg } from "../../engine/phone";
import { contactById } from "../../data/contacts";
import { useLang } from "../../i18n/react";
import type { AppId } from "./Phone";

type From = PhoneMsg["from"];

const SENDER: Record<string, { emoji: string; key: string }> = {
  bank: { emoji: "🏦", key: "msgs.bank" },
  biz: { emoji: "🏪", key: "msgs.biz" },
  club: { emoji: "🍾", key: "msgs.club" },
};

/** Where a message's "open the app" link goes. */
const LINK: Record<string, AppId> = {
  "msg.invite": "invites", "msg.biz.profit": "business", "msg.biz.loss": "business", "msg.tunde.invest": "invest",
  "msg.funke.business": "business", "msg.bank.daily": "rewards", "msg.bank.welcome": "bank", "msg.landlord.rent": "bank",
};

export function senderName(t: (k: string) => string, from: From) {
  const c = contactById(from);
  return c ? { emoji: c.emoji, name: t(`contact.${c.id}.name`) } : { emoji: SENDER[from]?.emoji ?? "📱", name: t(SENDER[from]?.key ?? "msgs.system") };
}

/** 💬 Messages: notes from the people in your life and from the game (story, invitations, reports).
 *  Replies are chosen from ready-made answers, so there is nothing to moderate. */
export default function MessagesApp({ state, dispatch, onApp }: { state: GameState; dispatch: (c: Command) => void; onApp: (a: AppId) => void }) {
  const { t } = useLang();
  const [thread, setThread] = useState<From | null>(null);
  const msgs = state.messages ?? [];

  // Text with values that may themselves be text keys (e.g. an invitation's name)
  const render = (m: PhoneMsg) => {
    const vars: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(m.vars ?? {})) vars[k] = typeof v === "string" && /^[a-z]+\.[\w.]+$/.test(v) ? t(v) : v;
    return t(m.key, vars);
  };

  // Opening a thread marks it read
  const unreadHere = thread ? msgs.some(m => m.from === thread && !m.read) : false;
  useEffect(() => {
    if (thread && unreadHere) dispatch({ type: "readMsgs", from: thread });
  }, [thread, unreadHere, dispatch]);

  if (thread) {
    const list = msgs.filter(m => m.from === thread);
    const who = senderName(t, thread);
    return (
      <>
        <button className="btn plain" onClick={() => setThread(null)}>‹ {t("msgs.all")}</button>
        <h3 className="thread-title">{who.emoji} {who.name}</h3>
        <div className="chat">
          {list.map(m => (
            <div key={m.uid} className="chat-item">
              <div className="bubble them">
                <p>{render(m)}</p>
                <small>{t("hud.day", { day: dayOf(m.t) })} · {clockOf(m.t)}</small>
                {LINK[m.key] && <button className="chip-btn" onClick={() => onApp(LINK[m.key])}>{t(`msgs.open.${LINK[m.key]}`)} ›</button>}
              </div>
              {m.replied !== undefined && m.replies && <div className="bubble me"><p>{t(m.replies[m.replied])}</p></div>}
              {m.replied === undefined && m.replies && (
                <div className="quick-replies">
                  {m.replies.map((r, i) => (
                    <button key={r} className="chip-btn" onClick={() => dispatch({ type: "reply", uid: m.uid, choice: i })}>{t(r)}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="note">{t("msgs.noFree")}</p>
      </>
    );
  }

  // Threads, newest first
  const threads = new Map<From, PhoneMsg[]>();
  for (const m of msgs) threads.set(m.from, [...(threads.get(m.from) ?? []), m]);
  const order = [...threads.entries()].sort((a, b) => b[1][b[1].length - 1].uid - a[1][a[1].length - 1].uid);

  return (
    <>
      {order.length === 0 && <p className="note pad">{t("msgs.empty")}</p>}
      <div className="group">
        {order.map(([from, list]) => {
          const last = list[list.length - 1];
          const unread = list.filter(m => !m.read).length;
          const who = senderName(t, from);
          return (
            <button key={from} className={`row thread ${unread ? "unread" : ""}`} onClick={() => setThread(from)}>
              <span className="contact-face" aria-hidden>{who.emoji}</span>
              <span className="row-main">
                <span className="row-title">{who.name}</span>
                <span className="note thread-last">{render(last)}</span>
              </span>
              <span className="thread-side">
                <small>{t("hud.day", { day: dayOf(last.t) })}</small>
                {unread > 0 && <b className="phone-badge inline">{unread}</b>}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
