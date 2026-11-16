# E11 — MIDI import — Summary

**Approved:** 2026-11-15 · **Turns:** 1 · **Branch merged:** `epic/E11` into `main`

## What was accomplished

- You can now turn a MIDI file's melody into a lesson. A new `/import` screen takes a `.mid` or `.midi` file and lists its tracks that contain notes. Each row shows the track name, note count and lowest-to-highest note. A track that looks like chords gets a "looks like chords" warning.
- Each track has a Preview button that plays its first 8 bars at the original pitch.
- You can set the title (the file name by default), the tempo (40–160) and an optional first and last bar. A summary then shows the note count and span, and says "Fits" or "Needs N semitones; your range is M". Import is allowed either way.
- "Add lesson" saves the lesson and returns home.
- Home has a new "My songs" section. It appears only when you have imported lessons, and each row has Delete with a confirmation. Deleting also removes that lesson's progress.
- Home also has an "Import a MIDI file" link.
- Imported lessons behave like other stage 3 lessons: pass score 0.8, same status display, and greyed out when they don't fit your range. They are listed only under My songs, not under Stage 3. They don't feed the "Continue" card.
- Imported lessons are part of the saved data, so they travel with the E10 export and import.

## Changes made during review

None. Both reviews approved in turn 1.

## How to test it

1. Setup: run `npm install`, then `npm run dev` and open the printed URL. Start from a clean browser profile. Test files are `tests/fixtures/c-major-scale.mid` and `tests/fixtures/two-tracks.mid`. `npm run fixtures` regenerates them.
2. On Home, choose "Import a MIDI file". You should reach `/import`, which has a "← Home" link and a file picker.
3. Choose `two-tracks.mid`. You should see a track list. The chord track shows the "looks like chords" warning and the melody track does not.
4. Select the melody track. The summary shows the note count and span, and either "Fits" or "Needs N semitones; your range is M".
5. Set a bar range (for example 1 to 8) and a comfortable tempo, then press "Add lesson". You should return home, and "My songs" should list the new lesson.
6. Open the lesson and run it. I do should play the tune in your range, and We do and You do should work as usual. For a quick pass, use the `?sim=perfect` query option.
7. Press Delete on the lesson and confirm. It should disappear from My songs, the section should vanish if it was the last one, and its progress should be gone.
8. Optional: import a real nursery-rhyme `.mid` file, and also try an unreadable or empty file. You should get a plain error message.
9. Automated checks: `npm run lint`, `npm test` (259 passed), `npm run test:e2e` (31 passed) and `npm run build`. The plan reviewer ran all four and they passed.

## Not verified by the agents

- Preview audio (needs speakers).
- Running an imported lesson by hand. Only the e2e test covered it.
- A real nursery-rhyme `.mid` file. Only the generated fixtures were used.
- iPhone Safari, including its file picker.
- The error state for an unreadable file. The code and e2e test cover it, but it wasn't captured on screen.

## Known issues and deferred items

- Preview plays at the tempo field's value, not the file's original tempo. Pitches are original (`docs/epic-notes/E11.md`).
- Tempo changes mid-file and later time signatures are ignored. This was out of scope (`docs/epic-notes/E11.md`).
- Bar numbers are 1-based and inclusive, using the file's first time signature (`docs/epic-notes/E11.md`).
- UI-E11-T1-01, non-blocking: on the phone, the "Last bar" field wraps away from "First bar" and the labels sit inline. Stacking the labels would tidy it.
- UI-E11-T1-02, non-blocking: the Delete button on Home is tall and heavy next to the lesson rows on the phone.

## For the owner to decide

None.
