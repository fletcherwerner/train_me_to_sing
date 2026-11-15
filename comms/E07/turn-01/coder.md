# E07 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Added the lesson registry, the eight Stage 1 lessons, saved progress, and the Home and Settings screens. `demoLesson` is removed and `/lesson/:id` now uses `getLesson`. All four checks pass.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Content | `src/content/makeLesson.ts`, `builtin/stage1.ts`, `registry.ts` | Eight lessons built with `makeLesson`. The registry merges sources and sorts by stage, then order. |
| Progress | `src/storage/store.ts` | `recordAttempt` and `resetProgress`. Best score and passed never go down. |
| Lesson screen | `src/ui/screens/Lesson.tsx` | Uses `getLesson`, calls `recordAttempt` on You do results, shows "Lesson not found" with a Home link. |
| Home | `Home.tsx`, `Home.css` | Header with range and Settings link, Continue card, stage sections with "N of M passed", status rows, disabled rows with the reason. |
| Settings | `Settings.tsx`, `routes.tsx` | Range, Redo range test, Reset progress with confirmation, dev links. |
| Tests | `content.test.ts`, `progress.test.ts`, `tests/e2e/home.spec.ts`; `lesson.spec.ts` and `range.spec.ts` updated | Existing specs use `s1-05`. The range spec now finds "Redo range test" in Settings. |
| Notes | `docs/epic-notes/E07.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (113 of 113) |
| `npm run test:e2e` | pass (17 of 17) |
| `npm run build` | pass |

## Response to findings

None: this is turn 1.

## Not done

Nothing. The `src/content/.gitkeep` file was left in place.

## Assumptions and deviations

- `makeLesson` is in its own file so later stages can reuse it.
- "Redo range test" moved from Home to Settings, as the epic says.
- Home and Settings links keep the `?sim=` query for simulated runs. The Lesson screen's own Home link does not keep it.
- Goals for s1-02 to s1-08 are my wording.
- The Continue card is hidden when every fitting lesson is passed.
- I have not done the iPhone steps in the review script.

## How to see it

`npm run dev`, then open `/#/`. Settings is at `/#/settings`.
