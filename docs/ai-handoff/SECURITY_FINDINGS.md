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
