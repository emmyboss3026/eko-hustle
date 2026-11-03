import { useEffect, useRef, useState, type RefObject } from "react";
import type { HouseView } from "../three/HouseView";
import { Multiplayer, multiplayerUrl, type PartyKind, type Peer, type Say } from "../lib/multiplayer";

/** A party game in this home, as the server last described it. Times are on this device's clock. */
export type Party = {
  kind: PartyKind; phase: "countdown" | "play" | "done"; startsAt: number; endsAt: number; beatMs: number; finish: number;
  names: Record<string, string>; scores: Record<string, number>; ranking: [string, string, number][] | null;
};

export type HomeNet = {
  me: string | null;
  party: Party | null;
  startParty: (kind: PartyKind) => void;       // owner only: the server ignores it from anyone else
  tap: () => void;
  closeParty: () => void;
  status: "off" | "connecting" | "online" | "offline" | "ended";
  ended: "denied" | "removed" | "replaced" | "kicked" | null;
  peers: { id: string; name: string }[];       // the others in the room
  said: (Say & { n: number })[];
  say: (text: string) => void;
  remove: (id: string) => void;                // owner only: the server ignores it from anyone else
};

/** Live presence in someone's home: shows the others in the HouseView and tells the server where you are.
 *  `owner` is whose home it is (your own id for your room). Pass `enabled=false` to stay out. */
export function useHomeNet(view: RefObject<HouseView | null>, owner: string | null, who: { name: string; look: Record<string, unknown> }, enabled: boolean): HomeNet {
  const [status, setStatus] = useState<HomeNet["status"]>("off");
  const [ended, setEnded] = useState<HomeNet["ended"]>(null);
  const [peers, setPeers] = useState<HomeNet["peers"]>([]);
  const [said, setSaid] = useState<HomeNet["said"]>([]);
  const [party, setParty] = useState<Party | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const conn = useRef<Multiplayer | null>(null);
  const whoRef = useRef(who);
  whoRef.current = who;

  useEffect(() => {
    if (!enabled || !owner || !multiplayerUrl) return;
    let n = 0;
    const known = new Map<string, string>();
    const sync = () => setPeers([...known].map(([id, name]) => ({ id, name })));
    const c = new Multiplayer(
      {
        onStatus: s => { setStatus(s.state); if (s.state === "online") setMe(conn.current?.me ?? null); },
        onEvent: e => {
          const now = Date.now();
          setParty({ kind: e.kind, phase: "countdown", startsAt: now + e.countdownMs, endsAt: now + e.countdownMs + e.durationMs, beatMs: e.beatMs, finish: e.finish, names: Object.fromEntries(e.players), scores: Object.fromEntries(e.players.map(([id]) => [id, 0])), ranking: null });
        },
        onEventScore: sc => setParty(p => (p ? { ...p, scores: Object.fromEntries(sc) } : p)),
        onEventEnd: (_kind, ranking) => setParty(p => (p ? { ...p, phase: "done", ranking } : p)),
        onWelcome: ps => {
          view.current?.clearRemotes();
          known.clear();
          ps.forEach(p => { view.current?.addRemote(p); known.set(p.id, p.name); });
          sync();
        },
        onJoin: (p: Peer) => { view.current?.addRemote(p); known.set(p.id, p.name); sync(); },
        onLeave: id => { view.current?.removeRemote(id); known.delete(id); sync(); },
        onSnap: ps => ps.forEach(([id, x, z, yaw, anim]) => view.current?.moveRemote(id, x, z, yaw, anim)),
        onFix: () => {},
        onSay: m => {
          const id = ++n;
          setSaid(l => [...l, { ...m, n: id }].slice(-4));
          setTimeout(() => setSaid(l => l.filter(x => x.n !== id)), 9_000);
        },
        onEnded: why => { setEnded(why); setStatus("ended"); },
      },
      whoRef.current,
      () => ({ x: 0, z: 0 }),
      owner,
    );
    conn.current = c;
    setEnded(null);
    c.start();
    let sent = { x: NaN, z: NaN, moving: false };
    const timer = setInterval(() => {
      const s = view.current?.mySpot();
      if (!s) return;
      if (Math.hypot(s.x - sent.x, s.z - sent.z) < 0.05 && s.moving === sent.moving) return;
      sent = s;
      c.move(s.x, s.z, s.yaw, s.moving ? 1 : 0);
    }, 100);
    return () => {
      clearInterval(timer);
      c.stop();
      conn.current = null;
      view.current?.clearRemotes();
      setStatus("off");
      setPeers([]);
      setSaid([]);
      setParty(null);
    };
  }, [enabled, owner, view]);

  return { status, ended, peers, said, me, party, say: t => conn.current?.say(t), remove: id => conn.current?.remove(id), startParty: k => conn.current?.startEvent(k), tap: () => conn.current?.tap(), closeParty: () => setParty(null) };
}
