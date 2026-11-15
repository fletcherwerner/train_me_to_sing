# E04 — Exercise model, range fitting, "I do" playback — Summary

**Approved:** 2026-11-15 · **Turns:** 3 · **Branch merged:** `epic/E04` into `main`

## What was accomplished

- Exercises are now range-independent data. A short text notation such as `0 2 4:2 r 4` is parsed into notes, and the notes are moved into your stored range. The fit picks the tonic and the lowest and highest note. If the exercise is too wide, it reports "Needs N semitones; your range is M."
- A player schedules the melody and metronome on the audio clock. Every playback starts with exactly 4 lead-in clicks at the exercise tempo, whatever the time signature. The exercise begins on the beat where a fifth click would fall.
- A developer page at `/#/dev/exercise` lets you pick one of three exercises: `0 2 4`, a scale, and Hot Cross Buns with lyrics. It shows the tonic and the fit result. It also shows a keyboard with range markers and the lit current note, a strip of note chips (with lyrics), and beat dots with a large count-in number. Buttons: Play, Repeat, Stop. With no stored range, it links to `/range`.
- A Home link takes you back.

## Changes made during review

- Phone tap targets were about 43 px and the select and Home link about 18 px (UR-23). Turn 2 reported a fix but committed only the report. Turn 3 gave buttons, inputs, the select and the Home link a 48 px minimum height and width, and capped the keyboard at 180 px.
- Turn 2 plan review: the reported fixes were not in the code. Turn 3 committed them.
- Non-blocking, fixed: `usePlaybackPosition` returned the wrong phase before the count-in when there is no start note. It now takes an optional `hasStartNote` argument.

## How to test it

1. Run `npm install`, then `npm run dev`. Complete range setup at `/#/range` if you have not.
2. Open `/#/dev/exercise`. Expect the tonic and the fit result for your range, with range markers on the keyboard.
3. Choose `0 2 4` and press Play. Expect exactly 4 clicks at 60 bpm, then three notes starting on the next beat. Each key should light as its note sounds, and the chips should advance with the sound.
4. Play the scale and Hot Cross Buns. Lyrics appear under the chips, and the tune is recognisable.
5. Press Stop mid-way. Sound stops at once. Press Repeat, and it starts again from the count-in.
6. Redo the range test with a noticeably different range. The same exercise plays at a different pitch, still inside the range markers.
7. Clear the stored range and reload. Expect a link to `/range`.
8. Repeat on the iPhone. Controls should be easy to tap, and nothing should scroll sideways.
9. Automated checks: `npm test` (49 pass), `npm run test:e2e` (8 pass), `npm run lint`, `npm run build`.

## Not verified by the agents

- Everything audible: the 4 clicks, note and key timing, Stop and Repeat while playing, and recognisable melodies. The coder checked timing only in headless Chromium.
- The count-in display, mid-play chip highlight, Hot Cross Buns lyrics, and the "Needs N semitones" failure message. The UI reviewer could not capture them.
- A different range, dark mode, and the narrow-range phone layout with the 180 px keyboard cap.
- Anything on a real iPhone.

## Known issues and deferred items

- Play is disabled during playback. Repeat restarts from the count-in (`docs/epic-notes/E04.md`).
- The lesson catalog does not exist yet. Hot Cross Buns and the property test use inline templates (`docs/epic-notes/E04.md`).
- There is no unit test for the new `hasStartNote` branch (turn 3 coder report).
- The 48 px tap-target rules apply at every width, not only on phones (turn 3 coder report).
- Open non-blocking UI-E04-T3-01: count-in and mid-play states have no screenshot.

## For the owner to decide

None
