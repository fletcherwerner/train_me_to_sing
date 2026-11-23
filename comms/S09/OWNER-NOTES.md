# S09 — Owner notes

## Turn 1 stopped (2026-11-22): network, not the code

Both coder attempts failed with "Can't reach the API server (ENOTFOUND)": the laptop lost its connection. Nothing to change in the spec.

The first attempt had already done most of the work, left uncommitted in the working tree (`src/core/scoring/matchScoring.ts`, `accuracy.ts`, `MatchRun.tsx`, `describeReason.ts`, their tests, `tests/e2e/*.spec.ts`, `docs/epic-notes/S09.md`). Start from those changes: review them against the spec, finish what's missing, run the checks, then commit as "S09 turn 1: ..." and write your report. Don't throw them away and start over.
