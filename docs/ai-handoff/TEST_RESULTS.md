# Test results (run locally, commit b0784f4 + changes)
| Command | Result |
|---|---|
| `npx tsc -b` | pass |
| `npx oxlint` | warnings only (react set-state-in-effect in src/screens/Game.tsx etc.); existed before, not introduced |
| `npx vitest run` | 17 files, 280 tests pass (incl. 9 new) |
| `npx vite build` | pass |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
Not run: Deno function execution, Bachs sandbox, CI on GitHub (first run is this PR).
