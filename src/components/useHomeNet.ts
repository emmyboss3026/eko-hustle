import { useEffect, useRef, useState, type RefObject } from "react";
import type { HouseView } from "../three/HouseView";
import { Multiplayer, multiplayerUrl, type Peer, type Say } from "../lib/multiplayer";

export type HomeNet = {
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
        onStatus: s => setStatus(s.state),
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
    };
  }, [enabled, owner, view]);

  return { status, ended, peers, said, say: t => conn.current?.say(t), remove: id => conn.current?.remove(id) };
}
