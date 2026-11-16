# E10 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The PWA, Pages workflow, export/import and iOS polish match the epic's specification, and the listed tests exist and pass. The only gaps are device checks the coder could not do, and one small unverified item (sub-path hosting).

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 207 of 207 pass | Yes |
| `npm run test:e2e` | 26 of 26 pass | Yes |
| `npm run build` | pass; manifest, `sw.js`, 15 precache entries | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| vite-plugin-pwa, autoUpdate, precache | Yes | — |
| Manifest fields and 3 icons (192, 512, maskable) | Yes | — |
| index.html apple tags, viewport-fit=cover | Yes | — |
| Update banner | Yes | — |
| Pages workflow (install, lint, test, build, deploy) | Yes | — |
| base './' and sub-path scope check | Partial | PLAN-E10-T1-01 |
| exportData / filename / Web Share with download fallback | Yes | — |
| Import validation, summary, Replace/Merge | Yes | — |
| Merge rules, latency never imported | Yes | — |
| Safe areas, touch-action, user-select | Yes | — |
| Wake lock during run | Yes | — |
| visibilitychange pause with message | Yes | — |
| Mic permission notes | Partial (unverified on device, recorded as such) | — |
| Tests: merge, round trip, invalid, build output, offline e2e | Yes | — |

## Findings

### PLAN-E10-T1-01 — Sub-path hosting not exercised

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `tests/e2e/offline.spec.ts`
- **Requirement:** `planning/epics/E10-pwa-export.md`, Hosting: "Verify assets and the service worker scope load correctly under `/<repo-name>/`."
- **Problem:** The offline test serves from the root. The relative `base` and the `./` scope should work under a sub-path, but nothing checks it.
- **Change needed:** Optional. Serve `dist/` under a sub-path once, or confirm it on the first Pages deploy.

## Previous findings

None (turn 1).

## Questions for the owner

None
