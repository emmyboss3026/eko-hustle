# Next steps
Needs owner approval: merge PRs; set `ALLOWED_ORIGINS`; redeploy bachs-checkout and bachs-webhook; sandbox test purchase.
Still to audit: all `supabase/*.sql` (RLS, SECURITY DEFINER, account deletion), `server/index.ts`, `server/city.ts`, `src/lib/multiplayer.ts` (auth, origin, rate limits, payload size), perf/a11y/i18n, the 6 private repos.
Not done on purpose: CLAUDE.md map growth (five places per update) and old-code commenting, kept out of this security PR; ask before adding.
