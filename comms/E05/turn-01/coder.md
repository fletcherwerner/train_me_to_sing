# E05 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Added the scoring engine (`evaluateAttempt`, tolerance profiles), a frame recorder, the synthetic singer behaviours, a live-feedback hook and the `/dev/attempt` page. The page shows the target and sung keys, the cents meter and the strip while you sing. Afterwards it shows a per-note table, the score and Pass/Fail.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Scoring core | `src/core/scoring/{types,tolerance,evaluate}.ts` | Steps 1–8 of the spec, in order |
| Recorder | `src/audio/pitch/frameRecorder.ts` | Window `startSec−1 … endSec+0.5`; time rewritten to exercise time |
| Sim singer | `src/audio/pitch/simSinger.ts`, `pitch/index.ts` | Seven `?sim=` behaviours that follow the registered exercise |
| Hook | `src/ui/hooks/useLiveAttempt.ts` | Note index, sungMidi, cents |
| Page | `src/ui/screens/dev/AttemptDev.tsx`, `src/app/routes.tsx` | `/dev/attempt` |
| Tests | `scoring.test.ts`, `frameRecorder.test.ts`, `tests/e2e/attempt.spec.ts` | All ten spec cases, plus recorder, sim and tolerance-floor tests |
| Notes | `docs/epic-notes/E05.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (64 of 64) |
| `npm run test:e2e` | pass (10 of 10). The first run failed `sim=perfect` once (Fail instead of Pass). Reruns passed, including 3× repeats of the attempt spec. |
| `npm run build` | pass |

## Response to findings

Turn 1: none.

## Not done

Nothing in scope. I did not try it on a real mic or an iPhone.

## Assumptions and deviations

- `evaluateAttempt` uses a structural `ScoredFrame` type so `core` stays free of `audio` imports.
- If no 80 ms on-note run exists in the onset search window, the note is reported as `wavered`.
- Time and pitch bounds are exact at the tolerance edge (`≤`, with a 1e-9 epsilon).
- I did not change `SyntheticPitchSource`.

## How to see it

`npm run dev`, then open `https://localhost:5173/#/dev/attempt`. Add `?sim=perfect`, `?sim=flat70`, `?sim=octaveDown` or similar for simulated singers.
