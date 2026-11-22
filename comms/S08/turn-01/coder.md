# S08 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Added an accuracy percentage (pure `accuracy.ts`), a stored `bestAccuracy` per lesson, and showed it on the lesson screen, results (You do and match lessons) and Home. Pass/fail is unchanged. All four checks pass.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Accuracy | `src/core/scoring/accuracy.ts`, `evaluate.ts`, `matchScoring.ts`, `types.ts` | `accuracyOf`, `matchAccuracy`; `accuracy` on `AttemptResult`, `NoteResult`, `MatchScore` |
| Storage | `schema.ts`, `store.ts`, `exportImport.ts` | optional `bestAccuracy`, max on record and merge; no version bump |
| UI | `BestAccuracy.tsx`, `Lesson.tsx`, `MatchRun.tsx`, `LessonHeader.tsx`, `SequenceStrip.tsx`, `Home.tsx`, `Lesson.css` | best line, results line, per-note "✓ hit · 94%", Home status |
| Tests | `accuracy.test.ts`, `scoring.test.ts`, `matchScoring.test.ts`, `progress.test.ts`, `exportImport.test.ts`, `profiles.test.ts`, `tests/e2e/accuracy.spec.ts` (1280 and 393 px) | `home.spec.ts` and `hardening.spec.ts` updated for new text |
| Notes | `docs/epic-notes/S08.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (466 of 466) |
| `npm run test:e2e` | pass (94 of 94) |
| `npm run build` | pass |

## Response to findings

None (turn 1).

## Not done

Nothing.

## Assumptions and deviations

- The synthetic singer reads pitch one frame ahead of the recorded time, so `sim=perfect` gives 98–100%, not exactly 100%. The e2e specs accept 98–100% and check the stored best equals what results showed (spec said "100%").
- `accuracy` is optional on `AttemptResult`/`NoteResult` so older hand-built results still type-check.
- Profile load is a replace, not a merge; the field survives via the shared schema (tested).
- Intro shows the best line under the goal; other steps show it under the title inside the header (a separate line pushed phone run screens past the window in `hardening.spec.ts`).
- Home with no `bestAccuracy`: "Passed", "Passed once — …", or "Started" (no percentage).
- Match results show per-target accuracy in the result list line (`note-accuracy-<i>`), as match lessons have no chips.

## How to see it

`npm run dev`, open a lesson (e.g. `#/lesson/s1b-04?sim=perfect`), run You do; then `?sim=flat40`. Match lesson: `#/lesson/s1a-02?sim=perfect`.
