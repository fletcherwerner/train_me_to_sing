# E05 — Turn 3 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 0

## Summary

Turn 3 made no code changes. The owner reviewed the running and result states of `/dev/attempt` at laptop and phone width with `sim=perfect` and `sim=octaveDown` and confirmed they pass, resolving the two blocking UI findings from turns 1 and 2. The scoring engine, tolerance profiles, frame recorder, sim behaviours, live hook, and `/dev/attempt` page all match the epic specification. All four checks pass.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|----------------|
| `npm run lint` | pass | Yes |
| `npm test` | 64 of 64 pass | Yes |
| `npm run test:e2e` | 10 of 10 pass | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| `tolerance.ts`: t1–t4, `getTolerance`, `TOLERANCE_FLOOR` + test that no profile is below it | Yes | — |
| `evaluate.ts`: `evaluateAttempt` steps 1–8 in order (silent, median, wrong-octave, wrong-note, held fraction, onset search, repeated-note skip, hit) | Yes | — |
| `frameRecorder.ts`: `recordFrames` — window `startSec−1 … endSec+0.5`, time rewrite, latency offset | Yes | — |
| Sim behaviours (perfect, flat40, flat70, octaveDown, late300, wobble, silent) and `createPitchSource` wiring | Yes | — |
| `useLiveAttempt` (position, currentNoteIndex, sungMidi, cents, targetMidi) | Yes | — |
| `/dev/attempt` page: exercise dropdown, tolerance dropdown, start attempt, live display, result table, score text, Pass/Fail, reason wording | Yes | — |
| Strip chips coloured by result | Yes | — |
| Unit tests (10 cases: perfect, 40 flat, 70 flat, octave down, late 300, early, 30% then +1.5, 80% then silent, silent, repeated notes, 4/5 passed) | Yes | — |
| Playwright: `sim=perfect` passes, `sim=octaveDown` fails with wrong-octave on every row | Yes | — |
| `core/` imports nothing outside `core/` (structural `ScoredFrame`) | Yes | — |
| Epic notes `docs/epic-notes/E05.md` exists and lists what was built | Yes | — |

## Findings

None.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| PLAN-E05-T1-01 | Fixed | Reported e2e flake on `sim=perfect` (first run after cold server). Not reproduced in subsequent runs. Documented in `docs/epic-notes/E05.md` as a known issue. |

## Questions for the owner

None
