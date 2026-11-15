# E04 — Turn 3 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Turn 2's commit contained only the report; the source fixes were never made. This turn makes them in `src/` and commits them. I did not capture the count-in and mid-play states; the owner should check them by hand.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Tap targets | `src/index.css` | `.dev-page` button, input and select get `min-height: 48px; min-width: 48px` at all widths. `.tap-link` and `.dev-home` get 48 px height and width. |
| Keyboard cap | `src/index.css` | `.dev-page .piano { max-height: 180px; }` |
| Pre-roll phase | `src/ui/hooks/usePlaybackPosition.ts`, `src/ui/screens/dev/ExerciseDev.tsx` | New optional `hasStartNote` argument, default true. When false, the pre-roll returns `countIn` with `countInRemaining` 4. The dev page passes false because it plays no start note. |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (49 of 49) |
| `npm run test:e2e` | pass (8 of 8) |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| PLAN-E04-T2-01 | Fixed | CSS changes are now in `src/index.css` and committed. |
| PLAN-E04-T1-01 | Fixed | Same change as PLAN-E04-T2-02. |
| PLAN-E04-T2-02 | Fixed | `hasStartNote` argument added as described. |
| UI-E04-T2-01 | Fixed | 48 px min height and width on buttons, input, select, Home and tap links. Not re-captured on a phone by me. |
| UI-E04-T2-02 | Fixed | 180 px keyboard cap. Playing state on a phone not captured by me. |
| UI-E04-T2-03 | Deferred | I did not run the count-in or mid-play capture. Needs a person or the UI reviewer's script. |

## Not done

No automated visual capture of count-in and playing states. No unit test for the new `hasStartNote` branch.

## Assumptions and deviations

The 48 px rules now apply at every width, not only on phones.

## How to see it

`npm run dev`, open `/dev/exercise`.
