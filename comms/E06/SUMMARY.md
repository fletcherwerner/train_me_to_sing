# E06 — Full lesson session: I do / We do / You do — Summary

**Approved:** 2026-11-15 · **Turns:** 3 · **Branch merged:** `epic/E06` into `main`

## What was accomplished

- A lesson screen at `/lesson/demo` runs one hard-coded lesson (notes `0 2 4 2 0`, 60 bpm, pass mark 80%) from an intro through I do, We do and You do to a results screen. The Home screen links to it.
- The intro gives the goal and a headphones reminder. Start unlocks audio and asks for the mic once.
- Every run begins with a 4-click lead-in. A Stop button shows while a run is going.
  - **I do:** you listen and watch. Next stays disabled until you have played it once.
  - **We do:** you sing along and see a practice line such as "3 of 5 notes". It is not saved.
  - **You do:** the start note sounds, then the clicks. The melody is silent. When the run ends, results appear on their own.
- The results screen shows Passed or Not yet, the note count and percentage, the pass mark and coloured note chips. Tapping a chip plays that note. It also lists missed notes with a reason and gives one tip based on the most common miss. "Try again" and "Hear it again" go back to You do and I do.
- The lesson fits to your stored range. With no range it redirects to `/range`. If the fit fails, it shows a message and a link home.
- Leaving the screen stops playback and the mic.
- Under the hood: a pure session state machine, a tip picker, a `Lesson` type and tests, including e2e tests for a perfect run, an octave-down run and the no-range redirect.

## Changes made during review

- UI-E06-T1-01 / UI-E06-T2-01 (blocking): the reviewer could not see the lesson steps and results because the click-through script was refused. The owner checked them from screenshots and cleared both. The harness was fixed so the script now runs.
- Owner request in turn 3: results chips clipped their text at 393 px (for example "F#3" showed as "F#"). Result chips now have a 60 px minimum width, and the UI reviewer confirmed they fit.
- UI-E06-T1-02 (Home link too small to tap, blocking) was ruled non-blocking by the owner and deferred.

## How to test it

1. Run `node harness/dev-server.mjs start`. Set a range at `/#/range` first. The simulated-mic options `?sim=perfect` and `?sim=octaveDown` let you run without singing.
2. Open `/#/lesson/demo`. You should see the intro and a Start button. Press Start and allow the mic.
3. I do: Next is disabled. Press Play, hear the clicks, then the piano. Next is now enabled. Repeat works.
4. We do: press Sing along. You hear the piano, see the target key (blue) and your own key (orange). A "Practice run: x of 5 notes." line appears. Repeat once. Back to I do works.
5. You do: you hear the start note, then four clicks, then clicks only. After the run, results appear on their own.
6. Results: the score matches what you sang. Tapping a chip plays the note. The missed-note list and the tip make sense. With `?sim=octaveDown` you should see "Not yet, 0 of 5", "Right note, wrong octave" and the octave tip. With `?sim=perfect` you should see "Passed, 5 of 5 (100%)".
7. "Try again" returns to You do. "Hear it again" returns to I do.
8. Navigate away mid-run. Sound stops and the browser's mic indicator turns off.
9. Clear the stored range and open `/#/lesson/demo`. You should land on `/range`.
10. At 393 px width, nothing scrolls sideways and the results chips show their full text.
11. Automated checks: `npm test` (76 pass), `npm run test:e2e` (13 pass; each lesson spec takes about 30 s), `npm run lint`, `npm run build`. All passed at the last turn.
12. Optional click-through with screenshots: `node comms/E06/turn-03/ui-scripts/flow.mjs perfect` (or `octaveDown`).

## Not verified by the agents

- A real microphone, real sound (piano, clicks, start note), the mic indicator turning off and a physical iPhone (review script steps 1–8 with real hardware).
- Dark mode.
- The turn-3 chip fix was checked by the UI reviewer in screenshots, not on a phone.

## Known issues and deferred items

- Home link styling (UI-E06-T2-02, UI-E06-T1-03). The owner deferred it to the final UI pass (`comms/E06/turn-03/ui-review.md`).
- Dot spacing in the step labels ("I do· We do· You do") and the centred per-note list on the results screen. The owner left both for the final UI pass (`comms/E06/OWNER-NOTES.md`).
- Only the `demo` lesson resolves. Progress is not saved, and `onAttemptComplete` is a no-op until E07 (`docs/epic-notes/E06.md`).
- The redirect to `/range` drops the `?sim` query (`docs/epic-notes/E06.md`).
- A You do run with no mic source ends silently with no message. This is unlikely because the mic opens on Start (PLAN-E06-T1-02, marked fixed in turn 2).

## For the owner to decide

None. No `FOR-OWNER.md` was written, and the reviews propose no requirement changes.
