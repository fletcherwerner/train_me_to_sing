# E06 — Needs Owner Input

**Stopped after turn:** 2
**Reason:** A reviewer reported a blocker

## Decision needed

Read the review marked BLOCKED - NEEDS OWNER in the latest turn folder.

## Open blocking findings

| Finding | Open since | Reviewer's position | Coder's position |
|---------|------------|---------------------|------------------|
| UI-E06-T1-01 | turn 1 | Lesson steps and results not seen in a running app. My click-through script (`ui-scripts/flow.mjs`) was refused permission to run, so no screenshot of the lesson body exists. I cannot confirm the layout order, the piano, the 4-click lead-in, the Stop button, or whether results fit without scrolling. Needed: Nothing in the code yet. The driver or owner must allow `node comms/E06/turn-01/ui-scripts/flow.mjs perfect` (and `octaveDown`) to run. It saves screenshots to `screenshots/`. I will review them next turn. | Disputed: The finding says "Nothing in the code yet" and asks the driver or owner to allow the reviewer's script to run. That is a permission problem in the review run, not a code defect. I cannot grant it, and my shell also refused scripted browser runs, so I took no screenshots. Please allow `node comms/E06/turn-01/ui-scripts/flow.mjs perfect` and `octaveDown`. The code for all steps and results is covered by the passing e2e tests. |
| UI-E06-T1-02 | turn 1 | Home link too small to tap on the phone. "Home" is a plain text link about 24 px tall. It is the only way back from the not-found message and is easy to miss with a thumb. Needed: Give the Home link a minimum 44 × 44 px tap area, or style it as a button like the other controls. Check that the same applies to Home on the results screen. | Fixed: Home links on intro, not-found, fit-failure, running and results screens now have a 48 x 48 px minimum. Not checked by screenshot. |
| UI-E06-T2-01 | turn 2 | Lesson steps and results not seen in a running app. The script was refused permission to run a second time. The coder's dispute is correct that this is a permission problem and not a code defect, but I cannot approve screens I have not seen. Needed: The owner should allow `node comms/E06/turn-02/ui-scripts/flow.mjs perfect` and `... octaveDown`, or run the review script on the real app, then restart the review. | no response yet |

## What has been tried

- Turn 1: coder READY FOR REVIEW; plan review APPROVED (0 blocking); UI review CHANGES REQUIRED (2 blocking).
- Turn 2: coder READY FOR REVIEW; plan review APPROVED (0 blocking); UI review BLOCKED - NEEDS OWNER (3 blocking).

## How to continue

Answer in the conversation, or write the answer in `comms/E06/OWNER-NOTES.md`, then run `node harness/run-epics.mjs E06` (or `/run-epics E06`). The turn limit restarts from the current turn.
