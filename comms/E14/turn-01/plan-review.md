# E14 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The work meets the epic. Stage 1 has the 19 new lessons in four units. Match scoring, `pickTonic` and `fit` options, the level machine, storage migration, echo yourself and the Home grouping are all present and follow the plan. The one open point is that the full e2e run is slow and was not reliably green under load.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 379 of 379 pass | Yes |
| `npm run test:e2e` | First full run: 66 passed, 4 failed (hardening s3-04, pitchGraph phone, profiles, stage2). Reran those 4 spec files: all 22 passed. | Partly. Report says 70 of 70. |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| A. Content model (`kind`, `unit`, `levels`, `echo`, match fields) | Yes | — |
| B. 19 lessons, ids, notations, 1-beat Unit C, last note 2 beats, t1, 60 bpm | Yes | — |
| C. `matchTarget`, `placeTarget`, `scoreMatch`, `slid` tip, 8 s window, 1.5 s piano | Yes | — |
| D. `fit` opts, `pickTonic`, new key per Practise/Prove attempt, `key=random` for sim | Yes | — |
| E. Levels in session machine, storage `level`, pass only at Prove | Yes | — |
| F. Take recorder (`audio/mp4` preferred), in memory, echo hidden when unsupported, sim take | Yes | — |
| G. Legacy `s1-0[1-8]` dropped on load, import and profile load; notice; version stays 1 | Yes | — |
| H. Home units, "n of m passed", level labels | Yes | — |
| I. Tests (matchScoring, fit, sessionMachine, legacyProgress, stage1.spec) and id moves | Yes | — |
| Architecture: `core/` imports nothing outside `core/`, no new dependencies | Yes | — |

## Findings

### PLAN-E14-T1-01 — Full e2e run is slow and flaky under load

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `tests/e2e/stage1.spec.ts`
- **Requirement:** `planning/01-architecture.md`, Definition of done: all tests pass.
- **Problem:** In my full run, `stage1.spec.ts` took about 7.6 minutes in total and 4 other specs timed out. The same 4 specs passed when run alone. The coder reported 70 of 70.
- **Change needed:** Shorten the long Stage 1 specs, for example by using fewer full three-level runs, so the suite is stable.

## Previous findings

None.

## Questions for the owner

None
