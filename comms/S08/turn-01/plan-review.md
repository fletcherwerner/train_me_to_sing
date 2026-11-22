# S08 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The work meets the epic. `accuracy.ts` follows the closeness rule, and `evaluateAttempt`, `scoreMatch` and storage carry the new field. The lesson screen, results, match results and Home show it. Pass/fail is unchanged. All four checks pass. Two small deviations are non-blocking.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 466 of 466 pass | Yes |
| `npm run test:e2e` | 94 of 94 pass | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| A. closeness rule, per-note mean, equal note weight, scoop skip | Yes | PLAN-S08-T1-01 (signature only) |
| A. `accuracyOf` result, `accuracy` on AttemptResult/NoteResult/MatchScore | Yes | — |
| A. match lessons: first voiced frame to match or timeout | Yes | — |
| A. constants at top of file | Yes | — |
| B. optional `bestAccuracy`, max on record, no version bump | Yes | — |
| B. export/import merge takes the higher value | Yes | — |
| B. profile load keeps the field | Yes | — |
| C. best-accuracy line on the intro and in the header of every step | Yes | — |
| C. results line: New best, was, Best | Yes | — |
| C. notes line drops its percentage and shows the pass mark | Yes | — |
| C. per-note accuracy, `note-accuracy-<i>` | Yes | — |
| D. Home status shows best accuracy and has no `bestScore` fallback | Yes | — |
| Tests (unit, storage, Playwright at 1280 and 393 px) | Yes | PLAN-S08-T1-02 |

## Findings

### PLAN-S08-T1-01 — `accuracyOf` has no `opts` parameter and duplicates the scoop constant

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/core/scoring/accuracy.ts:11,41`
- **Requirement:** epic S08 section A: "`accuracyOf(ex, frames, opts)` ... the same window `evaluateAttempt` uses".
- **Problem:** The signature has no `opts`. `SCOOP_SEC` is a second copy of the value in `evaluate.ts`, so the two windows could drift apart.
- **Change needed:** Export one shared constant (or window helper) and import it in both files. Accept `opts` if a caller needs it.

### PLAN-S08-T1-02 — e2e accepts 98–100% instead of 100% for `sim=perfect`

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `tests/e2e/accuracy.spec.ts`
- **Requirement:** epic S08 Tests: "results show 'Accuracy: 100% — New best!'".
- **Problem:** The synthetic singer reads one frame early, so the result is 98–100%. The coder documented this.
- **Change needed:** None required. Optionally align the simulator offset in a later epic.

## Previous findings

None (turn 1).

## Questions for the owner

None
