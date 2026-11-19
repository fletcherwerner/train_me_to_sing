# S07 — Turn 3 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the phone header overlap (UI-S07-T2-01). The turn-2 narrow-screen rule lost to `.page-header` in `index.css` because both had equal specificity. The rule is now `.page-header.lesson-header` and uses two columns (link, title) so the header stays one row.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Header on phones | `src/ui/screens/Lesson.css` | At 600 px and under: `.page-header.lesson-header` is `auto minmax(0, 1fr)`, the spacer is hidden, the title is left-aligned and wraps. |
| Test | `tests/e2e/journey.spec.ts` | On phone widths the lesson-step test now asserts the link's right edge is at or before the title's left edge, and that the computed grid has 2 columns. The 2-column check fails without the fix, because the old rule left 3 columns. |

My first attempt was a one-column stack. It made the header taller and broke `hardening.spec.ts` "run fits the window" for s3-01 and s3-04 (page 12 px too tall at 393 px). The two-column layout keeps the original height and those specs pass.

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
| UI-S07-T2-01 | Fixed | Specificity fixed, computed-layout assertion added at 393 px. |
| UI-S07-T2-02 | Deferred | Optional softer miss colour; the ✗ and the word carry the meaning. |
| UI-S07-T2-03 | Deferred | Optional; the graph drawing is outside this epic. |
| PLAN-S07-T1-02 | Deferred | Optional; the epic allows Playwright coverage of the primary-button rule. |

## Not done

Nothing in scope. The three optional items are deferred. I did not re-measure at 360 px; the grid has the same two columns there.

## Assumptions and deviations

None.

## How to see it

`npm run dev`, then open `/#/lesson/s2-03?sim=perfect` at 393 px wide.
