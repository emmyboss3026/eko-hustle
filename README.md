# Eko Hustle

A Lagos life simulator. You start in a three-room self-contain in Mushin. Furnish it in 3D, walk the streets, survive NEPA and the go-slow, build skills and a career, then decide: **japa abroad** or **become a landlord at home**.

Eko Hustle merges **Hustle & Japa** with **Gidi Hustle v0.5**:

| From Hustle & Japa | From Gidi Hustle v0.5 |
| --- | --- |
| Six needs, health, traits, skills | 3D flat with 3 rooms, the compound and neighbours around it |
| Four districts, travel and the go-slow | The open-world 3D streets: walk to any place and go in |
| Six careers with promotions | 14 places with opening hours (buka, market, tech hub, gym, beach, club…) |
| Events, IELTS, visa, flight, house | Gigs that pay more as your skill grows, phone actions, home delivery |
| Accounts, cloud save, leaderboard, ads, Bachs | Moods (moodlets), skill furniture, place pictures, travel cutscene |

**New in this version:** the whole game is on one screen. Your 3D flat (or the streets, or the place you're at) fills the screen, and everything else sits around it: the top bar, the 🎯 mission card, live 💡 tips, a ❓ Help button with simple how-tos, and a dock of buttons that open panels over the world.

**Also new:**
- **3 languages:** English (UK), Deutsch and Naija Pidgin. Pick one on the first screen or in 👤 Me → Language.
- **10 ready-made characters** from all over Nigeria (and one from London), different ages, skin tones and backgrounds, or customise skin, hair, headwear and clothes yourself.
- **💬 Feedback box** on the right side of the screen (bug, idea, confusing, I like…, plus a star rating). It works offline too and sends later.
- **📖 Diary:** everything that happens is saved with your game, day by day and searchable, plus a list of your past lives.
- **Fast food:** Mama Put Express, Jollof Junction, Big Bite Burgers, Crunchy Chicken and ChopNow delivery, and a fast-food career. All names are made up for the game.

**New: the 📱 phone.** A real phone in the game (bottom dock), with red badges for anything new:

| App | What it does |
| --- | --- |
| 💬 Messages | Story messages from the people in your life, invitations and reports. Quick replies change friendships. |
| 🏦 Bank | Balance, net worth, money in and out by category, and every transaction. |
| 📈 Invest | Six made-up funds, from a safe savings box to a wild token. Prices move once a game day. Profit, loss and history. |
| 🏪 Business | Buy a pure water stand, suya spot, POS kiosk, keke, salon or mini-mart. Upgrade, hire and fire staff, and collect the daily profit. |
| 💌 Invites | Parties, business mixers, VIP nights, job chances. Accept or decline before they expire. |
| 📇 Contacts | Eight people with relationships from 0 to 100. Call, text, send gifts, and ask close friends for help once a week. |
| 🎁 Rewards | Daily login reward: ₦1,000 → ₦10,000 over 7 days, then it starts again. One missed day is forgiven. |
| 🏆 Leaderboard | Global, Wealth, Status and This week, with medals, search, your own position and player profiles. |
| 💼 Jobs · 🛵 Quick | The jobs list, and everything you can do on your phone anywhere. |

**Progress** (worked out from the save, never stored twice): level, net worth, reputation, social status (JJC → Eko royalty), 18 achievements and a score. **Sound** (👤 Me → Sound, all made live in the browser, no sound files): effects for cooking, eating, sleeping, bathing, flushing, footsteps, calls and coins; background sounds (traffic, okadas, birds in the morning, crickets at night, your generator); and optional music, either matched to the language (🇬🇧 Eko Highlife, 🇳🇬 Naija Groove, 🇩🇪 Biergarten Waltz) or picked by hand (plus Lagos Lo-fi). **Passers-by** on the streets sometimes say something as you walk past (about the time of day, or if you look hungry, tired or broke); tap 👋 Reply for a little social boost. **🎥 View** on the right switches between the overhead camera and first person in your flat and on the streets.

## How to play (short)

- **Tap furniture** in your flat to use it (bed, burner, bucket, toilet…). Tap the floor to walk, drag to turn, pinch or scroll to zoom.
- **Top bar:** name, day and clock, where you are, days until rent, money, ❤️ health, 😄 mood, 💡 light, and your six needs.
- **Right side:** ❓ Help, 💬 Feedback, ❚❚ Pause, Speed.
- **Bottom dock:** 📍 Places · 🚌 Travel · 💼 Jobs · 🛒 Shop · ✈️ Goals · 👤 Me. Each opens a panel over the world; time waits while it's open.
- **🚶🏾 Walk outside** to walk the 3D streets, and **💼 Go to work** when you're near your job.
- The **🎯 Mission** card says what to do next: **How?** shows the steps, **👉 Show me** takes you there.
- The **💡 Tip** bubble reacts to what's happening (low needs, rent, NEPA, your job, the time of day).
- **Tags** on buttons: 💰 earns money · 📈 trains a skill · 💡 needs light · 🧺 uses a meal pack · 🔒 needs a skill · 🕒 closed · 🎯 your mission.

## Run it on your computer

```powershell
npm install      # once, or after package.json changes
npm run dev      # play at http://localhost:5173
npm test         # 69 tests: game rules, phone, sound, survival modes and translations
npm run build    # production build in the dist folder
```

## Where things live

| Folder | What's inside |
| --- | --- |
| `src/engine/` | The rules (`game.ts`), needs, health, money, saving, and `path.ts` (room grid, placement, pathfinding). No screen code. |
| `src/data/` | Content: actions, careers, places, events, traits, goals, and `home.ts` (floor plan, furniture, power, rent rules). |
| `src/three/` | 3D: `HouseView.ts` (your room), `pieces.ts` (furniture), `compound.js` (the yard and neighbours), `street.js` + `world.js` (the open-world streets). |
| `src/art/` | `art.js`: place pictures and the rides for the travel scene, drawn in code as SVG. |
| `src/screens/`, `src/components/` | What the player sees. `Game.tsx` is the one-screen layout; `RoomScene.tsx` and `StreetScene.tsx` are the full-screen 3D views. |
| `src/i18n/` | Languages: `en.ts` (English UI text), `de.ts` (German), `pcm.ts` (Pidgin), `text.ts` (game content by key). A test checks that every text exists in every language. |
| `src/lib/` | Accounts and cloud save (Supabase), ads, payments, sound. |
| `supabase/` | Database setup (`schema.sql`) and the Bachs payment functions. |
| `public/` | Icons, privacy policy, terms, hosting headers. |

## Tuning

- Furniture prices and sizes, power cuts, fuel use, eviction: `src/data/home.ts`
- What each piece of furniture lets you do: `src/data/actions.ts` (look for `uses:`)
- Places and opening hours: `src/data/spots.ts` · moods: `src/data/moodlets.ts`
- Missions, their steps and rewards: `src/data/missions.ts` · tips: `src/data/tips.ts` · help answers: `src/components/HelpSheet.tsx`
- Rent amount and start money: `src/engine/economy.ts`
- How fast you can die: `src/data/survival.ts`. **Relaxed survival** is on by default (slower clock, slower needs, gentler health loss, accidents and passing out instead of dying). Players can switch to Classic in 👤 Me → Settings. Kill switch: set `RELAXED_SURVIVAL = false` to remove it for everyone.
- Characters and looks: `src/data/characters.ts`
- Sounds for each action: `src/data/sounds.ts` · sound engine: `src/lib/audio.ts` · music loops: `src/lib/music.ts`
- What passers-by say: `src/data/chatter.ts` (personas and lines; the words are in the translation files as `chat.*`)
- Phone: funds `src/data/invest.ts`, businesses `src/data/business.ts`, contacts `src/data/contacts.ts`, invitations `src/data/invites.ts`, daily rewards `src/data/daily.ts`; rules in `src/engine/phone.ts`; level, status, achievements and score in `src/engine/progress.ts`
- Text in other languages: `src/i18n/de.ts` and `src/i18n/pcm.ts` (when you add or change English text, add the same key there too)

## Optional online features

Copy `.env.example` to `.env` and fill in what you've set up. Anything left empty is switched off, and the game still works offline.

| Feature | Needs |
| --- | --- |
| Accounts, cloud save, feedback, daily rewards (server time), global leaderboard | Supabase project + `supabase/schema.sql`. On an existing project run `supabase/update-2026-10-phone.sql` once in the SQL Editor |
| Visit statistics | Vercel → your project → Analytics → Enable (the code is already in `src/main.tsx`) |
| Rewarded ads | Google AdSense approval for H5 Games Ads |
| Supporter pack | Bachs account + `supabase/functions/bachs-checkout` and `bachs-webhook` |

## Publish

Push to a new GitHub repo, import it in Vercel (framework Vite, build `npm run build`, output `dist`), and connect Supabase. You can reuse the Hustle & Japa Supabase project: the tables are the same.


## Revive, Power Gems and the legal checklist

When a Sim collapses, the player can **watch an ad** (3 times per life, back with 45 health and a ₦3,000 hospital bill), **use a Power Gem** (full health, no bill), or **end the life**. Gems are sold in packs (1 for ₦300, 5 for ₦1,200, 12 for ₦2,500) through Bachs. The server holds the balance (`gem_wallets`, `gem_ledger`), so gems can't be faked or spent twice. Tuning: `src/data/revive.ts`. Server prices: `supabase/functions/_shared/bachs.ts` (a test checks they match).

To switch it on:
1. Run `supabase/update-2026-10-gems-privacy.sql` in the Supabase SQL Editor.
2. Deploy the functions: `npx supabase functions deploy bachs-checkout` and `npx supabase functions deploy bachs-webhook --no-verify-jwt`.
3. On Vercel set `VITE_PAYMENTS_ENABLED=true` and `VITE_ADSENSE_CLIENT=ca-pub-…`, then redeploy.
4. Fill in your details at the top of `public/legal.js`. Red boxes on the legal pages show what's missing.

| # | Item | Where |
|---|------|-------|
| 1 | Privacy policy | `public/privacy.html` |
| 2 | Terms of use | `public/terms.html` |
| 3 | Refund policy | `public/refunds.html` |
| 4 | Cookie policy | `public/cookies.html` |
| 5 | Cookie consent banner | `ConsentBanner.tsx`: age group first, equal buttons, nothing pre-ticked, changeable in 👤 Me |
| 6 | Form consents | Sign-in: terms and privacy box (plus a parent box for 13–15). Checkout: terms and refunds box plus an immediate-delivery waiver; both are checked again on the server and stored with the payment |
| 7 | No unnecessary data | No real names, birthdays or phone numbers; age group only, kept on the device |
| 8 | Third-party SDKs | Supabase (EU), Vercel Analytics (only with consent), Google AdSense (non-personalised unless the player is 16+ and says yes), Bachs (on its own page). Google Fonts removed; fonts are self-hosted |
| 9 | Dark patterns | No timers or countdowns on the revive screen, free option shown first, "End this life" always there, equal consent buttons |
| 10 | Hidden fees | Final naira price on the buy button; "no extra fees from us" |
| 11 | Fake reviews | None in the game or store text |
| 12 | Unsupported claims | Supporter pack "8 extra looks" matches `supporterAvatars`; "no cookies" for Vercel Analytics is accurate |
| 13 | Alt text | Emoji decorations are `aria-hidden`; 3D views have labels; progress bars named |
| 14 | Colour contrast | axe-core clean on the consent, revive, ending, Me and legal pages |
| 15 | Keyboard | Esc closes panels and the phone; focus moves into a panel and back |
| 16 | Business details | `public/imprint.html`, filled from `public/legal.js` |
| 17 | Kids' data | Under 13: no account or purchases. 13–15: parent box, child-directed ad tags. Under 18: parent box for purchases |
| 18 | Unsubscribe link | The game sends only sign-in emails (transactional). Any future newsletter must be opt-in, with an unsubscribe link |
| 19 | Fonts and images licensed | OFL fonts, MIT/MPL libraries, original code-made art and sound: `public/credits.html` |
| 20 | Data deletion | 👤 Me → Privacy & your data: download, delete on this device, delete account (`delete_my_account()`) |

These texts are a careful starting point, not legal advice. Have a lawyer check them before you sell gems in the EU or UK.

## Not finished yet

- **Friends rankings**: the tab is there, but it needs a friends system first.
- **Player-to-player messages**: Messages only has story messages with ready-made replies, so there is nothing to moderate yet. Real chat would need reporting, blocking and a word filter on the server.
- **Cheating**: the game runs on the player's device. The server checks every leaderboard update for numbers that are impossible by that day of the game and rate-limits updates, and players can't write the tables directly. Someone who carefully edits their own save could still post believable numbers; stopping that fully would need the game rules to run on the server.
