# S07 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

The forward-pointing primary buttons, results "Next lesson" / "Back to lessons", the "‹ Lessons" header link, the step progress bar and the token-based lighter look are built and committed. This redo re-ran the full e2e suite as the owner's notes asked: all 88 specs pass. I could not reproduce the owner's 43 failures; code is unchanged from the earlier commit.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Next-lesson rule | `src/core/progress/next.ts`, `next.test.ts` | `nextLesson` (Home tag) and `nextLessonAfter` (results); skips mastered, non-fitting, imported; wraps round |
| Lesson steps | `src/ui/screens/Lesson.tsx` | "Next: We do" / "Next: You do" primary after one run; "Play again" / "Sing along again"; step bar; `.lesson-meta` block |
| Results | `Lesson.tsx`, `MatchRun.tsx`, `ResultsNav.tsx` | `next-lesson`, `back-to-lessons`; "Come back tomorrow to finish this one."; `embedded` hides both |
| Header link | `BackLink.tsx`, `LessonHeader.tsx`, Settings, MicCheck, ImportMidi, Calibrate, RangeSetup | "‹ Lessons", accessible name "Back to lessons" |
| Home | `Home.tsx`, `ProgressBar.tsx` | "Next" tag and left border, progress bars under headings |
| Styles | `index.css`, `Home.css`, `Lesson.css`, `Practice.css`, `ImportMidi.css` | Tokens with dark values, cards, pills, buttons |
| Tests | `tests/e2e/journey.spec.ts` (new), `practice.spec.ts` and 9 other specs | Renamed lookups; embedded-practice assertions |
| Notes | `docs/epic-notes/S07.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (449 of 449) |
| `npm run test:e2e` | pass (88 of 88), run in foreground in three batches of spec files (21, 31, 36). One spec, `stage1.spec.ts:285`, timed out once in the 36-spec batch (8 min, under load); it passed alone and the whole `stage1.spec.ts` file passed (17 of 17) on re-run. The batches were not one single `npm run test:e2e` invocation: one full run was stopped by the background time limit. |
| `npm run build` | pass |

## Response to findings

None: turn 1.

## Not done

- Results screens are not screenshotted in dark mode (Home and a lesson step are).
- No `Lesson` component unit test (the screen needs audio); Playwright covers the button rules.

## Assumptions and deviations

- The owner's reported failures (exercise.spec.ts:17, "Play again" timeouts, Range test "A2") did not reproduce: these specs pass here. They may have come from load (owner's dev server plus a parallel run) or a stale build; if they recur, send the failing log.
- `dev-page` kept, not renamed (many selectors use it).
- Added `--border-strong` for controls: a light-grey `--border` cannot reach 3:1 on white.
- `--success` is a darker green than the hit-note fill so text meets 4.5:1.
- Forward button is placed first with CSS `order: -1`, not DOM order.
- Same next-step buttons applied to Unit A match results (`MatchRun`).

## How to see it

`npm run dev`; open Home, then a lesson (for example `s2-03`); try `?sim=perfect` and `?sim=silent`; switch the OS between light and dark.
