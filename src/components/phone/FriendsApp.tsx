import { useCallback, useEffect, useState } from "react";
import { useLang } from "../../i18n/react";
import {
  blockPlayer, dmThread, dmUnread, findPlayers, inviteHome, myFriends, sendDm, type Dm, myHomeInvites, removeFriend, reportPlayer, requestFriend, respondFriend,
  type Found, type Friend, type HomeInvite,
} from "../../lib/friends";

/** 👫 Friends: find players, send and answer requests, invite friends to your home. Needs an account. */
export default function FriendsApp({ userId, onVisit }: { userId: string | null; onVisit: (owner: { id: string; name: string }) => void }) {
  const { t } = useLang();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invites, setInvites] = useState<HomeInvite[]>([]);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Found[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState<{ id: string; reason: string } | null>(null);
  const [chat, setChat] = useState<{ id: string; name: string } | null>(null);
  const [msgs, setMsgs] = useState<Dm[]>([]);
  const [draft, setDraft] = useState("");
  const [unread, setUnread] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const [f, i] = await Promise.all([myFriends(), myHomeInvites()]);
    if (f) setFriends(f);
    if (i) setInvites(i);
  }, []);
  useEffect(() => {
    if (userId) void load();
  }, [userId, load]);

  // Unread counts, and the open conversation, refreshed every few seconds while this app is open
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const tick = async () => {
      const [u, m] = await Promise.all([dmUnread(), chat ? dmThread(chat.id) : Promise.resolve(null)]);
      if (!alive) return;
      if (u) setUnread(Object.fromEntries(u.map(x => [x.from, x.count])));
      if (m) setMsgs(m);
    };
    void tick();
    const id = setInterval(tick, 5_000);
    return () => { alive = false; clearInterval(id); };
  }, [userId, chat]);

  if (!userId) return <p className="note">{t("friends.signIn")}</p>;

  // Run an action, then show what happened and refresh the lists
  const run = async (what: () => Promise<{ ok: boolean; reason?: string; status?: string } | null>, done: string) => {
    setBusy(true);
    const r = await what();
    setNote(!r ? t("friends.error") : r.ok ? done : t(`friends.reason.${r.reason ?? "other"}`));
    await load();
    setBusy(false);
  };

  if (chat) {
    return (
      <>
        <button className="btn plain" onClick={() => { setChat(null); setMsgs([]); }}>‹ {t("friends.back")}</button>
        <h3>{t("friends.chatWith", { name: chat.name })}</h3>
        <div className="chat" aria-live="polite">
          {msgs.length === 0 && <p className="note">{t("friends.noMessages")}</p>}
          {msgs.map(m => (
            <div key={m.id} className="chat-item">
              <div className={`bubble ${m.mine ? "me" : "them"}`}><p>{m.body}</p></div>
            </div>
          ))}
        </div>
        {note && <p className="note" role="status">{note}</p>}
        <form
          className="row"
          onSubmit={async e => {
            e.preventDefault();
            const text = draft.trim();
            if (!text) return;
            setDraft("");
            const r = await sendDm(chat.id, text);
            setNote(!r ? t("friends.error") : r.ok ? null : t(`friends.reason.${r.reason ?? "other"}`));
            const m = await dmThread(chat.id);
            if (m) setMsgs(m);
          }}
        >
          <input value={draft} maxLength={500} onChange={e => setDraft(e.target.value)} placeholder={t("friends.typeMessage")} aria-label={t("friends.typeMessage")} />
          <button className="btn" type="submit" disabled={!draft.trim()}>{t("friends.sendMessage")}</button>
        </form>
        <p className="note">{t("friends.dmNote")}</p>
      </>
    );
  }

  const incoming = friends.filter(f => f.status === "pending" && f.incoming);
  const sent = friends.filter(f => f.status === "pending" && !f.incoming);
  const mine = friends.filter(f => f.status === "accepted");

  return (
    <>
      <form
        className="row"
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          setFound(await findPlayers(q));
          setBusy(false);
        }}
      >
        <input value={q} maxLength={20} onChange={e => setQ(e.target.value)} placeholder={t("friends.search")} aria-label={t("friends.search")} />
        <button className="btn" type="submit" disabled={busy || q.trim().length < 2}>{t("friends.find")}</button>
      </form>
      {note && <p className="note" role="status">{note}</p>}

      {found && (
        <div className="group">
          {found.length === 0 && <p className="note">{t("friends.none")}</p>}
          {found.map(p => (
            <div className="row" key={p.id}>
              <span className="row-main"><span className="row-title">{p.avatar} {p.name}</span><span className="note">{t("phone.level", { level: p.level })}</span></span>
              <button className="chip-btn" disabled={busy} onClick={() => run(() => requestFriend(p.id), t("friends.sent"))}>{t("friends.add")}</button>
            </div>
          ))}
        </div>
      )}

      {incoming.length > 0 && <h3>{t("friends.requests")}</h3>}
      {incoming.map(f => (
        <div className="row" key={f.id}>
          <span className="row-main"><span className="row-title">{f.avatar} {f.name}</span></span>
          <button className="chip-btn" disabled={busy} onClick={() => run(() => respondFriend(f.id, true), t("friends.accepted"))}>{t("friends.accept")}</button>
          <button className="chip-btn" disabled={busy} onClick={() => run(() => respondFriend(f.id, false), t("friends.declined"))}>{t("friends.decline")}</button>
        </div>
      ))}

      {invites.length > 0 && <h3>{t("friends.homeInvites")}</h3>}
      {invites.map(i => (
        <div className="row" key={i.id}>
          <span className="row-main"><span className="row-title">🏠 {i.name}</span></span>
          <button className="chip-btn" onClick={() => onVisit({ id: i.id, name: i.name })}>{t("friends.visit")}</button>
        </div>
      ))}

      <h3>{t("friends.mine", { count: mine.length })}</h3>
      {mine.length === 0 && <p className="note">{t("friends.noFriends")}</p>}
      {mine.map(f => (
        <div className="row" key={f.id}>
          <span className="row-main"><span className="row-title">{f.avatar} {f.name}</span></span>
          <button className="chip-btn" onClick={() => { setNote(null); setChat({ id: f.id, name: f.name }); }}>💬 {t("friends.chat")}{unread[f.id] ? ` (${unread[f.id]})` : ""}</button>
          <button className="chip-btn" disabled={busy} onClick={() => run(() => inviteHome(f.id), t("friends.invited"))}>🏠 {t("friends.invite")}</button>
          <button className="chip-btn" disabled={busy} onClick={() => run(() => removeFriend(f.id), t("friends.removed"))}>{t("friends.remove")}</button>
          <button className="chip-btn" disabled={busy} onClick={() => run(() => blockPlayer(f.id), t("friends.blocked"))}>{t("friends.block")}</button>
          <button className="chip-btn" disabled={busy} onClick={() => setReporting(r => (r?.id === f.id ? null : { id: f.id, reason: "harassment" }))}>{t("friends.report")}</button>
          {reporting?.id === f.id && (
            <span className="row">
              <select value={reporting.reason} onChange={e => setReporting({ id: f.id, reason: e.target.value })} aria-label={t("friends.report")}>
                {["harassment", "cheating", "offensive_name", "spam", "other"].map(r => <option key={r} value={r}>{t(`friends.why.${r}`)}</option>)}
              </select>
              <button className="chip-btn" disabled={busy} onClick={() => { const r = reporting; setReporting(null); void run(() => reportPlayer(r.id, r.reason), t("friends.reported")); }}>{t("friends.sendReport")}</button>
            </span>
          )}
        </div>
      ))}

      {sent.length > 0 && <h3>{t("friends.waiting")}</h3>}
      {sent.map(f => (
        <div className="row" key={f.id}>
          <span className="row-main"><span className="row-title">{f.avatar} {f.name}</span></span>
          <button className="chip-btn" disabled={busy} onClick={() => run(() => removeFriend(f.id), t("friends.cancelled"))}>{t("friends.cancel")}</button>
        </div>
      ))}
    </>
  );
}
