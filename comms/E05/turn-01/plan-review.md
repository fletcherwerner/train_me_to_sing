# E05 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The scoring engine, tolerance profiles, recorder, sim singers, hook and `/dev/attempt` page match the epic. The ten listed unit cases and both Playwright cases exist and pass. `evaluateAttempt` follows steps 1–8 in order. One non-blocking concern is an e2e flake the coder reported.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 64 of 64 pass | Yes |
| `npm run test:e2e` | 10 of 10 pass; attempt spec repeated 6× with 12 of 12 passing | Yes (flake not reproduced) |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| tolerance.ts: t1–t4, getTolerance, TOLERANCE_FLOOR + test | Yes | — |
| evaluate.ts steps 1–8, order, score/passed | Yes | — |
| Onset fallback when no 80 ms run exists | Partial (unspecified; reported as `wavered`) | PLAN-E05-T1-01 |
| frameRecorder window, time rewrite, latency offset | Yes | — |
| Sim behaviours (7) and `createPitchSource` wiring | Yes | — |
| useLiveAttempt (index, sungMidi, cents) | Yes | — |
| /dev/attempt page, options, table, score text, Pass/Fail, reason wording | Yes | — |
| Strip chips coloured by result | Yes | — |
| Unit tests (10 cases) | Yes | — |
| Playwright perfect and octaveDown | Yes | PLAN-E05-T1-01 |
| core/ imports nothing outside core/ | Yes (structural ScoredFrame) | — |

## Findings

### PLAN-E05-T1-01 — Reported e2e flake on sim=perfect

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `tests/e2e/attempt.spec.ts:17`, `src/audio/pitch/simSinger.ts:55`
- **Requirement:** `planning/01-architecture.md` definition of done (tests must pass reliably)
- **Problem:** The coder saw one `sim=perfect` run return Fail. I could not reproduce it in 13 runs. A likely cause is the sim source's frame cadence or startSec registration order. The page registers the exercise after `playExercise` returns, so a few early frames may be null. Separately, a note with no 80 ms on-note run is reported as `wavered`, which the epic does not specify.
- **Change needed:** Optionally register the sim exercise before frames can arrive, or note the cause in `docs/epic-notes/E05.md`. Document the onset fallback there too.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| — | — | Turn 1, none |

## Questions for the owner

None
