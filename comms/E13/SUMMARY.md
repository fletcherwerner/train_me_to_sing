# E13 — Hardening and polish: audio recovery, run-screen layout, UI leftovers — Summary

**Approved:** 2026-11-16 · **Turns:** 1 · **Branch merged:** `epic/E13` into `main`

## What was accomplished

- **Audio recovery.** The range test, lessons and calibration now notice when sound will not start or stops mid-run. They show "Sound is paused on this device…" or "The sound stopped…" and offer Try again. The range test's Record no longer freezes on the 3-2-1 countdown. A lesson run that stalls is not scored. A stalled You do saves no attempt and shows no Results. The three dev pages that play sound also check that audio is running.
- **Microphone lost or missing.** An unplugged microphone stops the lesson run and shows "Reconnect microphone" in place of the run button. The lesson keeps its step and earlier results. The range test's Try again and calibration's Retry reconnect. A missing microphone gets its own message instead of the generic one.
- **Run-screen layout.** The lesson run screen fits the window on the laptop (1280×800) and the phone (393×852). Title, step, graph, piano, Target/Sung, chips and the run button are all visible. The chip strip is one row that scrolls sideways, so the controls no longer cover it. The graph has a legend. The piano key colour now follows the lesson's tolerance. Piano labels are larger. The results order was reworked, with one Home and a heading on the missed-notes list.
- **One look.** Buttons, links, the Home header and dialogs share one style in light and dark mode. Each screen has one primary button. The Settings import prompt is boxed, with Merge as the primary and Replace marked as a danger. Developer links are gone from Settings. Home rows and the Import MIDI form were tidied.
- **Small fixes.** A failed save (full or blocked storage) now shows a notice instead of losing the attempt silently. Dev-only test hooks (`window.__tmtsTest`) exist only when the URL has `sim=`.

## Changes made during review

None. Approved in turn 1.

## How to test it

1. Run `npm run dev` and open the printed URL. Run `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build` and `npm run test:harness`. Expected: all pass (reviewers saw 276 unit tests and 47 e2e tests pass).
2. Settings → Redo range test → Start → Record. The countdown runs and a note is recorded. Press Try again, then Record. It counts down again.
3. During a countdown, switch headphones or sleep and wake the laptop. Within a few seconds the screen says the sound stopped and offers Try again, which works.
4. Start a lesson. In We do, pull out the headphones or turn Bluetooth off. The run stops with the "disconnected" or "sound stopped" message. Tap the offered button. The lesson carries on from the same step.
5. Open Hot Cross Buns and run You do on the laptop. You can see the title, step, graph, piano, Target/Sung, chips and Stop without scrolling.
6. Do the same on the phone (or a 393×852 window). Stop does not cover the chips.
7. Without a microphone, add `?sim=flat40` to a lesson URL and run You do. The sung piano key is not green when the note is out of tolerance, and the result marks misses.
8. On results, check the buttons sit under the tip. There is one Home, the graph has a legend, and the missed-notes list has a heading.
9. Walk Home → Settings → Calibrate → Import MIDI → Range test in light and dark mode. Buttons and Home look the same on each screen, and one button stands out as the next step.
10. Settings → Import progress with an export file. The prompt is boxed and in view, Merge stands out, and Replace is set apart with a warning.
11. Check that Settings no longer lists developer pages, and that "Open the tuner" works in a production build (`npm run build`, then serve it).
12. Simulated checks: with `sim=` in the URL, run `window.__tmtsTest.suspendAudio()` or `loseMic()` in the console during a run. Expected: the stopped or reconnect message appears.

## Not verified by the agents

- Review steps 2–4 with real headphones, Bluetooth, or sleep and wake. Reviewers used only the `suspendAudio` and `loseMic` test hooks.
- The range-test failure screens and the Calibrate recovery screen.
- A flat note sung by ear (step 7). The reviewer saw an orange sung key under `sim=flat40` only.
- Dark mode on every screen.
- The Import progress prompt (it needs a file picked).
- Whether Settings lists only "Open the tuner" in a production build. The dev server shows dev links by design.
- The 393×660 window (the plan reviewer checked it in e2e, but the UI reviewer did not look at it).
- Anything on a real iPhone or with a real microphone.

## Known issues and deferred items

- `tsconfig.tsbuildinfo` is still tracked in git, because the agent environment refused `git rm --cached` (`docs/epic-notes/E13.md`, plan review). The `.gitignore` entry is in place.
- On very wide ranges (about five octaves or more) the piano on a 393 px phone is under 80 px high (`docs/epic-notes/E13.md`).
- UI-E13-T1-01: on the phone the last visible chip is cut at the right edge with no hint that more follow. This is the sideways scroll working as specified.
- UI-E13-T1-02: about 25% of a tall phone screen is empty below Stop. The graph and piano could grow.
- The graph height changed from S02's fixed 160/220 px to `clamp(110px, 15vh, 160px)`. The import summary wording gained "N lessons passed, M attempted". Both are recorded in `docs/epic-notes/E13.md`.
- `PitchSource` gained an optional `onLost` method, a change to a shared type in `planning/01-architecture.md` (`docs/epic-notes/E13.md`).
- The epic's "Left for the owner" list is untouched: listening to all 21 melodies, device and iPhone runs, tolerance feel, GitHub Pages deploy, iOS bundle id and tooling, rewording UR-01 and UR-22, and profiles on the phone.

## For the owner to decide

- Run `git rm --cached tsconfig.tsbuildinfo` and commit. Agents are not allowed to do this (D2).
