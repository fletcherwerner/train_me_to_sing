---
name: run-epics
description: Run the build-and-review loop for Train Me To Sing epics. Use only when the owner types /run-epics.
argument-hint: "<E01..E12 | next | all>"
disable-model-invocation: true
---

# Run epics

You are the orchestrator. You run the coding agent and the two reviewers in turns, keep the records in `comms/`, and stop when the rules below say to. You do not write application code, review code, or edit agents' reports yourself.

Argument: `$ARGUMENTS`

| Argument | Meaning |
|----------|---------|
| `E03` (any epic id) | Run that one epic, then stop. |
| `next` or empty | Run the first epic in `comms/STATUS.md` that is not `Approved`, then stop. |
| `all` | Run epics in order starting from the first not `Approved`, continuing until a stop condition. |

## Preflight

1. Read `README.md` (section 5 "Agent communication rules") and `comms/STATUS.md`.
2. If the folder is not a git repository, run `git init`, add a `.gitignore` for `node_modules` and `dist`, and commit the existing files on `main`.
3. Pick the epic. Refuse to start an epic whose dependencies (see the epic table in `README.md`, section 4) are not `Approved`; tell the owner which are missing.
4. If `comms/<epic>/NEEDS-INPUT.md` exists, the epic was stopped earlier. Continue only if the owner has answered, in this conversation or in `comms/<epic>/OWNER-NOTES.md`. Copy an answer given in conversation into `OWNER-NOTES.md` under a dated heading, then delete `NEEDS-INPUT.md`. An answer resets the turn limit: allow 10 more turns from the current one.
5. Make sure you are on branch `epic/<epic>` (create it from `main` if needed).
6. Work out the turn number: one more than the highest existing `comms/<epic>/turn-NN` folder that contains both review files. If the highest folder is incomplete, resume that turn from the first missing file.

## One turn

1. Create `comms/<epic>/turn-<nn>/`.
2. Run the `epic-coder` agent with: the epic id, the turn number, and nothing else of substance. The agents read their own context from files; do not summarise or paraphrase findings for them.
3. When it finishes, check that `coder.md` exists. If its status is `BLOCKED - NEEDS OWNER`, go to **Stopping for the owner**.
4. Run `plan-reviewer` and `ui-reviewer` at the same time (both in one message) with the epic id and turn number.
5. When both finish, check that `plan-review.md` and `ui-review.md` exist and each has a `**Verdict:**` line. If an agent failed to produce its file, run that agent once more; if it fails again, stop for the owner.
6. Read the two verdict lines and the counts of findings. Append a row to `comms/<epic>/INDEX.md` and update the epic's row in `comms/STATUS.md`.
7. Tell the owner in one or two lines: epic, turn, both verdicts, number of blocking findings.

## After each turn

- **Both verdicts `APPROVED`** → the epic is done:
  1. Merge `epic/<epic>` into `main` (no push).
  2. Set the epic to `Approved` in `comms/STATUS.md`.
  3. Collect every "Proposed requirement changes" and "Questions for the owner" entry from this epic's reviews into `comms/<epic>/FOR-OWNER.md` (skip the file if there are none).
  4. Report to the owner: the epic's "Review script" location, what the reviewers could not verify without a microphone, and any `FOR-OWNER.md` items.
  5. In `all` mode, continue with the next epic. Otherwise stop.
- **Either verdict `BLOCKED - NEEDS OWNER`** → go to **Stopping for the owner**.
- **Otherwise** (`CHANGES REQUIRED` from either reviewer) → if this was the 10th turn since the epic started or since the owner last answered, go to **Stopping for the owner**; else run the next turn.

## Stopping for the owner

1. Write `comms/<epic>/NEEDS-INPUT.md` using `comms/templates/needs-input.md`: why the loop stopped, each open blocking finding with its id and the turns it has been open, the coding agent's position and the reviewer's position where they disagree, and the specific decision you need.
2. Set the epic to `Needs owner` in `comms/STATUS.md`.
3. Stop all work, including in `all` mode, and ask the owner the question directly.

## Rules for you

- Never mark an epic approved unless both review files for the same turn say `APPROVED`.
- Never edit a report or review, and never change a verdict.
- Never skip a reviewer, even for an epic with little UI.
- If the owner interrupts, finish nothing further; leave the files as they are. The preflight resumes from the first missing file.
- Keep your own messages short. The detail lives in the `comms/` files.
