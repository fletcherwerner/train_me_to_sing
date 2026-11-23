# S09 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Every match target (Unit A, Pitch finding) now listens for the full 8 s sing time, with a countdown bar and a per-target report line. Most of the work was done by the earlier interrupted attempt and was already committed. This turn reviewed it against the spec and ran all four checks.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Fixed sing time | `matchScoring.ts`, `MatchRun.tsx`, `content/types.ts` | `MATCH_SING_SEC` (renamed); `runTarget` runs to the end; optional `Lesson.singSec` |
| Countdown | `MatchRun.tsx` | `match-countdown` progressbar; "✓ Found it — keep holding" |
| How well | `matchScoring.ts`, `accuracy.ts` | `describeMatch`; accuracy now runs from the first voiced frame to the end |
| Report text | `describeReason.ts`, `MatchRun.tsx` | `describeMatchLine` and `describeCents` in the run list, results and Today's practice |
| Tests | unit tests, `stage1`, `accuracy` and `practice` e2e specs | updated for full-length targets |
| Notes | `docs/epic-notes/S09.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (477 of 477) |
| `npm run test:e2e` | pass (95 of 95, 15.4 min) |
| `npm run build` | pass |

## Response to findings

None (turn 1).

## Not done

Nothing.

## Assumptions and deviations

- `matchAccuracy` lost its outcome and holdSec parameters because the new definition does not use them.
- The results line no longer says "✓ hit/✗ miss"; it shows the S09 line plus accuracy.
- "mostly …" for non-matches uses the octave-folded median cents.
- I did not check the 393 px layout in the browser myself; the e2e specs cover it.

## How to see it

`npm run dev`, then open a Unit A lesson ("Find one note") or Today's practice, and sing or use `?sim=perfect`.
