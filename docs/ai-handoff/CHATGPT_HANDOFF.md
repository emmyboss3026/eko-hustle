# Handoff for ChatGPT
GitHub is the shared source; nothing syncs automatically.
- eko-hustle, branch `security/payment-validation`, base `main` (b0784f4). Files: see CHANGES_MADE.md.
- prepwise, branch `fix/restore-source` (73cee6f), PR prepwise#1.
Verify independently:
1. `npm ci && npx tsc -b && npx oxlint && npx vitest run && npx vite build`
2. Read `supabase/functions/_shared/payment.ts` and its caller in `bachs-webhook/index.ts`; confirm Bachs docs use `data.amount` and `data.currency` on `checkout.completed`.
3. Confirm no path delivers goods without a valid signature + passing `checkPayment`.
4. Review what is NOT covered (NEXT_STEPS.md). No credentials are in these files.
