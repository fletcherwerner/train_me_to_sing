# S02 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Added a live scrolling pitch graph above the piano in I do / We do / You do, and a static whole-attempt graph on the results screen. Geometry is pure and unit tested. Verified with `sim=` sources only, not on a real iPhone or mic.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Geometry | `src/core/exercise/pitchGraph.ts`, `.test.ts` | bounds, mapping, segments, results bounds (C2–C6 cap), labels |
| Graph UI | `src/ui/components/PitchGraph.tsx`, `.css`, `.test.tsx` | live `PitchGraph`, static `ResultsGraph`, reduced-motion at 10 Hz |
| Lesson | `src/ui/screens/Lesson.tsx`, `Lesson.css` | graph above piano, frames kept in memory, sticky controls on phone |
| E2E | `tests/e2e/pitchGraph.spec.ts` | 1280 and 393 px |
| Notes | `docs/epic-notes/S02.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (244 of 244, before the final commit; no code changed after) |
| `npm run test:e2e` | pass (29 of 29) |
| `npm run build` | pass |

## Response to findings

None: turn 1.

## Not done

Nothing.

## Assumptions and deviations

- You do frames are held in `Lesson` state, not the session reducer, so the reducer and its tests are untouched. They are in memory only and cleared when You do runs again.
- ▲/▼ markers show when the latest frame (under 0.15 s old) is outside the axis.
- Results axis labels sit in a fixed column left of the scrolling box.
- The Stop button is kept visible on phones by making the controls row sticky at the bottom (under 700 px).

## How to see it

`npm run dev`, open a Stage 1 lesson (add `?sim=perfect` to try without a mic) and follow the S02 review script.
