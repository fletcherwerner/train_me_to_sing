# E14 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Stage 1 is replaced by 19 new lessons in four units. Unit A is a new match-the-note screen. Units B–D run through Learn, Practise and Prove, with a new key per Practise/Prove attempt. A lesson passes only at Prove. Echo yourself works for Units A and B. Old `s1-01`…`s1-08` progress is dropped, with a one-time Home notice. Echo with a real microphone could not be tested here; only the synthetic take path is covered by Playwright.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Content model and Stage 1 | `src/content/types.ts`, `makeLesson.ts`, `builtin/stage1.ts`, `importedSource.ts` | New `kind`, `unit`, `levels`, `echo` and match fields. 19 new lessons. Stages 2–3 and imported lessons are `melody`, no levels. |
| Core | `core/exercise/fit.ts`, `core/scoring/matchScoring.ts`, `core/scoring/bestTake.ts`, `core/session/sessionMachine.ts` | `fit` opts and `pickTonic`; `matchTarget`, `scoreMatch`, `placeTarget`; echo qualification; `Level`, `ADVANCE`, `STEP_DOWN`. |
| Storage | `storage/schema.ts`, `store.ts`, `exportImport.ts`, `level.ts`, `notices.ts` | Optional `level` on progress. Legacy progress is dropped on load, import and profile load. |
| Audio | `audio/takeRecorder.ts`, `exercisePlayer.ts`, `pitch/*` | MediaRecorder take (`audio/mp4` preferred), buffer playback, `getStream`, sim helpers. |
| UI | `screens/Lesson.tsx`, `MatchRun.tsx`, `Home.tsx`, `components/LessonHeader.tsx`, CSS | Levels, keys per attempt, match screen, echo, unit grouping, notice. |
| Tests | `matchScoring.test.ts`, `fit.test.ts`, `sessionMachine.test.ts`, `legacyProgress.test.ts`, `content.test.ts`, `tests/e2e/stage1.spec.ts`, plus id moves in existing specs | Existing e2e specs moved to the new ids. |
| Notes | `docs/epic-notes/E14.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass (0 errors) |
| `npm test` | pass (379 of 379) |
| `npm run test:e2e` | pass (70 of 70) |
| `npm run build` | pass |

## Response to findings

Turn 1: none.

## Not done

Nothing in scope is missing. Echo with a real microphone was not exercised (no mic in the test browser).

## Assumptions and deviations

- Match `timeToMatchSec` is measured from the start of listening to the start of the matching hold. A pitch gap of at most 0.15 s does not restart a hold.
- Passing Learn or Practise reads "Level passed"; only Prove (or a non-levelled lesson) reads "Passed".
- Existing e2e tests that needed a lesson to read "Passed" (profiles, home) now use `s2-01`, since a Stage 1 lesson needs three levels to pass.
- Unit A echo plays the matched hold only (about 1 s).
- A We do take only fills an empty echo slot or replaces an older We do take. A You do take replaces any.
- `PitchSource` gained an optional `getStream()`. No new dependencies.

## How to see it

`npm run dev`, then Home. Use `?sim=perfect` for a simulated singer, for example `/#/lesson/s1b-04?sim=perfect`. Add `&key=random` to see the key change between attempts.
