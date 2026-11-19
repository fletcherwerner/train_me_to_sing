# S07 — Turn 1 — Plan Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 1

## Summary

The code meets nearly all of the epic. The forward-pointing primaries, `nextLesson` and `nextLessonAfter`, the results actions, the embedded handling, the "‹ Lessons" link, the step progress bar and the tokens are all present and match the plan. One listed test is missing: the dark-mode screenshot of the results screen. All four commands pass, and I confirmed the e2e result myself.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | pass, 449 of 449 | Yes |
| `npm run test:e2e` | pass, 88 of 88 (10.4 min, one invocation) | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| A. Primary per step and state, "Play again" / "Sing along again", `run-button` kept | Yes | — |
| B. Results table, `next-lesson`, `back-to-lessons`, "Come back tomorrow to finish this one." | Yes | — |
| B. `nextLessonAfter` and `nextLesson` in `src/core/progress/next.ts` | Yes | — |
| B. Embedded hides Next lesson and Back to lessons | Yes | — |
| C. Header link, progress bar with ✓, meta block | Yes | — |
| C. Same link on Mic check, Settings, Import and the range test | Yes | — |
| D. Tokens, cards, pills, Next tag, heading progress bars, verdict ✓ | Yes | — |
| D. `dev-page` kept; the epic allows this | Yes | — |
| Test: `next.test.ts` | Yes | — |
| Test: unit test of the Lesson primary buttons | Partial | PLAN-S07-T1-02 |
| Test: Playwright journey at 1280 and 393, silent, practice, header | Yes | — |
| Test: light and dark screenshots of Home, a lesson step and results | Partial | PLAN-S07-T1-01 |

## Findings

### PLAN-S07-T1-01 — No dark-mode screenshot of the results screen

- **Severity:** Blocking
- **Status:** Open
- **Where:** `tests/e2e/journey.spec.ts:113-146`
- **Requirement:** `planning/epics/S07-ui-journey.md`, Tests: "Light and dark (`colorScheme: 'dark'`): screenshots of Home, a lesson step and results; no horizontal scroll." The coder report admits results are not screenshotted in dark mode.
- **Problem:** The light/dark test covers Home and a lesson step only. The results screen is not checked in either scheme, and its horizontal scroll is not checked.
- **Change needed:** Extend the light/dark test, or add one, so that it runs a `sim=perfect` or `sim=silent` lesson to results in each scheme and at both widths. It should take a screenshot and assert no horizontal scroll.

### PLAN-S07-T1-02 — No unit test of the primary-button rule

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/screens/Lesson.tsx:815-850`
- **Requirement:** `planning/epics/S07-ui-journey.md`, Tests: "Unit (`Lesson` / component tests where they exist)".
- **Problem:** No Lesson component test exists, and the screen needs audio. Playwright covers the rule, and the epic's wording allows this.
- **Change needed:** Optional. If it is cheap, extract the primary-choice logic into a pure function and test it.

## Previous findings

None: turn 1.

## Questions for the owner

None
