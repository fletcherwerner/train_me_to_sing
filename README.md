# Train Me To Sing

A voice-training app for a beginner: it plays and shows notes on a piano, listens through the microphone, and shows how the sung note compares with the target. Runs in a laptop browser and on an iPhone.

The app is built epic by epic by three agents. This is the only README in the repository; each section covers one area.

| Section | For |
|---------|-----|
| [1. Running the project](#1-running-the-project) | Owner |
| [2. Where to find things to review](#2-where-to-find-things-to-review) | Owner |
| [3. Steering the build](#3-steering-the-build) | Owner |
| [4. The plan](#4-the-plan) | Owner and agents |
| [5. Agent communication rules](#5-agent-communication-rules) | Agents; owner for reference |
| [6. Harness files](#6-harness-files) | Reference |

---

## 1. Running the project

### Build an epic

Type one of these in Claude Code, from this folder:

| Command | What it does |
|---------|--------------|
| `/run-epics next` | Builds the next unapproved epic, then stops. |
| `/run-epics E03` | Builds that epic, then stops. Its dependencies must be approved first. |
| `/run-epics all` | Builds epics in order until you interrupt or it needs you. |

To stop, interrupt. Running the command again resumes where it left off.

### What happens when it runs

Each epic goes through turns:

1. `epic-coder` builds the epic (turn 1) or responds to the last reviews (later turns).
2. `plan-reviewer` checks the code against the plan. `ui-reviewer` checks the running UI against your UI requirements.
3. If both approve in the same turn, the epic is done and merged to `main`, and the orchestrator writes `comms/Exx/SUMMARY.md`: what was accomplished and how to test it. Otherwise another turn starts.

### When it stops and asks you

- 10 turns have passed without both reviewers approving.
- An agent reports a blocker, such as a conflict in the plan or a decision only you can make.
- The coder and a reviewer have disagreed on the same finding for two turns in a row.

It writes the question to `comms/Exx/NEEDS-INPUT.md` and asks you in the conversation. Answer there, or in `comms/Exx/OWNER-NOTES.md`, then run `/run-epics Exx` again.

### Try the app yourself

Available once E01 is approved.

| Command | Use |
|---------|-----|
| `npm install` | Once, after E01. |
| `npm run dev` | Laptop: open `https://localhost:5173` and accept the certificate warning. |
| `npm run dev -- --host` | iPhone on the same Wi-Fi: open `https://<laptop-ip>:5173` in Safari. |
| `npm test` / `npm run test:e2e` | Automated tests. |

Each epic file ends with a **Review script**: the steps to check that epic by hand. The reviewers cannot hear audio or use a real microphone, so those steps are yours.

---

## 2. Where to find things to review

### Start here after a run

| You want to know | Open |
|------------------|------|
| Where every epic stands | [`comms/STATUS.md`](comms/STATUS.md) |
| What an approved epic accomplished and how to test it | `comms/Exx/SUMMARY.md` |
| How one epic went, turn by turn | `comms/Exx/INDEX.md` |
| What the loop is waiting on you for | `comms/Exx/NEEDS-INPUT.md` (exists only while stopped) |
| Questions and suggested UI requirement changes from an approved epic | `comms/Exx/FOR-OWNER.md` |
| The original plan for checking the epic by hand | "Review script" at the end of `planning/epics/Exx-*.md` (the `SUMMARY.md` steps reflect what was actually built) |

### Inside one turn

`comms/Exx/turn-NN/` holds everything the agents said in that turn:

| File | Written by | Contains |
|------|-----------|----------|
| `coder.md` | epic-coder | What was built, test results, response to each finding |
| `plan-review.md` | plan-reviewer | Verdict, requirement-by-requirement coverage, findings |
| `ui-review.md` | ui-reviewer | Verdict, screens checked, findings, what it could not verify |
| `screenshots/` | ui-reviewer | Laptop and iPhone-sized captures of each screen |

Every review starts with its verdict and a short summary, so the first few lines are enough to follow along.

### Folder layout of `comms/`

```
comms/
  STATUS.md                 one row per epic: status, turns used
  templates/                the format each file must follow
  E03/
    INDEX.md                one row per turn: verdicts and finding counts
    OWNER-NOTES.md          optional; your instructions for this epic
    NEEDS-INPUT.md          present only while the loop is waiting for you
    FOR-OWNER.md            questions and proposed requirement changes, collected at approval
    SUMMARY.md              written when the epic is approved: what was accomplished and how to test it
    turn-01/
      coder.md
      plan-review.md
      ui-review.md
      screenshots/
    turn-02/
      ...
```

---

## 3. Steering the build

| To do this | Do this |
|------------|---------|
| Give direction on one epic | Write it in `comms/Exx/OWNER-NOTES.md`. All three agents read it every turn; it overrides the epic file. |
| Change what the UI must do | Edit [`planning/ui-requirements.md`](planning/ui-requirements.md) and add a line to its change log. The UI reviewer picks it up on the next turn. |
| Change what an epic builds | Edit `planning/epics/Exx-*.md` before running it. |
| Redo an approved epic | Set its row in `comms/STATUS.md` to `In progress`, add `OWNER-NOTES.md`, and run it. |
| See the code for an epic in progress | Branch `epic/Exx`. Approved work is on `main`. Nothing is pushed. |

---

## 4. The plan

### Documents, in reading order

| File | Contains |
|------|----------|
| [`planning/00-product-overview.md`](planning/00-product-overview.md) | What the app does, the user flow, the decisions made |
| [`planning/01-architecture.md`](planning/01-architecture.md) | Tech stack, folder layout, shared types and rules every epic follows |
| [`planning/02-lesson-catalog.md`](planning/02-lesson-catalog.md) | Lessons, note data, tolerance profiles |
| [`planning/ui-requirements.md`](planning/ui-requirements.md) | What the owner needs from the UI. Owned and updated by the owner. |
| `planning/epics/` | One file per epic, built in order |

### Epics

Every epic ends with something you can open and review. "Depends on" means those epics must be approved first.

| # | Epic | You can review | Depends on |
|---|------|----------------|------------|
| E01 | [Foundation: scaffold, music core, piano](planning/epics/E01-foundation-piano.md) | A piano on screen that plays notes when clicked | — |
| E02 | [Mic pitch detection and live tuner](planning/epics/E02-pitch-detection-tuner.md) | Sing and see the key you're singing light up | E01 |
| E03 | [Vocal range assessment](planning/epics/E03-range-assessment.md) | Hold a low and a high note; range saved and shown | E02 |
| E04 | [Exercise model, range fitting, "I do" playback](planning/epics/E04-exercise-playback.md) | An exercise transposed into your range, played and shown on the piano | E03 |
| E05 | [Scoring engine and graded "You do"](planning/epics/E05-scoring-you-do.md) | Sing an exercise and get per-note hit/miss results | E04 |
| E06 | [Full lesson session: I do / We do / You do](planning/epics/E06-lesson-session.md) | One complete lesson, start to results screen | E05 |
| E07 | [Lesson catalog, tracker, Stage 1 lessons](planning/epics/E07-catalog-tracker-stage1.md) | Home screen with all note-matching lessons and progress | E06 |
| E08 | [Stage 2 scales, tighter tolerances, latency calibration](planning/epics/E08-scales-calibration.md) | Scale lessons; a calibration screen | E07 |
| E09 | [Stage 3 songs with lyrics](planning/epics/E09-songs.md) | Five songs with lyrics under the notes | E08 |
| E10 | [PWA install, hosting, export/import](planning/epics/E10-pwa-export.md) | App installed on the iPhone home screen; progress moved between devices | E07 (E09 preferred) |
| E11 | [MIDI import](planning/epics/E11-midi-import.md) | Import a MIDI file and sing it as a lesson | E09 |
| E12 | [Capacitor iOS wrapper](planning/epics/E12-capacitor-ios.md) | A real iOS app installed from Xcode | E10 |

### How each epic file is laid out

- **Goal** and **What you will review** — the outcome in plain language.
- **Depends on** — epics and specific modules it builds on.
- **Scope** — what to build, and what to leave alone.
- **Specification** — behaviour, files, function signatures.
- **Tests** — automated tests the builder must write and pass.
- **Review script** — steps for you to run by hand to accept the epic.

### Assumptions to confirm

These were decided without asking; say so if any is wrong.

1. **Sequence strip.** The view is keyboard-only. Because timing is graded, the lesson screen also shows a row of small note chips (one per note, current one highlighted, lyric underneath for songs) and a beat indicator. It is not a scrolling piano roll.
2. **"You do" still shows the target key.** The app stops playing the melody, but the target key stays lit and a metronome clicks. The first note is played once before the 4-click lead-in.
3. **Exercises that don't fit your range** are shown in the tracker but disabled, with the reason. Nothing is octave-folded to make it fit.
4. **AirPods.** On iPhone, using a Bluetooth headset's mic drops playback quality and adds delay. Wired headphones, or AirPods with calibration (E08), are the supported setups.
5. **Git.** The repo is not yet a git repository. `/run-epics` runs `git init` the first time it is used.

---

## 5. Agent communication rules

Everything the three agents say to each other is a markdown file under `comms/`. The owner reads the same files. Agents must follow this section exactly.

### Who writes what

| Agent | Job | Writes |
|-------|-----|--------|
| `epic-coder` | Builds the epic; revises it after feedback | `turn-NN/coder.md` |
| `plan-reviewer` | Checks the code against the plan, the architecture and the epic | `turn-NN/plan-review.md` |
| `ui-reviewer` | Checks the running UI against `planning/ui-requirements.md` | `turn-NN/ui-review.md`, `turn-NN/screenshots/` |
| Orchestrator (`/run-epics`) | Runs the turns, keeps the indexes, stops when required | `STATUS.md`, `Exx/INDEX.md`, `Exx/NEEDS-INPUT.md`, `Exx/FOR-OWNER.md`, `Exx/SUMMARY.md` |
| Owner | Gives direction | `Exx/OWNER-NOTES.md`, `planning/ui-requirements.md` |

### What a turn is

1. The coding agent works (turn 1: builds the epic; later turns: responds to the previous turn's reviews) and writes `coder.md`.
2. Both reviewers review that work and write their reviews.

The epic is approved when both reviews in the same turn say `APPROVED`. After 10 turns without approval, the loop stops and asks the owner. It also stops at once if any agent reports `BLOCKED - NEEDS OWNER`.

### Verdict line

Each review has exactly one line in this form near the top. The orchestrator reads it.

```
**Verdict:** APPROVED
**Verdict:** CHANGES REQUIRED
**Verdict:** BLOCKED - NEEDS OWNER
```

The coding agent's report uses `**Status:** READY FOR REVIEW` or `**Status:** BLOCKED - NEEDS OWNER`.

### Findings

- **Id:** `<reviewer>-<epic>-T<turn>-<number>`, where reviewer is `PLAN` or `UI`. Example: `UI-E03-T1-02`. A finding keeps its id for as long as it is open; do not renumber it in later turns.
- **Severity:**
  - **Blocking** — a written requirement is not met, a listed test is missing or failing, an architecture rule is broken, logic is wrong, or a screen is unusable. Must be resolved before approval.
  - **Non-blocking** — an improvement. Does not prevent approval.
- **Each finding states:** where (file and line, or screen and screenshot), what is wrong, which requirement it breaks (document and section, or `UR-` id), and what change is needed.
- **Status in later turns:** `Open`, `Fixed`, or `Withdrawn`.

The coding agent answers every finding by id as `Fixed`, `Deferred` (non-blocking only) or `Disputed`, with a reason. A blocking finding that stays disputed for two turns in a row goes to the owner.

### Writing style

- Lead with the verdict or status, then a summary of two or three sentences the owner can read on its own.
- One finding per entry. State facts and the required change. No praise, no filler.
- Quote the requirement being applied rather than paraphrasing it.
- Say what was not checked. A reviewer cannot hear audio or use a real microphone; list the review-script steps left for the owner.

---

## 6. Harness files

| Path | Contains |
|------|----------|
| `CLAUDE.md` | Standing rules for anyone working in this repository |
| `.claude/agents/` | Instructions for the three agents |
| `.claude/skills/run-epics/SKILL.md` | The loop that `/run-epics` follows |
| `comms/templates/` | The format of each report |
| `harness/screenshot.mjs` | Screenshot tool used by the UI reviewer |
| `docs/epic-notes/` | The coder's notes per epic (created during builds) |
