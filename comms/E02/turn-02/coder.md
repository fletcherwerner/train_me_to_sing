# E02 — Turn 02 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed all 4 findings from Turn 1: added 5-frame median smoothing to `MicPitchSource`, added `mic-denied` error handling, added error UI to the tuner page, and fixed the SyntheticPitchSource time tracking. All four build commands pass.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| `src/audio/pitch/MicPitchSource.ts` | Modified | Added 5-frame rolling buffer and `smoothPitch()` call before emitting. Added try/catch around `getUserMedia` that rejects with `new Error('mic-denied')` on `NotAllowedError`. |
| `src/audio/pitch/SyntheticPitchSource.ts` | Modified | Track elapsed time between frames and pass it to the behaviour function, so the behaviour receives a monotonically increasing `tSec` as the spec requires. |
| `src/ui/screens/dev/TunerDev.tsx` | Modified | Added `error` state. `start()` now catches `mic-denied` and displays a clear error message. `stop()` clears the error. |
| `src/index.css` | Modified | Added `.tuner-note` (2.5rem desktop, 2rem phone), `.tuner-error` (red, bold), `.tuner-silence` (centered, faded). |
| `tests/e2e/tuner.spec.ts` | Modified | Updated "no pitch" test to expect `.tuner-error` (mic is denied in test env, no real mic). |
| `docs/epic-notes/E02.md` | Modified | Added Turn 2 changes section. |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass (0 errors) |
| `npm test` | pass (4 files, 19 tests) |
| `npm run test:e2e` | pass (4 tests) |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| PLAN-E02-T1-01 | Fixed | Added 5-frame rolling buffer in `MicPitchSource.tick()`. After computing raw midi, the value is pushed to `rawBuffer` (max 5 elements). Before emitting, `smoothPitch(rawBuffer)` is called and the smoothed result is emitted instead of the raw value. |
| PLAN-E02-T1-02 | Fixed | Wrapped `getUserMedia` call in `start()` in a try/catch. If the error is `NotAllowedError`, throws `new Error('mic-denied')` as specified. |
| PLAN-E02-T1-03 | Fixed | `SyntheticPitchSource.tick()` now tracks `lastTime` and computes `elapsed = t - lastTime`. The behaviour function receives `t + elapsed` (monotonically increasing time), and the frame's `tSec` is `t` from `AudioContext.currentTime`. |
| PLAN-E02-T1-04 | Fixed | `TunerDev` now has an `error` state. `start()` catches `mic-denied` and displays "Microphone access denied. Please allow microphone access in your browser settings and reload." The error is cleared on `stop()` or a new `start()` attempt. |
| UI-E02-T1-01 | Fixed | Added `.tuner-note` CSS: `font-size: 2.5rem` on desktop, `2rem` on phone (≤600px). Also added `.tuner-error` styling (red, bold). |
| UI-E02-T1-02 | Fixed | When `source.start()` rejects with `mic-denied`, the page now shows a clear "Microphone access denied" message instead of the ambiguous "No pitch detected" message. The error state is separate from the silence state. |

## Not done

Nothing from the epic scope is missing.

## Assumptions and deviations

None. All changes follow the epic specification exactly.

## How to see it

Open `https://localhost:5173/#/dev/tuner` (laptop) or `https://<laptop-ip>:5173/#/dev/tuner` (iPhone). With `?sim=const:60.3` the synthetic source emits C4 at +30 cents. Without sim, the page shows an error when the mic is denied.

## Blocker

None.
