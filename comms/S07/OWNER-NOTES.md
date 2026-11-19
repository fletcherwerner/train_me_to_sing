# S07 — Owner notes

## Turn 1 blocker (e2e environment): resolved, carry on

- The `vite` process on port **5173** is the owner's own `npm run dev`, started by hand in a terminal. It is not left over from a test run. Leave it alone; do not kill it.
- Playwright starts its own server on port **5174** (`playwright.config.ts`, `reuseExistingServer: true`). That port is free now, so `npm run test:e2e` can start normally.
- The full suite takes more than 10 minutes. Run it in the foreground with a long timeout, or run the specs you changed first (`npx playwright test tests/e2e/journey.spec.ts tests/e2e/practice.spec.ts ...`), then the full suite.
- This is not a reason to stop. Fix any failing specs and report the results; only report BLOCKED if a failure can't be fixed within this epic's scope.

## Owner's e2e run on `epic/S07` (turn 1 code), stopped at 68 of 88

43 failures so far, so this is a real problem, not only the environment. The pattern points at runs never finishing:

- `exercise.spec.ts:17`: playback never marks `chip-0` active.
- Many specs time out waiting for "Play again" / "Sing along again" after a run, or for `results-verdict`.
- Range test specs never show "Lowest note: A2".

Check first whether playback or the run end broke (for example the run-button state or a renamed label the run logic relies on), then fix the specs. Full log of the failing tests: run `npx playwright test tests/e2e/exercise.spec.ts` to reproduce quickly.

## Resume (2026-11-18)

The driver could not resume a coder blocker before `510a2ca`; that is fixed. Redo turn 1 using the notes above.
