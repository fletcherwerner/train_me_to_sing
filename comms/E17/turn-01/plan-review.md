# E17 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The run log, storage (optional `history`, version 2, export/import, profiles, reset), activity and streak, the nine categories, run focus, summary, Progress screen and Home ring are all in place and match the epic. All four checks pass, and the listed unit and Playwright tests exist. The only gap is a minor logging omission that the coder disclosed.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 53 files, 600 tests pass | Yes |
| `npm run test:e2e` | 120 of 120 pass | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| A. Run log, `logRun` in the same commit as `recordAttempt`, retention (8 weeks, 3,000 cap), export/import, profiles, reset | Yes | — |
| A. Warm-up logged; practice parts logged with `inPractice` | Partial (the wrap-up part isn't logged) | PLAN-E17-T1-01 |
| A. `spreadCents` in `evaluate` and match descriptions | Yes | — |
| B. Weeks, active days, streak | Yes | — |
| C. Categories, thresholds in one file, lesson mapping in the report | Yes | — |
| D. `runFocus`: at most 2 areas, 1 at Learn level, positive fallback | Yes | — |
| E. Today card, patterns, improvements, trend chart | Yes | — |
| F. Progress screen, Home ring, Progress link | Yes | — |
| Tests (unit, storage, e2e at both sizes) | Yes | — |
| `ios:sync` | Not run; needs Node 22, as disclosed | — |

## Findings

### PLAN-E17-T1-01 — Wrap-up part of Today's practice is not logged

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/screens/Practice.tsx`
- **Requirement:** E17 spec A: "`lessonId`: or 'warmup', 'practice:<part>' for unscored parts"; "Parts of Today's practice are logged by the same screens".
- **Problem:** The coder says an unscored wrap-up part is not recorded as a run. A day that only has a wrap-up would not count as active.
- **Change needed:** Log the wrap-up as `practice:<part>` when it finishes, or ask the owner to confirm that skipping it is intended.

## Previous findings

None (turn 1).

## Questions for the owner

None
