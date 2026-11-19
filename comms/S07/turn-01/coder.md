# S07 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

The forward-pointing primary buttons, the results "Next lesson" / "Back to lessons" logic, the "‹ Lessons" header link, the step bar and the lighter token-based look are built. **The full Playwright suite did not complete** (see Checks), so the e2e specs I changed and added are not confirmed passing. Reviewers should run `npm run test:e2e` first.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Next-lesson rule | `src/core/progress/next.ts`, `next.test.ts` | `nextLesson` (Home tag) and `nextLessonAfter` (results); skips mastered, non-fitting, imported; wraps round |
| Lesson steps | `src/ui/screens/Lesson.tsx` | "Next: We do" / "Next: You do" become primary after one run; "Play again" / "Sing along again"; step bar; `.lesson-meta` block |
| Results | `Lesson.tsx`, `MatchRun.tsx`, `src/ui/components/ResultsNav.tsx` | `next-lesson`, `back-to-lessons`; "Come back tomorrow to finish this one."; `embedded` prop hides both and drops all primaries except practice's "Next part" |
| Header link | `BackLink.tsx`, `LessonHeader.tsx`, Settings, MicCheck, ImportMidi, Calibrate, RangeSetup | "‹ Lessons", accessible name "Back to lessons" |
| Home | `Home.tsx`, `ProgressBar.tsx` | "Next" tag and left border on recommended row, progress bars under stage/unit counts |
| Styles | `index.css`, `Home.css`, `Lesson.css`, `Practice.css`, `ImportMidi.css` | Tokens with dark values, cards, pills, buttons |
| Tests | `tests/e2e/journey.spec.ts` (new), `practice.spec.ts`, and 9 other specs | Renamed "Repeat"/"Home"/"Next" lookups; embedded-practice assertions |
| Notes | `docs/epic-notes/S07.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (449 of 449) |
| `npm run test:e2e` | fail: did not complete, no pass/fail for the suite. Run 1 was killed by the 10-minute background limit after ~78 tests with no failures seen (log checked only for failure markers). Run 2 stopped at once with `Timed out waiting 180000ms from config.webServer`; a `vite` process from an earlier run was still alive and I could not inspect or safely kill it. No pass/fail result for the suite. |
| `npm run build` | pass |

## Response to findings

None: turn 1.

## Not done

- Full e2e confirmation (above). `journey.spec.ts` has never been run to completion.
- Results screens are not screenshotted in dark mode.
- No `Lesson` component unit test (the screen needs audio); Playwright covers the button rules.

## Assumptions and deviations

- `dev-page` kept, not renamed (many selectors use it).
- Added `--border-strong` for controls: a light-grey `--border` cannot reach 3:1 on white.
- `--success` is a darker green than the hit-note fill so text meets 4.5:1.
- Forward button is placed first with CSS `order: -1`, not DOM order.
- Same next-step buttons applied to Unit A match results (`MatchRun`).

## How to see it

`npm run dev`; open Home, then a lesson (for example Stage 2, `s2-03`); try `?sim=perfect` and `?sim=silent`; switch the OS between light and dark.
