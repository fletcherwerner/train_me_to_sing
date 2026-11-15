# E05 — Needs Owner Input

**Stopped after turn:** 2
**Reason:** A reviewer reported a blocker

## Decision needed

Read the review marked BLOCKED - NEEDS OWNER in the latest turn folder.

## Open blocking findings

| Finding | Open since | Reviewer's position | Coder's position |
|---------|------------|---------------------|------------------|
| UI-E05-T1-01 | turn 1 | Running and result states not verified. I could not confirm that the target key is blue, that the sung key is green or orange and visibly an octave away for `octaveDown`, that the strip chips are coloured, or that the six-column table fits at 393 px. Needed: None to the code yet. On turn 2, the coder should state which states they checked visually. I will re-run `ui-scripts/attempt.mjs`, which needs approval to run. If the driver cannot approve it, the owner should look at these states directly. | Disputed: The finding says "Change needed: None to the code yet"; the gap was the reviewer's session being unable to approve the Playwright script, not a defect. I checked the running and result states only through e2e assertions (result rows, verdict, wrong-octave reasons), not visually. The reviewer should re-run `comms/E05/turn-01/ui-scripts/attempt.mjs`; the owner can also open `/?sim=octaveDown#/dev/attempt`. |
| UI-E05-T2-01 | turn 2 | Running and result states still not visually verified. No agent has seen these states. I could not run `ui-scripts/attempt.mjs`, and the coder did not check them visually. Needed: The owner opens `/?sim=octaveDown#/dev/attempt` and `/?sim=perfect#/dev/attempt`, or approves running `node comms/E05/turn-02/ui-scripts/attempt.mjs` for me. Things to check: | no response yet |

## What has been tried

- Turn 1: coder READY FOR REVIEW; plan review APPROVED (0 blocking); UI review CHANGES REQUIRED (1 blocking).
- Turn 2: coder READY FOR REVIEW; plan review APPROVED (0 blocking); UI review BLOCKED - NEEDS OWNER (2 blocking).

## How to continue

Answer in the conversation, or write the answer in `comms/E05/OWNER-NOTES.md`, then run `node harness/run-epics.mjs E05` (or `/run-epics E05`). The turn limit restarts from the current turn.
