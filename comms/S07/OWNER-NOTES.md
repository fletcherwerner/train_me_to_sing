# S07 — Owner notes

## Turn 1 blocker (e2e environment): resolved, carry on

- The `vite` process on port **5173** is the owner's own `npm run dev`, started by hand in a terminal. It is not left over from a test run. Leave it alone; do not kill it.
- Playwright starts its own server on port **5174** (`playwright.config.ts`, `reuseExistingServer: true`). That port is free now, so `npm run test:e2e` can start normally.
- The full suite takes more than 10 minutes. Run it in the foreground with a long timeout, or run the specs you changed first (`npx playwright test tests/e2e/journey.spec.ts tests/e2e/practice.spec.ts ...`), then the full suite.
- This is not a reason to stop. Fix any failing specs and report the results; only report BLOCKED if a failure can't be fixed within this epic's scope.
