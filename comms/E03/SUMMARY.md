# E03 — Vocal range assessment — Summary

**Approved:** 2026-11-15 · **Turns:** 2 · **Branch merged:** `epic/E03` into `main`

## What was accomplished

- A guided range setup at `/range`. You hold your lowest note, then your highest. Each one has a "find it" step with a live keyboard, a "3 – 2 – 1" countdown with clicks, and a 3-second recording window with a progress bar.
- The app names the note it heard and plays it back. You can use it or try again. If it hears no steady note, it shows a retry message.
- A confirm step shows the range on a keyboard padded to whole octaves, with range markers. You can nudge each limit with −/+ and hear the note. It warns if the range is too narrow, then saves.
- The range is saved in the browser and survives a reload. The home page shows it and has a "Redo range test" link.
- With no saved range, opening the app sends you to `/range`.
- A Home button on every wizard step stops the microphone and any sound.
- The range-finding logic (`findHeldNote`) records the lowest or highest note you actually held, not a passing wobble.
- Saved data is validated, and corrupt data falls back to defaults.
- Test options: `sim=range:<low>,<high>` and `sim=silent` let you run the wizard without a microphone.

## Changes made during review

- UI review: the Start button and home links were under 44 px. Start, Home and the home-page links now have a 44 px minimum.
- UI review: `/range` had no way back home. A Home button now appears on every step and stops the microphone and sound.
- Non-blocking, also fixed: an empty frame list now returns `no-voice`, and the full "3 – 2 – 1" is shown with the current digit highlighted.

## How to test it

1. Run `npm run dev` and open the URL it prints. Clear site data first. Expected: you land on `/range` (the app uses hash routing, so the URL shows `#/range`).
2. Without a microphone, open `/#/range?sim=range:45,64`. Press Start, then Record. Expected: after the countdown and the 3-second bar it shows "Lowest note: A2" and plays it. Press "Use this".
3. Press Record for the highest note. Expected: "Highest note: E4". Press "Use this".
4. On the confirm step, expected: "A2 – E4" and range markers on the keyboard. The epic text said 20 semitones, but 64−45 is 19, so the app shows 19. Nudge a limit with −/+ and you should hear the note. Press Save. Expected: you go to `/` and see the range.
5. Reload. Expected: the home page still shows the range and does not redirect.
6. Open `/#/range?sim=silent` and record. Expected: a "couldn't hear a steady note" message and "Try again".
7. Press Home during any step. Expected: you go to `/` and the sound and microphone stop.
8. With a real microphone, repeat steps 1–5 by singing, and try staying silent in a window (the review script's steps 2–6).
9. Automated checks: `npm test` (35 pass), `npm run test:e2e` (6 pass), `npm run lint`, `npm run build`.

## Not verified by the agents

- Every wizard step after Start was never seen by the UI reviewer, because the sandbox refused to run its click-through script. That covers the live keyboard, countdown, progress bar, result, failure message, and confirm step with markers, nudges and warning. You can run `node comms/E03/turn-02/ui-scripts/wizard.mjs` with the dev server up, or step through by hand.
- Whether Home is on every step, and whether it stops the microphone, was not seen. The coder added no e2e test for it.
- Hearing the countdown clicks and note playback. Whether the played note sounds like what you sang.
- Real microphone behaviour and the iPhone (review script step 7). Tap sizes on steps other than the intro were not checked on a phone-sized screen.
- Dark mode.
- The UI reviewer may have left a dev server running.

## Known issues and deferred items

- UI-E03-T2-01 (non-blocking): the intro and home pages are unstyled and their layouts differ. Deferred to the epic that builds the app shell (`comms/E03/turn-02/ui-review.md`).
- The epic's "20 semitones" example was wrong; 19 is correct (`docs/epic-notes/E03.md`).
- The coder's first two attempts timed out at 60 minutes. The limit is now 180 (`comms/E03/OWNER-NOTES.md`).

## For the owner to decide

None
