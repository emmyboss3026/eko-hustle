import { useCallback, useEffect, useState } from "react";
import { useLang } from "../../i18n/react";
import {
  blockPlayer, findPlayers, inviteHome, myFriends, myHomeInvites, removeFriend, requestFriend, respondFriend,
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

  const load = useCallback(async () => {
    const [f, i] = await Promise.all([myFriends(), myHomeInvites()]);
    if (f) setFriends(f);
    if (i) setInvites(i);
  }, []);
  useEffect(() => {
    if (userId) void load();
  }, [userId, load]);

  if (!userId) return <p className="note">{t("friends.signIn")}</p>;

  // Run an action, then show what happened and refresh the lists
  const run = async (what: () => Promise<{ ok: boolean; reason?: string; status?: string } | null>, done: string) => {
    setBusy(true);
    const r = await what();
    setNote(!r ? t("friends.error") : r.ok ? done : t(`friends.reason.${r.reason ?? "other"}`));
    await load();
    setBusy(false);
  };

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
          <button className="chip-btn" disabled={busy} onClick={() => run(() => inviteHome(f.id), t("friends.invited"))}>🏠 {t("friends.invite")}</button>
          <button className="chip-btn" disabled={busy} onClick={() => run(() => removeFriend(f.id), t("friends.removed"))}>{t("friends.remove")}</button>
          <button className="chip-btn" disabled={busy} onClick={() => run(() => blockPlayer(f.id), t("friends.blocked"))}>{t("friends.block")}</button>
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
