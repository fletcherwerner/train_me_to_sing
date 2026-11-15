# E04 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the blocking tap-target finding and the two small non-blocking ones (keyboard height cap, pre-roll phase). Chip-state screenshots were not produced by me.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Tap targets, keyboard cap | `src/index.css` | Buttons, inputs, select and Home link now min 48x48 px at all sizes; `.dev-page .piano` max-height 180 px |
| Phase during pre-roll | `src/ui/hooks/usePlaybackPosition.ts`, `src/ui/screens/dev/ExerciseDev.tsx` | New optional `hasStartNote` arg (default true); when false, the 0.2 s pre-roll reports `countIn` with 4 remaining |

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
| UI-E04-T1-01 | Fixed | 48 px min height and width on buttons, select, inputs and Home link, unconditionally |
| UI-E04-T1-02 | Fixed | Keyboard capped at 180 px. I did not re-check the longest exercise's playing layout by screenshot |
| UI-E04-T1-03 | Deferred | No screenshots captured this turn; the chip-state styling was not changed |
| PLAN-E04-T1-01 | Fixed | See `hasStartNote` above |

## Not done

Screenshots of count-in and mid-play states.

## Assumptions and deviations

48 px chosen over 44 px for margin against fractional measurement.

## How to see it

`npm run dev`, open `/dev/exercise`.
