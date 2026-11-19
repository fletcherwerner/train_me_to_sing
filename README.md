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

### Before the first run

1. **Trust this folder for headless runs.** The driver starts each agent with `claude -p`. In that mode Claude Code ignores this project's `.claude/settings.json` (the command allowlist and the guard hook) until the folder is trusted, so every agent would be denied `npm` and `git`. Run `claude` interactively in this folder once and accept the trust dialog, or set `projects["<this folder>"].hasTrustDialogAccepted` to `true` in `~/.claude.json`. If you forget, the driver detects it and stops with these instructions before any work is done.
2. `npm install` (once the app exists).
3. `npm run test:harness` should pass. It tests the validator and guard rules.
4. `node harness/run-epics.mjs next --dry-run` shows which epic would run.

### Build an epic

A script runs the loop, so the same command works from any terminal or from Claude Code. From this folder:

| Command | What it does |
|---------|--------------|
| `node harness/run-epics.mjs next` | Builds the next unapproved epic, then stops. |
| `node harness/run-epics.mjs E03` | Builds that epic, then stops. Its dependencies must be approved first. |
| `node harness/run-epics.mjs all` | Builds epics in order until you interrupt or it needs you. |
| `... --dry-run` | Shows what would run and changes nothing. |
| `... --local` | Runs every agent (coder, reviewers, summarizer) on the local Qwen model instead of the default. See below. |
| `... --profile=<name>` | Same, using `harness/profiles/<name>.json`. |

Inside Claude Code, `/run-epics next`, `/run-epics E03` and `/run-epics all` start the same script and report its result.

To stop, press Ctrl+C (or interrupt in Claude Code). Running the command again resumes where it left off. Exit code 0 means it finished what you asked, 2 means it stopped and needs you, 1 means it could not start.

#### Running on the local model

`--local` does what your `claude-local` alias does, but for every agent the driver starts. A shell alias cannot be used here, because the driver launches `claude` itself and aliases exist only in an interactive shell. The settings are in [`harness/profiles/local.json`](harness/profiles/local.json): the endpoint, the `qwen3.6` model names, and the path of the key file. The key is read from that file at run time and is never copied into the repository or the logs.

```
node harness/run-epics.mjs E02 --local
```

Three layers, each in its own terminal, started in this order. Stop an old model server with Ctrl+C first.

```
# Terminal A: the model, with memory limits and a /flush endpoint (use this script, not the one on the external drive)
cd <path-to-this-repo>
harness/local/start-qwen.sh

# Terminal B: the gateway that translates Claude's API to the model's
/Volumes/ExternalSSD/models/start-proxy.sh

# Terminal C: the driver (caffeinate stops the Mac sleeping during a long run)
cd <path-to-this-repo>
caffeinate -i node harness/run-epics.mjs all --local
```

The driver checks that the endpoint answers and stops with a reminder if it does not. If the endpoint or model name changes, edit `harness/profiles/local.json`, not the script. Commits made by the driver carry no co-author line in this mode, since the model is not Claude. The `/run-epics` command in Claude Code starts the driver without `--local`; to use the local model, run the command above in a terminal.

**Memory on a 32 GB Mac.** The model server saves every conversation it processes so that the next request can skip re-reading it (the "prompt cache"). Left alone it keeps growing until memory runs out (`Insufficient Memory` in the Terminal A window, after which every request fails with 404 `generation thread died`). The weights take 20.4 GB and the GPU may use about 26.8 GB, which leaves about 6 GB for the cache and the working memory of a request. Measured on the E02 run: the cache costs about 26 KB per token, one agent's fixed prompt is 12,000 to 15,000 tokens, and the largest agent's conversation reached an estimated 55,000 tokens (about 1.4 GB per saved copy).

`harness/local/start-qwen.sh` therefore starts the server with these values:

