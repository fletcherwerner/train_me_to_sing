# S09 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The code implements the S09 specification. Every match target now listens for the full sing time and shows a countdown. `describeMatch` is pure and covers the cases the spec lists. Per-target lines appear in the run list, the results and Today's practice. I found no blocking problems. I did not finish my own e2e run (see below).

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | pass, 477 of 477 | Yes |
| `npm run test:e2e` | Not run in full. I started `stage1.spec.ts` and `practice.spec.ts` (the specs that cover S09) but they had not finished when I wrote this. | Not verified |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| A. `MATCH_SING_SEC` renamed, 8 s | Yes | — |
| A. `runTarget` waits for the full time and judges once at the end | Yes (`MatchRun.tsx:250-260`) | — |
| A. Optional `Lesson.singSec` | Yes (`content/types.ts:41`) | — |
| A. Countdown `match-countdown`, `role="progressbar"` | Yes (`MatchRun.tsx:515`) | — |
| A. Status text and "✓ Found it — keep holding" | Yes | — |
| B. `describeMatch` fields and rules | Yes (`matchScoring.ts:118-146`) | — |
| B. Accuracy from the first voiced frame to the end of the sing time | Yes (`accuracy.ts:55`) | PLAN-S09-T1-01 |
| C. Line text and cents wording | Yes (`describeReason.ts`) | — |
| C. Results keep "matched X of N" plus accuracy; same lines in Today's practice | Yes (`MatchRun.tsx:450-503`) | — |
| Unit tests for `describeMatch`, including wrong octave and slid, with `matchTarget` unchanged | Yes | — |
| Playwright: the perfect, flat40, silent and Today's practice cases, at 1280 and 393 px | Present in the specs. I did not see them pass. | — |

## Findings

### PLAN-S09-T1-01 — e2e not independently confirmed

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `tests/e2e/stage1.spec.ts`, `tests/e2e/practice.spec.ts`
- **Requirement:** `README.md`, section 5, and the plan-review instructions: run `npm run test:e2e`.
- **Problem:** My Playwright run was still going when I wrote this, so I could not confirm the coder's 95 of 95. The spec assertions I read (the 7.5 s lower bound, the countdown, "Found in" lines, `sim=silent` giving 0 matched) match the epic.
- **Change needed:** None for the coder. The driver's own gates should confirm the e2e result.

## Previous findings

Turn 1, so there are none.

## Questions for the owner

None
