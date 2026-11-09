# Security findings

| # | Sev | Finding | File | Status |
|---|---|---|---|---|
| 1 | High | Webhook: missing `amount` fell back to the product price, so an event without an amount was treated as fully paid. | supabase/functions/bachs-webhook/index.ts | Fixed |
| 2 | High | Webhook: non-finite amount (NaN/Infinity) skipped the underpayment check. | same | Fixed |
| 3 | Medium | Webhook: currency never checked (an equal number in another currency would pass). | same | Fixed (must be NGN) |
| 4 | Medium | Webhook: player/product taken from the event body when present; now read from Bachs's checkout record first. | same | Fixed |
| 5 | Medium | Checkout: empty `ALLOWED_ORIGINS` allowed any return origin. | supabase/functions/bachs-checkout/index.ts | Fixed (empty = localhost only) |
| 6 | Info | Duplicate credit: `grant_gems` already dedupes on `gem_ledger.reference` (unique). Supporter flag is idempotent. | supabase/update-2026-10-gems-privacy.sql | OK, no change |
| 7 | Info | Signature check (HMAC-SHA256, 300 s window, constant-time compare) looks sound. Checked against the code only, not Bachs docs. | webhook | OK |

Unverified: Bachs response field names (`amount`, `currency`, `status`). The code reads `data.amount` and `data.currency` from the signed event, as the old code read `data.amount`. Confirm against Bachs docs/sandbox before deploying: if the field is absent or named differently, payments will be refused (fails safe).

## Multiplayer server (server/index.ts, server/city.ts)
| # | Sev | Finding | Status |
|---|---|---|---|
| 8 | Medium | No per-connection message limit: a socket could flood JSON parsing/handlers. | Fixed: 60 msgs/s then close 4008 (client sends ~10/s) |
| 9 | Medium | No cap on open sockets. | Fixed: `MAX_CONNECTIONS` (default 500), close 1013. Per-IP cap NOT added (a proxy would make all players one IP). |
| 10 | Medium | Async message handler had no try/catch: an exception on odd input is an unhandled rejection that can kill Node. | Fixed: caught, socket closed |
| 11 | Info | Already good: 4 KB maxPayload, origin allowlist, token check via Supabase, 5 s hello timeout, home entry via `can_enter_home`, name/look/car/chat sanitising and speed/strike kick in city.ts. | OK |

## Database (supabase/*.sql), read in full for policies, grants and definer functions
| # | Sev | Finding | Status |
|---|---|---|---|
| 12 | Medium | `runs` leaderboard could be forged by any signed-in player (direct insert). | Fixed (owner chose retire): client code and UI removed; `update-2026-11-hardening.sql` drops the runs policies and revokes table grants (NOT applied). Old rows kept. |
| 13 | Low | `saves.state` had no size limit. | Migration `update-2026-11-hardening.sql` (NOT applied) |
| 14 | Low | `feedback` accepts anonymous inserts with no rate limit (spam). Use Supabase rate limits/captcha. | Open |
| 15 | Info | OK: RLS on in all 23 tables; `profiles.supporter` not updatable by players; `payments`, `gem_ledger`, wallets, friends, DMs, reports have no player write access; every `security definer` function sets `search_path` and has execute revoked from public/anon (only `leaderboard` is anon, on purpose); `grant_gems`/`refund_gems` service-role only; `use_gem` locks the wallet and the ledger reference is unique, so no double spend; `delete_my_account` handles the nullable payments user. | OK |
Limits of this review: read by eye, nothing executed against Postgres; the RPC bodies for friends/DMs/voice/home layouts were checked for auth guards and grants, not line by line for logic errors.
