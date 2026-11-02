# Multiplayer prototype (shared streets)

What works today: signed-in players who walk the 3D streets join a shared city instance, see each other's characters
and name tags move in real time, and can talk to people nearby. Nothing here is hosted yet.

## Run it on your PC

```bash
npm run server:dev      # the multiplayer server on ws://localhost:2567, guests allowed (development only)
npm run dev             # the game; needs VITE_MULTIPLAYER_URL=ws://localhost:2567 in .env.local
```

Open the game in two browser windows, tap **Walk outside** in both. Without `VITE_MULTIPLAYER_URL` the game is
single-player exactly as before.

## How it fits together

- `server/city.ts`: instances (24 players each, new ones open when full), movement checks (speed, walls, edge of the
  land), proximity chat (30 units, 120 characters, 1 message a second). Pure logic, no sockets.
- `server/index.ts`: WebSocket server (`ws`). The first message must be a Supabase access token; the server asks
  Supabase who it belongs to (`/auth/v1/user`), so nobody can pose as someone else. No secret key is needed.
  Messages over 1 KB are refused; browser origins are checked (`ALLOWED_ORIGINS`).
- `src/lib/multiplayer.ts`: the browser side; reconnects on its own and returns to the same instance.
- `src/three/street.js`: draws other players (`addRemote`, `moveRemote`) and glides them between updates.
- Positions are kept in the server's memory only. Nothing is written to the database.

## Hosting (not done, costs not yet agreed)

The server must run as an always-on Node process, separate from Vercel (Vercel functions cannot keep WebSockets open).
Any small VPS or container host works (Fly.io, Railway, Render, a plain VPS). Needs: Node 24, `npm ci`,
`npm run server`, a TLS address (`wss://`), and these variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`ALLOWED_ORIGINS` (your site's address). Then set `VITE_MULTIPLAYER_URL=wss://…` on Vercel. Never set
`ALLOW_GUESTS` in production.

## Not built yet

Friend requests, home invitations, private home instances, direct messages, reconnection tokens, blocking and
reporting, player-owned businesses, NPC sync between players (each player still sees their own NPCs and traffic).
The instance size of 24 is a starting target and has not been load-tested. No frame-rate or bandwidth
measurements have been taken.
