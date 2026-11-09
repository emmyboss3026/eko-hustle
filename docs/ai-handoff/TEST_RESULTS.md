# Test results (run locally, commit b0784f4 + changes)
| Command | Result |
|---|---|
| `npx tsc -b` | pass |
| `npx oxlint` | warnings only (react set-state-in-effect in src/screens/Game.tsx etc.); existed before, not introduced |
| `npx vitest run` | 17 files, 281 tests pass in 18 files (incl. 10 new) |
| `npx vite build` | pass |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
Not run: Deno function execution, Bachs sandbox, CI on GitHub (first run is this PR).
Not tested: live WebSocket flood against a running server (only the limiter is unit-tested).
After removing the runs board: tsc pass, vitest 281 pass, oxlint warnings only, vite build pass.
