# E08 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the three blocking UI findings: the calibration run now shows the count-in and click number with a Stop button, the delay slider is full width with a 44 px thumb, and the calibration screen has a Home link plus a sim hook that reaches Save/Retry. Small non-blocking fixes were also made.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Calibration run | `src/ui/screens/Calibrate.tsx` | Visible "Count-in n of 4" / "Click n of 8" with pulse, Stop button, Home link, `?sim=calibrate:<ms>` hook |
| Settings slider | `src/ui/screens/Settings.tsx`, `src/index.css` | Full-width slider, 44 px thumb, −10/+10 buttons, "Range 0–500 ms" |
| Home note | `src/ui/screens/Home.tsx` | "Calibrate timing" is now a link |
| E2E | `tests/e2e/stage2.spec.ts` | New test: run shows progress, Stop, then Save/Retry reached |
| Notes | `docs/epic-notes/E08.md` | Turn 2 additions |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (157 of 157) |
| `npm run test:e2e` | pass (20 of 20) |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| PLAN-E08-T1-01 | Fixed | Interpretation recorded in epic notes. |
| UI-E08-T1-01 | Fixed | Visible count-in and click counter, Stop button stops clicks and mic. |
| UI-E08-T1-02 | Fixed | Slider 100% width, 44 px thumb and height, −10/+10 buttons, range label. |
| UI-E08-T1-03 | Fixed | Home link added (links are 48 px via `tap-link`). `?sim=calibrate:200` produces a measurement so the Save/Retry screen is reachable. |
| UI-E08-T1-04 | Deferred | Row layout and lock icon belong to the Home layout; not a small change. |
| UI-E08-T1-05 | Deferred | Styling of Calibrate/Settings buttons left to a later polish epic. |
| UI-E08-T1-06 | Fixed | Home Stage 2 note links to `/settings/calibrate`. |

## Not done

Nothing in the epic scope. Findings 04 and 05 are deferred as above.

## Assumptions and deviations

The sim hook is only active with `sim=calibrate:<ms>` in the URL. It is not a new dependency.

## How to see it

`/#/settings/calibrate?sim=calibrate:200`, then Start; `/#/settings` for the slider.
