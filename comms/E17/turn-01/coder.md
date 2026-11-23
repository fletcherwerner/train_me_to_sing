# E17 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Built the run log, practice time, weekly goal and streak, the nine focus categories, "Focus next" on melody and Match results, the Progress screen (`#/progress`) and the Home ring. All four checks pass. `npm run ios:sync` was not run (needs Node 22, as in E16).

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Core insights | `src/core/insights/{types,history,activity,categories,runFocus,summary,record,practiceClock}.ts` | Pure. Thresholds in `THRESHOLDS` and the two minimums tables. |
| Spread | `scoring/spread.ts`, `evaluate.ts`, `matchScoring.ts`, `types.ts` | `spreadCents` on notes and match descriptions. No effect on scoring. |
| Storage | `schema.ts`, `store.ts`, `exportImport.ts`, `profileFormat.ts`, `profiles.ts` | Optional `history`, version stays 2. `recordAttempt(..., run?)` saves progress and run in one commit. `logRun`, `addPracticeSeconds`. Reset clears history. Merge/replace, profiles and profile sync carry it. |
| UI | `Progress.tsx/.css`, `WeekRing`, `RunFocus`, `Home.tsx`, `Lesson.tsx`, `MatchRun.tsx`, `Warmup.tsx`, `Practice.tsx`, `Settings.tsx`, `usePracticeTime.ts`, `routes.tsx` | Reset confirm text mentions history. |
| Tests | 7 new unit files under `src/core/insights`, `scoring/spread.test.ts`, `storage/history.test.ts`, `tests/e2e/insights.spec.ts` | Fixtures in existing tests gained `history`. |
| Docs | `docs/epic-notes/E17.md` | Lesson mapping and log size. |

Category → lesson: flat, sharp, high → s1a-02; unsteady, finding → s1a-01; sliding → s1a-03; leaps → s1b-06; drift → s1d-03; timing → s1b-04.

Log size: about 1 KB per run with notes; capped at 3,000 runs, so worst case a few MB; typical use is under 0.5 MB.

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass (0 errors) |
| `npm test` | pass (53 files, 600 tests) |
| `npm run test:e2e` | pass (120 of 120) |
| `npm run build` | pass |

## Response to findings

Turn 1: none.

## Not done

- `npm run ios:sync` not run (Node 20 here; needs 22).
- Not verified on a device or in the Simulator.
- The wrap-up part of Today's practice is not logged as a run (only a finished warm-up is).

## Assumptions and deviations

- The focus section replaces the melody `pickTip` line, except that the tip still shows when a note was a wrong octave, since that is not a category.
- Per-day "enough data" for patterns uses the run-level (scaled) minimums; the window uses the full ones.
- `drift` rate = runs drifting the commonest direction over qualifying runs.
- Lessons of two or three notes (below the 4-voiced-note minimum) get the positive line only; the slide tip no longer shows there. Specs `practice.spec.ts` and `hardening.spec.ts` were updated to check `run-focus` instead of `results-tip`.
- Time saves: ticking saves at 15 s or more; leaving, hiding and run end save any whole seconds.
- "Mastered recently" uses the latest proof date of a passed lesson.
- Seeded e2e uses "goal met this week, 3 days last week" (the epic's "goal met last week" with 3 days can't be met at a 4-day goal).

## How to see it

`npm run dev`, then Home (ring and "Progress" link) and `#/progress`. Use `?today=YYYY-MM-DD` and `?sim=flat40` for the review script.
