import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../../i18n/react";
import { spots, type SpotId } from "../../data/spots";
import {
  addByCode, blockPlayer, cleanCode, dmAudio, dmThread, dmUnread, findPlayers, inviteHome, myFriendCode, myFriends, myHomeInvites, removeFriend, reportPlayer,
  requestFriend, resetFriendCode, respondFriend, sendDm, sendVoice, setFriendsDemo, showCode,
  type Dm, type Found, type Friend, type HomeInvite,
} from "../../lib/friends";

const MAX_VOICE_S = 45;
type Tab = "friends" | "requests" | "add";

/** Records a voice note from the microphone. `start` asks for permission; `stop(true)` hands back the recording, `stop(false)` throws it away. */
function useRecorder(onDone: (dataUrl: string, secs: number) => void, onError: (why: "denied" | "unsupported") => void) {
  const [secs, setSecs] = useState<number | null>(null);   // null while not recording
  const rec = useRef<{ mr: MediaRecorder; stream: MediaStream; chunks: Blob[]; t0: number; keep: boolean; timer: ReturnType<typeof setInterval> } | null>(null);

  const stop = useCallback((keep: boolean) => {
    const r = rec.current;
    if (!r) return;
    r.keep = keep;
    if (r.mr.state !== "inactive") r.mr.stop();
  }, []);

  const start = useCallback(async () => {
    if (rec.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { onError("unsupported"); return; }
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { onError("denied"); return; }
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(m => MediaRecorder.isTypeSupported(m));
    const mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 24_000 } : undefined);
    const r = { mr, stream, chunks: [] as Blob[], t0: Date.now(), keep: true, timer: setInterval(() => {
      const s = Math.floor((Date.now() - r.t0) / 1000);
      setSecs(s);
      if (s >= MAX_VOICE_S) stop(true);
    }, 250) };
    rec.current = r;
    setSecs(0);
    mr.ondataavailable = e => { if (e.data.size) r.chunks.push(e.data); };
    mr.onstop = () => {
      clearInterval(r.timer);
      stream.getTracks().forEach(t => t.stop());
      rec.current = null;
      setSecs(null);
      const length = Math.max(1, Math.round((Date.now() - r.t0) / 1000));
      if (!r.keep) return;
      const reader = new FileReader();
      reader.onload = () => onDone(String(reader.result), Math.min(60, length));
      reader.readAsDataURL(new Blob(r.chunks, { type: mr.mimeType || "audio/webm" }));
    };
    mr.start();
  }, [onDone, onError, stop]);

  // leaving the chat while recording throws the recording away
  useEffect(() => () => {
    const r = rec.current;
    if (r) { r.keep = false; if (r.mr.state !== "inactive") r.mr.stop(); }
  }, []);
  return { secs, start, stop };
}

