# E01 — Foundation: scaffold, music core, piano — Summary

**Approved:** 2026-11-14 · **Turns:** 2 · **Branch merged:** `epic/E01` into `main`

## What was accomplished

- A working project: Vite, React and TypeScript in strict mode, served over HTTPS in development (needed for the microphone later), with lint, unit tests, end-to-end tests and a production build. A lint rule stops the pure `core/` code from importing audio, UI or storage code.
- Music maths in `core/music/notes.ts`: MIDI to frequency and back, note names, cents between two pitches, black-key detection.
- Sound output: one shared audio context that is unlocked by a tap, and a tone player that plays a note with a short attack and release.
- A piano keyboard component that shows a target key (blue), a sung key (green when it matches the target, orange when it does not), range markers, and an edge arrow with the note name when the sung note is off the keyboard. Keys are tappable.
- Two screens: a home page (`/`) and a piano test page (`/dev/piano`) with a Home link and low/high range inputs.

You can now see and hear every note on a piano and see how target and sung notes will look. Nothing listens to you yet; that starts in E02.

## Changes made during review

- Turn 1 blocking finding: `/dev/piano` had no way back to the home screen (UR-26). Fixed with a Home link.
- Turn 1 non-blocking findings, also fixed in turn 2: phone tap targets are at least 44 px for the Start button, inputs and Home link, and the sung, octave and edge-marker states can be reached by URL.

## How to test it

1. Run `npm install` once, then `npm run dev`.
2. Open `https://localhost:5173/#/dev/piano` and accept the certificate warning.
3. Click **Start**. Expected: no sound, and the button changes to "Started" and greys out. This only unlocks audio.
4. Click several keys. Expected: each plays and lights up blue for half a second, and C4 sounds lower than C5. Black keys work too.
5. Change Low MIDI to 40 and High MIDI to 64. Expected: the keyboard redraws, with each C labelled correctly.
6. Check the displayed states using the page address:
   - `#/dev/piano?target=64&sung=64` shows the sung key green.
   - `#/dev/piano?target=64&sung=62.4` shows target blue and sung key orange.
   - `#/dev/piano?target=64&sung=52` shows the sung key an octave away from the target.
   - `#/dev/piano?sung=80` shows an orange edge arrow with the note name.
   - `#/dev/piano?markerLow=48&markerHigh=67` shows range markers under the keys.
7. Narrow the browser to phone width. Expected: keys stay visible and clickable, with no sideways scrolling.
8. Click **Home**. Expected: you return to the home page.
9. On the iPhone: `npm run dev -- --host`, open `https://<laptop-ip>:5173/#/dev/piano` in Safari, accept the certificate, repeat steps 3 and 4. Check the ringer switch is not on silent.
10. Automated checks: `npm test` (13 tests), `npm run test:e2e` (1 test), `npm run lint`, `npm run build`. All four passed in both reviews.

## Not verified by the agents

- Sound: the pitch of each key by ear and that audio plays at all on speakers. The pitch maths is unit tested.
- Real iPhone touch behaviour. Pointer events were only simulated.
- That the Home link navigates. The UI reviewer saw it but did not click it.

## Known issues and deferred items

- The Start button gives no message. A first click shows only the label changing to "Started", which can look like nothing happened. Raised by the owner after approval; not yet recorded as a requirement or a fix.
- Keys are small on very narrow screens: about 24 px per white key at 360 px with 15 white keys (`docs/epic-notes/E01.md`).
- How far flat or sharp a sung note is shows only as a colour change, not a number. The UI reviewer expects E02 to add this (UR-03).
- One non-blocking UI finding is still open in `turn-02/ui-review.md`.

## For the owner to decide

Neither review proposed requirement changes or asked a question. One decision comes from your own observation: whether to reopen E01 to add an "Audio ready, tap a key" message beside Start, or fold it into a later epic and add a UI requirement for it.
