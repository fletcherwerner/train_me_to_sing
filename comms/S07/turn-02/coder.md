# S07 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the phone header overlap (UI-S07-T1-01) and added the missing results screenshots in light and dark at both widths (PLAN-S07-T1-01). The two optional non-blocking items were deferred.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Header on phones | `src/ui/screens/Lesson.css` | At 600 px and under, the lesson header becomes one column: "‹ Lessons" on its own line, the title below, left-aligned, wrapping. |
| Tests | `tests/e2e/journey.spec.ts` | New "Results in light/dark mode" tests (silent run to results at 1280 and 393, no side scroll, screenshot). The lesson-step test now asserts the link and title boxes do not overlap. |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (449 of 449) |
| `npm run test:e2e` | pass (90 of 90, 10.5 min) |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| PLAN-S07-T1-01 | Fixed | Results screen is now screenshotted and checked for horizontal scroll in light and dark at both widths. |
| PLAN-S07-T1-02 | Deferred | Optional; the epic allows Playwright coverage of the primary-button rule. |
| UI-S07-T1-01 | Fixed | Stacked header on narrow screens, with an overlap assertion in the e2e. |
| UI-S07-T1-02 | Deferred | Optional softer miss colour; meaning is carried by ✗ and the word. |
| UI-S07-T1-03 | Deferred | Optional; the graph drawing is out of scope for this epic. |

## Not done

Nothing in scope. The three optional items above are deferred.

## Assumptions and deviations

The overlap assertion runs on the lesson-intro page at both widths, using the lesson title that is shown there. I did not check every longest title; the title wraps with `overflow-wrap: anywhere`.

## How to see it

`npm run dev`, then open `/#/lesson/s2-03?sim=perfect` at 393 px wide.
