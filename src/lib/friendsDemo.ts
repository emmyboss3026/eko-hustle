// A pretend friends server for local testing (development builds only, when nobody is signed in): a few friends with places,
// a request, a home invitation, chat with replies, voice notes, and friend codes. It lives in this browser's storage only.
// It mirrors the answers of the real database functions in supabase/*.sql so the Friends app can be tried end to end.

type DemoFriend = { id: string; name: string; avatar: string; status: "pending" | "accepted"; incoming: boolean; place: string | null };
type DemoDm = { id: number; mine: boolean; body: string; created_at: string; has_audio?: boolean; audio_secs?: number | null; from?: string; read?: boolean };
type Store = { friends: DemoFriend[]; dms: Record<string, DemoDm[]>; audio: Record<number, string>; invites: { id: string; name: string; expires_at: string }[]; next: number; code: string };

const KEY = "eko-demo-friends-v1";
const REPLIES = ["Wetin dey happen? 😄", "Haha, true!", "Abeg come my place, make we gist.", "I dey the street, see you soon.", "Nice one! 🔥", "You don chop?", "Make we play Ludo later 🎲"];

function seed(): Store {
  const inOneDay = new Date(Date.now() + 24 * 3600_000).toISOString();
  return {
    friends: [
      { id: "demo-ada", name: "Ada", avatar: "👩🏾", status: "accepted", incoming: false, place: "home" },
      { id: "demo-chidi", name: "Chidi", avatar: "🧑🏾", status: "accepted", incoming: false, place: "buka" },
      { id: "demo-tunde", name: "Tunde", avatar: "👨🏾", status: "accepted", incoming: false, place: null },
      { id: "demo-ngozi", name: "Ngozi", avatar: "👧🏾", status: "pending", incoming: true, place: null },
    ],
    dms: { "demo-ada": [{ id: 1, mine: false, from: "demo-ada", body: "Welcome to Eko Hustle! 🎉 This is a local demo chat.", created_at: new Date().toISOString(), read: false }] },
    audio: {}, invites: [{ id: "demo-ada", name: "Ada", expires_at: inOneDay }], next: 2, code: "DEMO2K7X",
  };
}

const load = (): Store => {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as Store; } catch { /* start fresh */ }
  return seed();
};
const save = (s: Store) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full: the demo just forgets */ } };

const ok = (extra: Record<string, unknown> = {}) => ({ ok: true, ...extra });

/** A friend answers a little later, like a real one would. */
function reply(to: string) {
  setTimeout(() => {
    const s = load();
    (s.dms[to] ??= []).push({ id: s.next++, mine: false, from: to, body: REPLIES[Math.floor(Math.random() * REPLIES.length)], created_at: new Date().toISOString(), read: false });
    save(s);
  }, 2200);
}

/** Answers one call the way the real function would. */
export function demoCall(fn: string, args: Record<string, unknown> = {}): unknown {
  const s = load();
  const friend = (id: unknown) => s.friends.find(f => f.id === id);
  switch (fn) {
    case "my_friends": return s.friends;
    case "my_home_invites": return s.invites;
    case "my_friend_code": return s.code;
    case "reset_friend_code": s.code = Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join(""); save(s); return s.code;
    case "add_by_code": {
      const c = String(args.p_code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!/^[A-HJ-NP-Z2-9]{8}$/.test(c)) return { ok: false, reason: "bad_code" };
      if (c === s.code) return { ok: false, reason: "self" };
      const id = `demo-${c.toLowerCase()}`;
      const name = `Player${c.slice(0, 4)}`;
      if (!friend(id)) s.friends.push({ id, name, avatar: "🧑🏿", status: "accepted", incoming: false, place: "street" });
      s.invites = [...s.invites.filter(i => i.id !== id), { id, name, expires_at: new Date(Date.now() + 24 * 3600_000).toISOString() }];
      save(s);
      return ok({ id, name });
    }
    case "find_players": return [{ id: "demo-zainab", name: "Zainab", avatar: "👩🏽", level: 7 }, { id: "demo-emeka", name: "Emeka", avatar: "🧔🏾", level: 12 }];
    case "friend_request": s.friends.push({ id: String(args.p_to), name: String(args.p_to).replace("demo-", "").replace(/^./, c => c.toUpperCase()), avatar: "🙂", status: "pending", incoming: false, place: null }); save(s); return ok({ status: "pending" });
    case "friend_respond": {
      const f = friend(args.p_from);
      if (f) { if (args.p_accept) { f.status = "accepted"; f.incoming = false; f.place = "street"; } else s.friends = s.friends.filter(x => x !== f); }
      save(s); return ok();
    }
    case "friend_remove": case "block_player": s.friends = s.friends.filter(f => f.id !== args.p_other); s.invites = s.invites.filter(i => i.id !== args.p_other); save(s); return ok();
    case "report_player": return ok();
    case "invite_home": return ok();
    case "dm_thread": {
      const list = s.dms[String(args.p_other)] ?? [];
      list.forEach(m => { if (!m.mine) m.read = true; });
      save(s);
      return list.map(({ id, mine, body, created_at, has_audio, audio_secs }) => ({ id, mine, body, created_at, has_audio: !!has_audio, audio_secs: audio_secs ?? null }));
    }
    case "dm_unread": return Object.entries(s.dms).map(([from, list]) => ({ from, count: list.filter(m => !m.mine && !m.read).length })).filter(x => x.count > 0);
    case "send_dm": {
      const to = String(args.p_to);
      (s.dms[to] ??= []).push({ id: s.next++, mine: true, body: String(args.p_text ?? "").slice(0, 500), created_at: new Date().toISOString() });
      save(s); reply(to); return ok();
    }
    case "send_voice": {
      const to = String(args.p_to);
      const id = s.next++;
      s.audio[id] = String(args.p_audio ?? "");
      (s.dms[to] ??= []).push({ id, mine: true, body: "🎤", created_at: new Date().toISOString(), has_audio: true, audio_secs: Number(args.p_secs) || 1 });
      save(s); reply(to); return ok();
    }
    case "dm_audio": return s.audio[Number(args.p_id)] ?? null;
    case "touch_presence": return null;
    default: return null;
  }
}
