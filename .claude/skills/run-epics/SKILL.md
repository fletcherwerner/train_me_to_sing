---
name: run-epics
description: Run the build-and-review loop for Train Me To Sing epics. Use only when the owner types /run-epics.
argument-hint: "<E01..E12 | next | all>"
disable-model-invocation: true
---

# Run epics

The loop is run by a script, not by you. `harness/run-epics.mjs` decides which epic and turn is next, launches the coding agent and the two reviewers, validates every file they write, enforces the turn limit, updates the status files, merges approved epics and stops when the owner is needed. You only start it and report what it says. Do not re-implement any of it, do not edit anything in `comms/`, and do not launch the agents yourself.

Argument: `$ARGUMENTS`

1. Run the script in the background so a long run does not hit the shell timeout, passing the argument through (use `next` when it is empty):

   ```
   node harness/run-epics.mjs <argument>
   ```

2. Tell the owner it has started, which epic it will begin with (from `comms/STATUS.md`), and that `comms/STATUS.md` shows progress. Then wait. Do not poll. When the script exits you will be notified.
3. When it exits, report from its output and the files it names, in a few lines:
   - **Exit 0:** which epics were approved, and the path to each `comms/<epic>/SUMMARY.md`. Mention any `comms/<epic>/FOR-OWNER.md`.
   - **Exit 2** (`STOPPED:`): quote the reason and point to `comms/<epic>/NEEDS-INPUT.md`. Ask the owner the decision it names. When they answer, write it to `comms/<epic>/OWNER-NOTES.md` under a dated heading and run the script again for that epic.
   - **Exit 1:** show the error. It could not start (for example, a missing dependency epic or a dirty working tree).
4. If the owner interrupts, stop. Nothing is lost: running the script again resumes from the first missing or invalid file.

The rules the script enforces are in `README.md`, section 5. To change a rule, change `harness/lib/comms.mjs` (and its tests, `npm run test:harness`), not this file.
