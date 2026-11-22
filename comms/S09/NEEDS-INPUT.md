# S09 — Needs Owner Input

**Stopped after turn:** 0
**Reason:** The epic-coder agent failed validation twice for S09 turn 1

## Decision needed

- the agent run failed: exit code 1. 
- comms/S09/turn-01/coder.md does not exist
- uncommitted changes outside comms/: src/content/types.ts, src/core/scoring/accuracy.test.ts, src/core/scoring/accuracy.ts, src/core/scoring/matchScoring.test.ts, src/core/scoring/matchScoring.ts, src/ui/describeReason.ts, src/ui/screens/MatchRun.tsx, tests/e2e/accuracy.spec.ts, tests/e2e/practice.spec.ts, tests/e2e/stage1.spec.ts, tsconfig.tsbuildinfo, docs/epic-notes/S09.md, src/ui/describeReason.test.ts. Commit them as "S09 turn 1: ...".

The raw output of each agent run is in .driver-logs/S09/ (not committed). Fix the cause or say what to change in comms/S09/OWNER-NOTES.md, then run the epic again.

## Open blocking findings

None recorded.

## What has been tried

No completed turns.

## How to continue

Answer in the conversation, or write the answer in `comms/S09/OWNER-NOTES.md`, then run `node harness/run-epics.mjs S09` (or `/run-epics S09`). The turn limit restarts from the current turn.