| Setting | Value | What it does |
|---|---|---|
| `TMTS_MLX_MEMORY_GB` | 26 | Hard limit on memory MLX may use. Must stay above the 20.4 GB of weights and under 26.8 |
| `TMTS_MLX_BUFFER_GB` | 1 | Freed memory MLX may keep for reuse; the rest goes back to the system |
| `--prompt-cache-size` | 8 | Saved entries kept (a conversation leaves up to three: system prompt, last user message, full conversation; Claude Code's short side requests leave their own). **Do not lower this**: at 2 the full conversation was evicted after every request and each step re-read 40,000 to 60,000 tokens (E03 turn 1 ran out of its hour that way). The byte limit below is what bounds memory |
| `--prompt-cache-bytes` | 4000000000 | Upper limit on their total size. The shipped server ignores this flag on the path it normally uses, so `harness/local/qwen_server.py` applies it itself |
| `--prefill-step-size` | 512 | Smaller memory spike while a prompt is read |
| `--prompt-concurrency`, `--decode-concurrency` | 1 | One request at a time |

Override any of them for one run by putting the variable before the script or the flag after it, for example `TMTS_MLX_MEMORY_GB=25 harness/local/start-qwen.sh --prompt-cache-bytes 3000000000`. A flag given later wins.

**Emptying the cache.** After every agent finishes, the driver asks the server to empty its saved conversations (`POST /flush`, set by `flushUrl` in the profile) and logs one line, for example `E03 T1 coder: model cache emptied (2 saved, 2.91 GB)`. Each new agent starts a fresh conversation anyway; re-reading its 12,000 to 15,000 token fixed prompt takes well under a minute, against agent runs of 6 to 51 minutes. A purge that fails is logged once and the run continues. Reviews that run at the same time are purged once, after both finish. To flush by hand: `curl -s -X POST http://127.0.0.1:8080/flush`.

**Checking that the cache is used.** After starting the server, run `node harness/local/cache-check.mjs`. It sends one growing conversation with unrelated side requests between the steps, as Claude Code does, and prints how much of each prompt was reused. From step 2 on, about 3,000 tokens (the new part) should be read afresh and the rest reused; it prints `PROBLEM` and exits 1 otherwise. A server that is not reusing its cache makes every agent step take minutes instead of seconds.

**Reading the server log.** The Terminal A output is also saved to `.driver-logs/qwen-server.log` (not committed). `Prompt Cache: N sequences, X GB` lines show the cache after each request, and `Flush:` lines show each purge. The largest `X` in the file is the peak for the run: `grep "Prompt Cache" .driver-logs/qwen-server.log | sort -t, -k2 -n | tail -1`. Under 3.5 GB is comfortable; the limit above keeps it from passing 4 GB.

**If the server still fails**, in order of how little each costs:

1. Close memory-heavy apps (browsers, editors, the Claude app) while the loop runs. Memory is shared between the CPU and GPU.
2. Restart Terminal A and run the same driver command again; it resumes where it stopped and nothing committed is lost. Add `--kv-bits 8` to the script's command to compress the cache (not tested on this model).
3. Lower `TMTS_MLX_MEMORY_GB` or `--prompt-cache-bytes`, or raise the GPU's share of memory (needs your administrator password, lasts until restart): `sudo sysctl iogpu.wired_limit_mb=26000`. Do not set it higher on a 32 GB machine.
4. Use a smaller model. This costs capability, which matters for agents that must follow a strict file format.

**Images.** The local server accepts text only. In this mode the hook refuses to open screenshots and other images (`TMTS_NO_IMAGES=1` in the profile), because one image in a conversation makes every later request fail with `404 Only 'text' content type is supported`. The driver also tells the UI reviewer (in local mode only) to check screens through page text, measured sizes, computed colours and overflow instead, to raise findings only for what it verified that way, and to put anything that needs eyes under "Not verified" rather than blocking on it. So visual-only questions do not stop the run. When an epic is approved, the driver copies that review's "Not verified" list, its screens and its screenshot paths into `comms/UI-PASS.md`, one section per epic: your checklist for a final visual pass. Skimming each epic's screenshots as it lands is cheaper than finding a problem after later epics have built on it.

The `/run-epics` command in Claude Code starts the driver without `--local`. To use the local model, run the command above in a terminal, or tell the session to run it with `--local`.

#### Other settings

Optional settings, as environment variables before the command:

| Variable | Effect |
|----------|--------|
| `TMTS_MODEL` | Model for every agent, passed to `claude --model` |
| `TMTS_MAX_TURNS` | Turn limit before it asks you (default 10) |
| `TMTS_AGENT_TIMEOUT_MIN` | Minutes before one agent run is killed (default 180; the local model needed 51 minutes for one E02 coder run, and E03's coder did not finish in 60) |
| `TMTS_MAX_BUDGET_USD` | Spend limit for each agent run |
| `TMTS_SERIAL_REVIEWS=1` | Run the two reviewers one after the other instead of together |
| `TMTS_PERMISSION_MODE` | Permission mode for agent runs (default `acceptEdits`; commands not in `.claude/settings.json` are denied) |

### What happens when it runs

Each epic goes through turns:

1. `epic-coder` builds the epic (turn 1) or responds to the last reviews (later turns).
2. `plan-reviewer` checks the code against the plan. `ui-reviewer` checks the running UI against your UI requirements.
3. If both approve in the same turn, the epic is done and merged to `main`, and the driver has an agent write `comms/Exx/SUMMARY.md`: what was accomplished and how to test it. Otherwise another turn starts.

### When it stops and asks you

- 10 turns have passed without both reviewers approving.
- An agent reports a blocker, such as a conflict in the plan or a decision only you can make.
- The coder and a reviewer have disagreed on the same finding for two turns in a row.

It writes the question to `comms/Exx/NEEDS-INPUT.md` and asks you in the conversation. Answer there, or in `comms/Exx/OWNER-NOTES.md`, then run the epic again.

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
| What the UI reviewer could not check by eye, per approved epic, with the screenshots: your final visual pass | `comms/UI-PASS.md` |
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
  UI-PASS.md                written at each approval: what still needs your eyes, per epic, with screenshots
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
| `planning/epics/` | One file per epic, built in order. A spike (`S01`, …) is a smaller piece of work slotted between epics; the driver runs it in its place in the table below, the same way as an epic |

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
| S01 | [Spike: local profiles](planning/epics/S01-local-profiles.md) | Create and load profiles, each saving its own range and passed lessons to a file under `profiles/` | E10 |
| S02 | [Spike: scrolling pitch graph](planning/epics/S02-pitch-graph.md) | Target notes stream in as black lines with your voice drawn in red; the results screen shows the whole attempt as a graph | S01 |
| E11 | [MIDI import](planning/epics/E11-midi-import.md) | Import a MIDI file and sing it as a lesson | E09 |
| E12 | [Capacitor iOS wrapper](planning/epics/E12-capacitor-ios.md) | A real iOS app installed from Xcode | E10 |
| E13 | [Hardening and polish: audio recovery, run-screen layout, UI leftovers](planning/epics/E13-hardening-polish.md) | Screens that recover when sound or the mic stops; a lesson run that fits the window; one look across screens | E12 |
| S03 | [Spike: mic check](planning/epics/S03-mic-check.md) | A Mic check screen: a loudness bar, the note you are singing, and the notes it caught | E13 |
| S04 | [Spike: narrower pitch axis on the graph](planning/epics/S04-graph-pitch-axis.md) | The pitch graph spans only the exercise notes plus 3 semitones, so sharp and flat are easy to see | S03 |
| S05 | [Spike: open on Home, not the range test](planning/epics/S05-home-first.md) | The app opens on Home; find your range or load a profile from there | S04 |
| S06 | [Spike: ignore the piano leaking into the microphone](planning/epics/S06-speaker-bleed.md) | Without headphones, staying silent in We do no longer scores the piano's notes; a notice suggests headphones | S05 |
| E14 | [Beginner path: new Stage 1, feedback levels, echo yourself](planning/epics/E14-beginner-path.md) | A rebuilt Stage 1 in four units; Learn, Practise and Prove levels; match your own recorded voice | S06 |
| E15 | [Daily practice: session, spaced mastery, review, onset coaching](planning/epics/E15-daily-practice.md) | A 12-15 minute Today's practice; lessons mastered over two days in two keys; reviews; coaching on sliding into notes | E14 |
| S07 | [Spike: clearer next step and a lighter look](planning/epics/S07-ui-journey.md) | The highlighted button is always the next step ("Next: We do", "Next lesson"); "Back to lessons" on results; softer cards and status labels | E15 |

### How each epic file is laid out

- **Goal** and **What you will review** — the outcome in plain language.
- **Depends on** — epics and specific modules it builds on.
- **Scope** — what to build, and what to leave alone.
- **Specification** — behaviour, files, function signatures.
- **Tests** — automated tests the builder must write and pass.
- **Review script** — steps for you to run by hand to accept the epic.

### Assumptions to confirm

These were decided without asking; say so if any is wrong.

1. **Sequence strip.** The view is keyboard-only. Because timing is graded, the lesson screen also shows a row of small note chips (one per note, current one highlighted, lyric underneath for songs) and a beat indicator. It is not a scrolling piano roll. Changed by S02: a scrolling pitch graph (target in black, voice in red) is added above the piano.
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
| Driver (`harness/run-epics.mjs`) | Runs the turns, keeps the indexes, stops when required | `STATUS.md`, `UI-PASS.md`, `Exx/INDEX.md`, `Exx/NEEDS-INPUT.md`, `Exx/FOR-OWNER.md` |
| `epic-summarizer` | Writes the owner summary after approval | `Exx/SUMMARY.md` |
| Owner | Gives direction | `Exx/OWNER-NOTES.md`, `planning/ui-requirements.md` |

### What a turn is

1. The coding agent works (turn 1: builds the epic; later turns: responds to the previous turn's reviews) and writes `coder.md`.
2. Both reviewers review that work and write their reviews.

The epic is approved when both reviews in the same turn say `APPROVED`. After 10 turns without approval, the loop stops and asks the owner. It also stops at once if any agent reports `BLOCKED - NEEDS OWNER`. When you answer a coder's blocker and run the epic again, the driver keeps the blocked report as `coder-blocked.md` in the same turn folder and the coder redoes that turn.

### Verdict line

Each review has exactly one line in this form near the top. The driver reads it.

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

### How the rules are enforced

The loop does not rely on the models following instructions. The driver (`harness/run-epics.mjs`) is code, and it checks every file an agent writes with `harness/validate.mjs` before moving on. You can run the same checks yourself: `node harness/validate.mjs E03 2 all`, `node harness/validate.mjs E03 summary`, `node harness/validate.mjs E03 gate`.

| Rule | Enforced by |
|------|-------------|
| Which epic and turn runs next; the 10-turn limit; stopping for the owner | The driver counts turns from the files on disk |
| Each agent writes its file (a review given only in chat does not count) | Validator: file must exist. A failing file is sent back once, then the loop stops |
| Exactly one valid verdict or status line; required sections | Validator |
| Stated blocking and non-blocking counts match the findings; `APPROVED` has no open blocking finding; `CHANGES REQUIRED` has at least one | Validator |
| Finding ids use the right reviewer, epic and turn; every earlier open finding is addressed by the reviewer and answered by the coder; blocking findings cannot be deferred | Validator |
| The coder's four checks are reported; none failed if the status is `READY FOR REVIEW`; its commit `Exx turn n: ...` exists; epic notes exist | Validator (strict mode, run by the driver) |
| UI review has real screenshots, and every screenshot it names exists | Validator |
| An epic is approved only when the latest turn has two `APPROVED` reviews and a valid coder report | `approvalGate`, run by the driver before it merges, and by a hook on any `git merge epic/...` |
| The coder edits no planning, harness, `.claude`, README or CLAUDE.md files; reviewers change nothing outside their turn folder | Driver checks the working tree after each agent, and a hook blocks the edit as it happens |
| `planning/ui-requirements.md` is edited only by you | Hook, in agent sessions |
| One README only | Hook (any session) and driver check |
| Nothing is pushed; agents do not switch, merge or reset branches | Hook, permission deny list |
| On a model that cannot see images, the UI reviewer does not block on what only eyes can judge; that goes to `comms/UI-PASS.md` | The driver adds the instruction to the UI reviewer's prompt (`uiReviewNote` in `harness/lib/comms.mjs`) when the profile sets `TMTS_NO_IMAGES=1`, and writes `UI-PASS.md` at approval (`writeUiPass`) |
| No epic is left without a valid `SUMMARY.md` | Driver writes it, validates it, and refuses to start the next epic without it |
| An agent's chained command (`cd <repo>; npm run lint 2>&1 \| tail; npm test`) runs only if every part is one it may run alone. Claude Code refuses such a line in headless runs, and the local model writes them often | Hook (`allowBash` in `harness/lib/rules.mjs`): approves the line when each part matches the allow list in `.claude/settings.json` or a read-only command, none matches the deny list, any `cd` stays in the repository, and every `>` target passes the write rules. Anything else gets the normal permission check |

What cannot be enforced is the quality of a review: a reviewer can still approve too easily. The validator requires evidence (screenshots, a coverage table, answered findings), not good judgment.

The hooks only restrict edits made with the Write and Edit tools and git commands run in the shell. A shell command such as `sed -i` can change a file without the hook seeing it; the driver's check of the working tree after each agent catches that.

To change a rule, change `harness/lib/comms.mjs` or `harness/lib/rules.mjs` and add a test in `harness/test/`, then run `npm run test:harness`.

---

## 6. Harness files

| Path | Contains |
|------|----------|
| `CLAUDE.md` | Standing rules for anyone working in this repository |
| `.claude/settings.json` | Pre-approved commands (npm, local git, screenshot tool) so a long run does not stall on prompts, and blocked commands (`git push`, `git reset --hard`, `git clean`, `git branch -D`, `rm -rf`). Edit it to widen or narrow what agents may do. |
| `.claude/agents/` | Instructions for the four agents: `epic-coder`, `plan-reviewer`, `ui-reviewer`, `epic-summarizer` |
| `.claude/skills/run-epics/SKILL.md` | The `/run-epics` command; it starts the driver and reports the result |
| `harness/run-epics.mjs` | The driver: runs the loop, owns every state change |
| `harness/validate.mjs` | Checks agent files; also usable by you |
| `harness/lib/comms.mjs` | Parsing, validation, approval gate, status and index files |
| `harness/lib/rules.mjs`, `harness/hooks/guard.mjs` | Path and command rules applied to agent sessions through a hook in `.claude/settings.json` |
| `harness/profiles/` | Run profiles such as `local.json`: environment applied to every agent session, and for the local model the `flushUrl` the driver calls after each agent |
| `harness/local/` | `start-qwen.sh` starts the local model with memory limits and saves its log; `qwen_server.py` is the launcher it runs (limits, working cache byte limit, `POST /flush`); `cache-check.mjs` tests that the server reuses its saved conversations |
| `planning/harness-local-model-memory.md` | The work order these were built from, with the measured numbers |
| `harness/test/` | Tests for the validator, rules and profiles (`npm run test:harness`) |
| `.driver-logs/` | Raw output of every agent run, per epic and turn (not committed). Look here when an agent run fails. |
| `comms/templates/` | The format of each report |
| `harness/screenshot.mjs` | Screenshot tool used by the UI reviewer |
| `harness/dev-server.mjs`, `harness/lib/app-url.mjs` | `node harness/dev-server.mjs start\|stop\|url`: the UI reviewer's dev server. It uses port 5173 when free and otherwise a free port, so a server you already have on 5173 is neither disturbed nor reviewed by mistake. Scripts in `comms/` get the address from `appUrl()`. The driver stops it after each review. Its log is `.driver-logs/dev-server.log` |
| `docs/epic-notes/` | The coder's notes per epic (created during builds) |
