# E09 — Stage 3 songs with lyrics — Summary

**Approved:** 2026-11-15 · **Turns:** 2 · **Branch merged:** `epic/E09` into `main`

## What was accomplished

- Home now shows **Stage 3** with five songs: Hot Cross Buns, Mary Had a Little Lamb, Ode to Joy, Twinkle Twinkle, Frère Jacques. Notes, lyrics and tempi are exactly as in the lesson catalog; no note data was changed.
- Lessons with lyrics show a large "now singing" line above the keyboard. The current syllable is bold and large, with the previous syllable and the next two in lighter text.
- **Phrase practice:** in I do and We do a "Practise" selector (Whole song, Line 1, Line 2, …) limits playback and the practice score to that line. Each song has lines at its natural breaks (Twinkle: six lines of seven notes). You do always uses the whole song, and only that attempt is graded and saved.
- **Long songs:** the note strip auto-scrolls to keep the current note visible and stays at three rows or fewer while playing. The lead-in is still 4 clicks at the song's tempo, for lines too.
- **Results** list misses by line (for example "Line 3: 2 missed"), and the results strip shows every note with its hit/miss label.
- Frère Jacques (14 semitones) uses the existing "doesn't fit" range handling.

## Changes made during review

- UI-E09-T1-01: on a laptop (1280×800) the Stop button was pushed below the fold in long songs. The piano is now shorter and spacing tighter at laptop heights. Stop is visible in I do, We do and You do.
- UI-E09-T1-02: results chips were clipped and only 15 to 33 of 42 notes showed. Results now show every chip, and the chips are tall enough for the hit/miss label.

(Non-blocking turn 1 items were also fixed: layout shift between steps, the syllable size, and the tip and list layout in results.)

## How to test it

1. `npm install`, then `npm run dev` and open the printed URL.
2. Home: Stage 3 lists five songs.
3. Open Hot Cross Buns, then I do. Listen: the tune should be recognisable and the lyrics should advance with the notes.
4. Repeat the listening check for the other four songs. Report any wrong note.
5. In We do, choose "Line 1". Only that line plays and is scored, and only its chips show as played.
6. In You do, sing the whole song. Results group misses by line.
7. Without a microphone, use the simulated singer: open `/#/?sim=perfect` (a pass) or `/#/?sim=silent` (misses grouped by line). `sim=flat40` also gives misses.
8. Automated checks: `npm run lint`, `npm test` (197 pass), `npm run test:e2e` (22 pass), `npm run build`.

## Not verified by the agents

- Listening to the melodies. This is the main open check: all five songs need an ear test for wrong notes.
- The audible 4-click lead-in, and lyrics advancing in time with the sound.
- The fit on a real iPhone. It was only approximated at 393×852 in Chromium.
- Real microphone singing. Only the simulated singer was used.

## Known issues and deferred items

- UI-E09-T2-01 (non-blocking): while You do runs, the page is 16 to 18 px taller than the window, so it can scroll slightly (laptop and phone). Trim about 20 px of padding.
- UI-E09-T2-02 (non-blocking): on narrow strip chips, note names like "F#3" and syllables like "Twin" are cut off at the edge.
- A small layout difference remains between steps (turn 2 UI review).
- Frère Jacques ends "ding dang dong" on `0 -5 0:2`. The data was kept as in the catalog; check it by ear (`docs/epic-notes/E09.md`).
- Phrases other than Twinkle's were chosen by the coder from the lyric line breaks. The practice score for a phrase is not saved.

## For the owner to decide

None. There is no `FOR-OWNER.md`, and both reviews proposed no requirement changes.