/** One voice note: tap to play. The recording is fetched only now, then kept for replays. */
function VoiceBubble({ id, secs }: { id: number; secs: number }) {
  const { t } = useLang();
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audio = useRef<HTMLAudioElement | null>(null);
  const src = useRef<string | null>(null);

  useEffect(() => () => { audio.current?.pause(); }, []);

  async function toggle() {
    if (state === "playing") { audio.current?.pause(); setState("idle"); return; }
    setState("loading");
    if (!src.current) src.current = await dmAudio(id);
    if (!src.current) { setState("idle"); return; }
    const a = new Audio(src.current);
    audio.current = a;
    a.onended = () => setState("idle");
    a.onerror = () => setState("idle");
    try { await a.play(); setState("playing"); } catch { setState("idle"); }
  }

  return (
    <button className={`voice-bubble ${state}`} onClick={() => void toggle()} aria-label={t("friends.playVoice", { n: secs })}>
      <span className="voice-play">{state === "playing" ? "⏸" : state === "loading" ? "…" : "▶"}</span>
      <span className="voice-wave" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ height: `${30 + ((i * 37) % 60)}%`, animationDelay: `${i * 60}ms` }} />)}</span>
      <span className="voice-secs">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
    </button>
  );
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** 👫 Friends: a messaging app. Your friends with where they are, requests, your private friend code, text and voice chat, and home visits. Needs an account. */
export default function FriendsApp({ userId: signedIn, onVisit }: { userId: string | null; onVisit: (owner: { id: string; name: string }) => void }) {
  const { t, tx } = useLang();
  // On a development build with nobody signed in, a pretend server stands in, so every part of the app can be tried
  const demo = import.meta.env.DEV && !signedIn;
  setFriendsDemo(demo);
  const userId = signedIn ?? (demo ? "demo" : null);
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invites, setInvites] = useState<HomeInvite[]>([]);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Found[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [reporting, setReporting] = useState<{ id: string; reason: string } | null>(null);
  const [chat, setChat] = useState<{ id: string; name: string } | null>(null);
  const [msgs, setMsgs] = useState<Dm[]>([]);
  const [draft, setDraft] = useState("");
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [code, setCode] = useState<string | null>(null);
  const [askNew, setAskNew] = useState(false);
  // a shared link (?code=ABCD-EFGH) pre-fills the box and opens the Add tab
  const [typed, setTyped] = useState(() => cleanCode(new URLSearchParams(location.search).get("code") ?? ""));
  const end = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const [f, i] = await Promise.all([myFriends(), myHomeInvites()]);
    if (f) setFriends(f);
    if (i) setInvites(i);
  }, []);
  useEffect(() => {
    if (!userId) return;
    void load();
    void myFriendCode().then(c => setCode(c));
    const id = setInterval(() => void load(), 15_000);   // new requests, invitations and "where is my friend" update while this app is open
    return () => clearInterval(id);
  }, [userId, load]);
  useEffect(() => { if (typed.length === 8 && tab === "friends") setTab("add"); }, [typed, tab]);

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
    const id = setInterval(tick, 4_000);
    return () => { alive = false; clearInterval(id); };
  }, [userId, chat]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  const refreshThread = async (id: string) => { const m = await dmThread(id); if (m) setMsgs(m); };
  const sendVoiceNote = useCallback(async (audio: string, secs: number) => {
    if (!chat) return;
    const r = await sendVoice(chat.id, audio, secs);
    setNote(!r ? t("friends.error") : r.ok ? null : t(`friends.reason.${r.reason ?? "other"}`));
    await refreshThread(chat.id);
  }, [chat, t]);
  const mic = useRecorder(sendVoiceNote, why => setNote(t(why === "denied" ? "friends.micDenied" : "friends.micUnsupported")));

  if (!userId) return <p className="note">{t("friends.signIn")}</p>;

  // Run an action, then show what happened and refresh the lists
  const run = async (what: () => Promise<{ ok: boolean; reason?: string; status?: string } | null>, done: string) => {
    setBusy(true);
    const r = await what();
    setNote(!r ? t("friends.error") : r.ok ? done : t(`friends.reason.${r.reason ?? "other"}`));
    await load();
    setBusy(false);
  };

  const presence = (f: Friend) => {
    if (!f.place) return <span className="presence off">{t("friends.offline")}</span>;
    const where = f.place === "home" ? t("friends.atHome") : f.place === "street" ? t("friends.inStreets") : t("friends.atPlace", { place: spots[f.place as SpotId] ? tx.spot(f.place as SpotId) : f.place });
    return <span className="presence on">{where}</span>;
  };

  // ---------------------------------------------------------------- a conversation
  if (chat) {
    const friend = friends.find(f => f.id === chat.id);
    return (
      <div className="dm-chat">
        <div className="dm-head">
          <button className="dm-back" onClick={() => { mic.stop(false); setChat(null); setMsgs([]); }} aria-label={t("friends.back")}>‹</button>
          <span className="dm-ava" aria-hidden>{friend?.avatar ?? "🙂"}</span>
          <span className="dm-who"><b>@{chat.name}</b>{friend && presence(friend)}</span>
          {invites.some(i => i.id === chat.id) && <button className="chip-btn" onClick={() => onVisit({ id: chat.id, name: chat.name })}>🏠 {t("friends.visit")}</button>}
        </div>
        <div className="chat dm-thread" aria-live="polite">
          {msgs.length === 0 && <p className="note">{t("friends.noMessages")}</p>}
          {msgs.map(m => (
            <div key={m.id} className={`bubble-row ${m.mine ? "me" : "them"}`}>
              <div className={`bubble ${m.mine ? "me" : "them"}`}>
                {m.has_audio ? <VoiceBubble id={m.id} secs={m.audio_secs ?? 1} /> : <p>{m.body}</p>}
                <small className="bubble-time">{timeOf(m.created_at)}</small>
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
        {note && <p className="note" role="status">{note}</p>}
        {mic.secs !== null ? (
          <div className="dm-recording" role="status">
            <button className="chip-btn" onClick={() => mic.stop(false)} aria-label={t("friends.cancelVoice")}>🗑️</button>
            <span className="rec-dot" aria-hidden />
            <b>{Math.floor(mic.secs / 60)}:{String(mic.secs % 60).padStart(2, "0")}</b>
            <span className="note">{t("friends.recording", { max: MAX_VOICE_S })}</span>
            <button className="btn" onClick={() => mic.stop(true)}>➤ {t("friends.sendMessage")}</button>
          </div>
        ) : (
          <form
            className="dm-compose"
            onSubmit={async e => {
              e.preventDefault();
              const text = draft.trim();
              if (!text) return;
              setDraft("");
              const r = await sendDm(chat.id, text);
              setNote(!r ? t("friends.error") : r.ok ? null : t(`friends.reason.${r.reason ?? "other"}`));
              await refreshThread(chat.id);
            }}
          >
            <input value={draft} maxLength={500} onChange={e => setDraft(e.target.value)} placeholder={t("friends.typeMessage")} aria-label={t("friends.typeMessage")} />
            {draft.trim() ? <button className="dm-send" type="submit" aria-label={t("friends.sendMessage")}>➤</button> : <button className="dm-mic" type="button" onClick={() => void mic.start()} aria-label={t("friends.recordVoice")}>🎤</button>}
          </form>
        )}
        <p className="note">{t("friends.dmNote")}</p>
      </div>
    );
  }

  const incoming = friends.filter(f => f.status === "pending" && f.incoming);
  const sent = friends.filter(f => f.status === "pending" && !f.incoming);
  const mine = friends.filter(f => f.status === "accepted").sort((a, b) => Number(!!b.place) - Number(!!a.place) || a.name.localeCompare(b.name));
  const online = mine.filter(f => f.place).length;
  const requests = incoming.length + invites.length;
  const totalUnread = Object.values(unread).reduce((n, v) => n + v, 0);

  const share = async () => {
    if (!code) return;
    const text = t("friends.shareText", { code: showCode(code), url: `${location.origin}/?code=${code}` });
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); setNote(t("friends.copied")); }
    } catch {
      // the share sheet was closed: nothing to do
    }
  };

  return (
    <div className="friends-app">
      <div className="friends-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "friends"} className={tab === "friends" ? "on" : ""} onClick={() => setTab("friends")}>👫 {t("friends.tabFriends")}{totalUnread > 0 && <i className="badge">{totalUnread}</i>}</button>
        <button role="tab" aria-selected={tab === "requests"} className={tab === "requests" ? "on" : ""} onClick={() => setTab("requests")}>📨 {t("friends.tabRequests")}{requests > 0 && <i className="badge">{requests}</i>}</button>
        <button role="tab" aria-selected={tab === "add"} className={tab === "add" ? "on" : ""} onClick={() => setTab("add")}>➕ {t("friends.tabAdd")}</button>
      </div>
      {note && <p className="note" role="status">{note}</p>}

      {tab === "friends" && (
        <>
          <p className="friends-count">{t("friends.count", { total: mine.length, online })}</p>
          {mine.length === 0 && (
            <div className="friends-empty">
              <p>{t("friends.noFriends")}</p>
              <button className="btn" onClick={() => setTab("add")}>➕ {t("friends.addFirst")}</button>
            </div>
          )}
          {mine.map(f => (
            <div className="friend-row" key={f.id}>
              <span className={`dm-ava ${f.place ? "live" : ""}`} aria-hidden>{f.avatar ?? "🙂"}</span>
              <span className="friend-main"><b>@{f.name}</b>{presence(f)}</span>
              <button className="pill" onClick={() => { setNote(null); setChat({ id: f.id, name: f.name }); }}>💬{unread[f.id] ? ` ${unread[f.id]}` : ""}</button>
              {invites.some(i => i.id === f.id)
                ? <button className="pill go" onClick={() => onVisit({ id: f.id, name: f.name })}>🏠 {t("friends.visit")}</button>
                : <button className="pill" disabled={busy} onClick={() => run(() => inviteHome(f.id), t("friends.invited"))}>🏠 {t("friends.invite")}</button>}
              <button className="pill dots" onClick={() => setMenu(m => (m === f.id ? null : f.id))} aria-label={t("friends.more")} aria-expanded={menu === f.id}>⋯</button>
              {menu === f.id && (
                <span className="friend-menu">
                  <button className="pill danger" disabled={busy} onClick={() => run(() => removeFriend(f.id), t("friends.removed"))}>{t("friends.remove")}</button>
                  <button className="pill danger" disabled={busy} onClick={() => run(() => blockPlayer(f.id), t("friends.blocked"))}>{t("friends.block")}</button>
                  <button className="pill" disabled={busy} onClick={() => setReporting(r => (r?.id === f.id ? null : { id: f.id, reason: "harassment" }))}>{t("friends.report")}</button>
                  {reporting?.id === f.id && (
                    <span className="row">
                      <select value={reporting.reason} onChange={e => setReporting({ id: f.id, reason: e.target.value })} aria-label={t("friends.report")}>
                        {["harassment", "cheating", "offensive_name", "spam", "other"].map(r => <option key={r} value={r}>{t(`friends.why.${r}`)}</option>)}
                      </select>
                      <button className="pill" disabled={busy} onClick={() => { const r = reporting; setReporting(null); setMenu(null); void run(() => reportPlayer(r.id, r.reason), t("friends.reported")); }}>{t("friends.sendReport")}</button>
                    </span>
                  )}
                </span>
              )}
            </div>
          ))}
        </>
      )}

      {tab === "requests" && (
        <>
          {requests === 0 && sent.length === 0 && <p className="note">{t("friends.noRequests")}</p>}
          {incoming.length > 0 && <h3>{t("friends.requests")}</h3>}
          {incoming.map(f => (
            <div className="friend-row" key={f.id}>
              <span className="dm-ava" aria-hidden>{f.avatar ?? "🙂"}</span>
              <span className="friend-main"><b>@{f.name}</b><span className="presence off">{t("friends.wantsToBe")}</span></span>
              <button className="pill go" disabled={busy} onClick={() => run(() => respondFriend(f.id, true), t("friends.accepted"))}>✓ {t("friends.accept")}</button>
              <button className="pill danger" disabled={busy} onClick={() => run(() => respondFriend(f.id, false), t("friends.declined"))}>✕</button>
            </div>
          ))}
          {invites.length > 0 && <h3>{t("friends.homeInvites")}</h3>}
          {invites.map(i => (
            <div className="friend-row" key={i.id}>
              <span className="dm-ava" aria-hidden>🏠</span>
              <span className="friend-main"><b>@{i.name}</b><span className="presence on">{t("friends.invitesYou")}</span></span>
              <button className="pill go" onClick={() => onVisit({ id: i.id, name: i.name })}>{t("friends.visit")}</button>
            </div>
          ))}
          {sent.length > 0 && <h3>{t("friends.waiting")}</h3>}
          {sent.map(f => (
            <div className="friend-row" key={f.id}>
              <span className="dm-ava" aria-hidden>{f.avatar ?? "🙂"}</span>
              <span className="friend-main"><b>@{f.name}</b><span className="presence off">{t("friends.pending")}</span></span>
              <button className="pill" disabled={busy} onClick={() => run(() => removeFriend(f.id), t("friends.cancelled"))}>{t("friends.cancel")}</button>
            </div>
          ))}
        </>
      )}

      {tab === "add" && (
        <>
          <div className="friend-code">
            <small>{t("friends.myCode")}</small>
            <b aria-label={code ?? ""}>{code ? showCode(code) : "…"}</b>
            <div className="row">
              <button className="chip-btn" disabled={!code} onClick={() => void share()}>📤 {t("friends.share")}</button>
              <button className="chip-btn" disabled={busy || !code} onClick={() => { if (!askNew) { setAskNew(true); setNote(t("friends.newCodeAsk")); return; } setAskNew(false); void resetFriendCode().then(c => { if (c) { setCode(c); setNote(t("friends.newCodeDone")); } }); }}>🔄 {askNew ? t("friends.newCodeYes") : t("friends.newCode")}</button>
            </div>
            <p className="note">{t("friends.codeNote")}</p>
          </div>
          <ol className="how-steps">
            <li>{t("friends.how1")}</li>
            <li>{t("friends.how2")}</li>
            <li>{t("friends.how3")}</li>
          </ol>
          <form
            className="row"
            onSubmit={async e => {
              e.preventDefault();
              if (typed.length < 8) return;
              setBusy(true);
              const r = await addByCode(typed);
              setNote(!r ? t("friends.error") : r.ok ? t("friends.codeOk", { name: r.name ?? "" }) : t(`friends.reason.${r.reason ?? "other"}`));
              if (r?.ok) { setTyped(""); setTab("friends"); }
              await load();
              setBusy(false);
            }}
          >
            <input value={showCode(typed)} onChange={e => setTyped(cleanCode(e.target.value))} placeholder={t("friends.codePlaceholder")} aria-label={t("friends.codePlaceholder")} autoCapitalize="characters" autoComplete="off" />
            <button className="btn" type="submit" disabled={busy || typed.length < 8}>{t("friends.useCode")}</button>
          </form>
          <h3>{t("friends.findByName")}</h3>
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
          {found && (
            <div className="group">
              {found.length === 0 && <p className="note">{t("friends.none")}</p>}
              {found.map(p => (
                <div className="friend-row" key={p.id}>
                  <span className="dm-ava" aria-hidden>{p.avatar ?? "🙂"}</span>
                  <span className="friend-main"><b>@{p.name}</b><span className="presence off">{t("phone.level", { level: p.level })}</span></span>
                  <button className="pill go" disabled={busy} onClick={() => run(() => requestFriend(p.id), t("friends.sent"))}>{t("friends.add")}</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
