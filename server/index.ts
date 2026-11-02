// The multiplayer server. Run it with `npm run server`. It is separate from the website:
// the website (Vercel) only serves the game; this process keeps the live positions of players.
//
// Sign-in: the browser sends its Supabase access token. This server asks Supabase who the token belongs to,
// so nobody can pretend to be someone else. No secret keys are needed: only the public URL and anon key.
// For local testing, `npm run server:dev` (or ALLOW_GUESTS=1) lets in players with no account (they are named Guest-…).

import { WebSocketServer, type WebSocket } from "ws";
import { Cities } from "./city.ts";

const PORT = Number(process.env.PORT ?? 2567);
const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
const ALLOW_GUESTS = process.env.ALLOW_GUESTS === "1" || process.argv.includes("--guests");
const ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173").split(",").map(s => s.trim());
const HELLO_WITHIN_MS = 5_000;

const log = (...a: unknown[]) => console.log(new Date().toISOString(), ...a);

/** Who does this Supabase token belong to? null if it is not valid. */
async function userFor(token: unknown): Promise<{ id: string } | null> {
  if (typeof token !== "string" || !SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const u = (await r.json()) as { id?: string };
    return typeof u.id === "string" ? { id: u.id } : null;
  } catch {
    return null;
  }
}

const cities = new Cities({
  suspicious: (m, why) => log("suspicious move", m.id, m.name, why, `strikes=${m.strikes}`),
  kick: m => {
    log("kicked", m.id, m.name);
    sockets.get(m.id)?.close(4003, "too many invalid moves");
  },
});
const sockets = new Map<string, WebSocket>();

const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 1024, // every message is tiny; anything bigger is refused
  verifyClient: ({ origin }: { origin?: string }) => !origin || ORIGINS.includes(origin),
});

wss.on("connection", ws => {
  let id: string | null = null;
  const hello = setTimeout(() => ws.close(4001, "no hello"), HELLO_WITHIN_MS);
  const send = (msg: Record<string, unknown>) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(msg));
  let signingIn = false;

  ws.on("message", async raw => {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(String(raw)); } catch { return; }
    if (!msg || typeof msg !== "object") return;

    if (!id) {
      if (msg.t !== "hello" || signingIn) return;
      signingIn = true;
      const user = await userFor(msg.token);
      if (!user && !ALLOW_GUESTS) { send({ t: "error", reason: "sign in first" }); ws.close(4002, "not signed in"); return; }
      clearTimeout(hello);
      id = user?.id ?? `guest-${Math.random().toString(36).slice(2, 8)}`;
      const name = user ? msg.name : `Guest-${id.slice(-4)}`;
      sockets.get(id)?.close(4004, "signed in elsewhere"); // one live character per account
      sockets.set(id, ws);
      const want = typeof msg.instance === "string" ? msg.instance : undefined;
      const m = cities.join({ id, name: String(name ?? ""), look: msg.look, at: msg.at as { x?: unknown; z?: unknown }, send }, want);
      log("join", m.instance, m.id, m.name);
      return;
    }
    if (msg.t === "move") cities.move(id, msg.x, msg.z, msg.yaw, msg.anim);
    else if (msg.t === "say") cities.say(id, msg.text);
  });

  ws.on("close", () => {
    clearTimeout(hello);
    if (id && sockets.get(id) === ws) {
      sockets.delete(id);
      cities.leave(id);
      log("leave", id);
    }
  });
  ws.on("error", () => ws.close());
});

setInterval(() => cities.tick(), 100); // ten position updates a second

log(`multiplayer server on ws://localhost:${PORT}`, ALLOW_GUESTS ? "(guests allowed: development only)" : "", SUPABASE_URL ? "" : "(no Supabase URL: nobody can sign in)");
