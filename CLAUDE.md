# Eko Hustle: notes for Claude Code

A browser life-sim set in Lagos (Vite + React 19 + TypeScript + three.js, PWA). Original names and art only:
it's inspired by Lagos Life but must not copy its text, art, characters or brands.

## Commands
- `npm run dev` / `npm run build` (tsc + vite) / `npm test` (vitest) / `npm run lint` (oxlint)
- Before every commit: `npx tsc -b && npx oxlint && npx vitest run && npx vite build`
- Regenerate the server's mission list after changing missions: `npx vitest run scripts/story-sql.test.ts`
  (writes `supabase/story-catalog.sql`)
- List untranslated content: `MISSING_OUT=/tmp/missing.json npx vitest run scripts/missing-i18n.test.ts`

## Where things are
- Game rules: `src/engine/` (pure reducer `reduce(state, cmd)`; `story.ts` = mission engine, `phone.ts` = ledger/apps)
- Story: `src/data/story/` (ch01–ch10, `sides.ts`, `cast.ts`, `types.ts`). Text keys `mission.<id>.*`
- Text: `src/i18n/en.ts` (source), `de.ts`, `pcm.ts` (Pidgin). The i18n test requires every key in all three,
  same `{placeholders}` and `**bold**`. The player can be any gender: keep German neutral.
- Payments: `supabase/functions/bachs-checkout`, `bachs-webhook`, shared prices in `_shared/bachs.ts`
  (must match `src/data/revive.ts`; a test checks this)
- Database updates: `supabase/*.sql` (run by hand in the Supabase SQL Editor)
- Legal pages: `public/*.html`, business details in `public/legal.js`

## Growing the map (do this with every update or fix)
The owner wants the town to get bigger with every update, fix included. Each time, add one entry at the END of `GROWTH` in
`src/three/growth.js`: it grows the land by one ring (roads and lots 60 further out) and adds new places (two at least; the owner asked for FIVE on 4 Nov 2026, so use five from now on). Then:
1. Pick free lots in the new ring (centres at ±(150 + 60 × level)); the door must face the inner road. Give each a `solids` list.
2. Add every id to `SpotId` and `spots` in `src/data/spots.ts` (`lot: true`, a district, opening hours, a blurb).
3. Add 2 actions per place in `src/data/actions.ts` (give them something useful: supplies, fun, skills, money).
4. Add a `case` for each id in `buildPlace` (`src/three/street.js`): lot plane, building, sign, matching `solids`.
5. Add German and Pidgin text: `MISSING_OUT=/tmp/missing.json npx vitest run scripts/missing-i18n.test.ts`, then add every key it lists.
6. Run the usual checks. The "map growth" test checks spots, lots, doors and the new size. Restart the multiplayer server (it shares the world).
Never reorder or remove older growth entries: the seeded town depends on their order. Say what you added in your closing message.

## Rules
- Push every update to GitHub (`emmyboss3026/eko-hustle`). Commit as emmyboss3026 /
  152133906+emmyboss3026@users.noreply.github.com.
- Pushing to `main` deploys the live game on Vercel (project eko-hustle01). Use a branch for previews and ask
  before merging to main.
- Never put secrets (service role / sb_secret_ keys, BACHS_API_KEY, BACHS_WEBHOOK_SECRET, Postgres passwords) in
  `VITE_`/`NEXT_PUBLIC_` variables, `.env` files in git, or client code. They live in Supabase secrets.
- Money and gems are decided on the server only. Never trust the browser for a purchase.
- Don't switch Bachs to live keys, create charges, or apply SQL to the live database without the owner's OK.
- Supabase live project: `pzasvqshxxmwxouktzzw`. Edge functions `bachs-checkout` and `bachs-webhook` are deployed.

## State on 2 Nov 2026
Done: 100-mission story (10 chapters, 5 careers, side missions, daily/weekly), revive with ad or Power Gem,
consent banner, legal pages, privacy tools, translations complete, all 98 tests pass.
Branch `story-expansion-finish` has a working Vercel preview, not yet merged to `main`.

Still open:
1. Owner reviews the preview, then merge `story-expansion-finish` into `main`.
2. Owner runs `supabase/update-2026-11-story.sql`, then `supabase/story-catalog.sql`, in the SQL Editor.
3. Redeploy checkout: `npx supabase functions deploy bachs-checkout` (it now refuses unknown products).
4. H5 Games Ads: owner applies in AdSense, then sets `VITE_ADSENSE_CLIENT=ca-pub-…` on Vercel. The build then adds
   the verification meta tag and `/ads.txt` automatically.
5. A real Bachs sandbox test purchase (needs the owner's sandbox keys in Supabase secrets).
6. Later: more cities (postponed), subscriptions if Bachs supports recurring billing, AppLixir at 5,000+ daily players.
