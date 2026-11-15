# E09 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Added the five Stage 3 songs with lyrics and phrases, a "now singing" lyric line, a phrase selector for I do / We do, a three-row auto-scrolling sequence strip, and results grouped by line. Melodies are exactly as in the catalog; none has been listened to, so the owner must check them by ear.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Content | `src/content/builtin/stage3.ts`, `registry.ts`, `makeLesson.ts` | s3-01..s3-05, tolerances t3/t3/t3/t4/t4, phrases per song |
| Core | `core/exercise/types.ts`, `core/exercise/phrases.ts` | `Phrase`, optional `phrases`, `slicePhrase`, `phraseFor`, `linesFromLengths` |
| UI | `NowSinging.tsx/.css`, `SequenceStrip.tsx/.css`, `Lesson.tsx/.css` | lyric line, phrase selector, strip capped at 3 rows and self-scrolling, "Line n: k missed" in results |
| Tests | `phrases.test.ts`, `content/stage3.test.ts`, `NowSinging.test.tsx`, `tests/e2e/stage3.spec.ts` | beats 16/32/32/48/32, phrase coverage, slicePhrase, e2e Line 1 and s3-01 pass, grouped misses |
| Notes | `docs/epic-notes/E09.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (197 of 197) |
| `npm run test:e2e` | pass (22 of 22) |
| `npm run build` | pass |

## Response to findings

Turn 1: no earlier findings.

## Not done

Nothing in scope is missing. Not verified: the melodies by ear, and the iPhone no-page-scroll fit (needs a device).

## Assumptions and deviations

- Only Twinkle's phrases were specified (6 × 7). Others follow lyric lines: Hot Cross Buns 3/3/8/3, Mary 7/6/7/6, Ode 15/15, Frère Jacques 8/6/12/6.
- Chips are now a fixed 56px high so "three rows" has a definite height (176px).
- A We do result shows on the strip only for the phrase it was run on. Phrase scores are never saved.
- Added `phrases.ts` as a new core file; the content-dependent tests sit in `src/content/` so `core/` imports nothing outside itself.

## How to see it

`npm run dev`, then Home → Stage 3 → any song. In I do or We do use "Practise" to pick a line. For automatic runs use `/#/lesson/s3-01?sim=perfect`.
