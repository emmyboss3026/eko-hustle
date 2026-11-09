# Changes made
- `supabase/functions/_shared/payment.ts` (new): pure `checkPayment()`: known product, uuid user, finite amount, NGN, not underpaid.
- `supabase/functions/_shared/payment.test.ts` (new): 9 tests (valid, string amount, overpay, missing/NaN/Infinity amount, underpay, currency, unknown/inherited product, bad metadata).
- `bachs-webhook/index.ts`: always reads the checkout from Bachs, then calls `checkPayment`; rejects with a log line, never a secret.
- `bachs-checkout/index.ts`: no `ALLOWED_ORIGINS` set now allows only http://localhost / 127.0.0.1.
- `.github/workflows/ci.yml` (new): tsc, oxlint, vitest, vite build, `npm audit` (high). Read-only token, actions pinned by SHA, no secrets.
**Deploy note:** set `ALLOWED_ORIGINS` in Supabase secrets to the live site origin BEFORE redeploying checkout, or real purchases will be refused. Webhook/checkout must be redeployed by the owner.
- `server/limits.ts` (new) + `server/limits.test.ts`: message limiter and its test.
- `server/index.ts`: connection cap, per-socket rate limit, try/catch around the message handler. Restart the multiplayer server after deploy.
