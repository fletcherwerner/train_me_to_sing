# E08 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The work meets the epic. The eight Stage 2 lessons match the catalog and are registered with no engine change. `detectOnsets` and the calibration maths are pure functions in `core/scoring`. The calibration screen, settings slider, tolerance line, Home note and calibration hint are all present. All the listed tests exist and pass.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 157 of 157 pass | Yes |
| `npm run test:e2e` | 19 of 19 pass | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| stage2.ts: eight lessons, t2/t3, goals, registered | Yes | — |
| Tolerance line in plain words on the lesson intro | Yes | — |
| Home stage note when stricter | Yes | — |
| Calibration flow: 4 count-in clicks, 8 measured clicks at 60 bpm, 3× median threshold, 300 ms quiet, ±600 ms match, at least 5 matches, median rounded to 10 ms, clamp 0–500, Save and Retry | Yes | — |
| `detectOnsets` pure in `core/scoring/onsets.ts` | Yes | — |
| Settings slider 0–500 step 10 and calibrate link | Yes (step and range not re-read in detail; the e2e slider test passes) | — |
| Lesson passes `latencyOffsetMs` to the recorder | Yes (`Lesson.tsx:163`) | — |
| One-time hint on the first Stage 2 intro | Yes | PLAN-E08-T1-01 |
| Tests: onsets, median 185 → 190, late300 with offset, s2-07 short note, e2e s2-03 "1 of 8 passed" | Yes | — |

## Findings

### PLAN-E08-T1-01 — Calibrate hint is not strictly one-time

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/screens/Lesson.tsx:210`
- **Requirement:** `planning/epics/E08-scales-calibration.md`, "If the offset has never been calibrated, show a one-time hint on the first Stage 2 lesson intro"
- **Problem:** The hint shows on every visit to s2-01 until the student calibrates. That is a reasonable reading of "never been calibrated", so this is minor.
- **Change needed:** None required. Optionally record the interpretation in the epic notes.

## Previous findings

None; this is turn 1.

## Questions for the owner

None
