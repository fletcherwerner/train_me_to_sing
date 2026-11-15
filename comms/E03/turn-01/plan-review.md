# E03 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The range analysis, storage, `RangeSetup` wizard, redirect, Home range display and `sim=range` option all match the epic. The recording window uses only frames inside the audio-clock window. All four checks pass here. Two small non-blocking gaps remain.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | pass (34 of 34) | Yes |
| `npm run test:e2e` | pass (6 of 6) | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| schema.ts / store.ts, defaults, loadData, saveData | Yes | — |
| `useAppStore.setRange`, saves on every action | Yes | — |
| `findHeldNote` algorithm (30% rule, stable segments, medians, rounding) | Yes | PLAN-E03-T1-01 (empty input) |
| `core/` imports nothing outside `core/` | Yes | — |
| Wizard steps 1–5 (intro, find, countdown + 3 s window, result with playback, retry, highest, confirm) | Yes | PLAN-E03-T1-02 |
| Confirm: octave padding, rangeMarkers, nudges, 5-semitone minimum, warning below 7, Save with ISO date | Yes | — |
| Redirect `/` to `/range` when range is null; Home shows range and "Redo range test" | Yes | — |
| Unit tests (steady, wobble, no-voice, glide) | Yes | — |
| Storage tests (round trip, corrupt JSON) | Yes | — |
| `sim=range:<low>,<high>` and e2e wizard test, reload persistence | Yes | — |

## Findings

### PLAN-E03-T1-01 — Empty frame list gives `unstable`, not `no-voice`

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/core/exercise/rangeAnalysis.ts:40`
- **Requirement:** E03 spec, `findHeldNote` step 1: fewer than 30% non-null frames means `no-voice`.
- **Problem:** With an empty array, `0 < 0` is false, so the function goes on to return `unstable`. No frames means no voice was heard.
- **Change needed:** Return `no-voice` when `frames.length === 0`, and add a test.

### PLAN-E03-T1-02 — Countdown shows a single number

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/screens/RangeSetup.tsx:266`
- **Requirement:** E03 spec step 3: a visible "3 – 2 – 1" countdown.
- **Problem:** Only the current digit is shown. This is arguably a valid reading, but the text is not literal.
- **Change needed:** Optional. Show the full "3 – 2 – 1" sequence with the current digit highlighted.

## Previous findings

None (turn 1).

## Questions for the owner

None
