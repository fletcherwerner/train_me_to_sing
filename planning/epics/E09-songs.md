# E09 — Stage 3 songs with lyrics

## Goal

Add the five built-in songs, with lyrics, and the small lesson-screen improvements that long exercises need.

## What you will review

Stage 3 on the home screen. Sing Hot Cross Buns through to Frère Jacques with lyrics shown under the notes.

## Depends on

E08.

## Scope

In: Stage 3 content, lyric display, phrase practice, long-exercise handling.
Out: MIDI import, new song sources.

## Specification

### Content

- `src/content/builtin/stage3.ts`: the five songs from `02-lesson-catalog.md`, exactly as written there, with lyrics and the listed tolerance profiles.
- Do not alter note data to "fix" a melody. If something looks wrong, record it in the epic notes for the owner to check by ear.

### Lyric display

- `SequenceStrip` already shows a lyric under each chip (E04). For lessons with lyrics, also show a large "now singing" line above the keyboard: the current syllable in bold with the previous and next two syllables in lighter text.

### Phrase practice

Songs are long for a beginner, so a lesson may be practised in phrases.

- Add optional `phrases?: { startNote: number; endNote: number; label: string }[]` to `ExerciseTemplate` (note indices, inclusive). Define phrases for each song at natural line breaks (e.g. Twinkle: six phrases of seven notes).
- In **I do** and **We do**, a phrase selector ("Whole song", "Line 1", "Line 2", …) limits playback and the practice score to that phrase. Implement as a pure function `slicePhrase(ex: ResolvedExercise, phrase): ResolvedExercise` that re-bases `startSec` to 0 and keeps the same pitches.
- **You do** always uses the whole song. Only the whole song is graded and saved.

### Long-exercise handling

- `SequenceStrip` keeps the current chip visible (auto-scroll) and never grows taller than three rows; older rows scroll away.
- Results: missed notes grouped by phrase label, e.g. "Line 3: 2 missed".
- The lead-in stays at 4 clicks at the song's tempo, for whole songs and for single phrases.

### Range

- Frère Jacques spans 14 semitones and Twinkle 9. The existing "doesn't fit" handling applies. No transposition tricks.

## Tests

- Stage 3 lessons pass the generic content tests (lyric count equals note count).
- Total beats per song match expected values: Hot Cross Buns 16, Mary 32, Ode to Joy 32, Twinkle 48, Frère Jacques 32.
- `slicePhrase`: first note starts at 0; pitches unchanged; `totalSec` equals the phrase length.
- Phrases for each song cover every note exactly once, in order.
- Playwright `?sim=perfect`: complete s3-01; passes. In We do, select "Line 1" — only that line's chips are shown as played.

## Review script

1. Home shows Stage 3 with five songs.
2. Open Hot Cross Buns. In I do, listen: the tune must be recognisably correct. Lyrics advance in time with the notes.
3. Do the same listening check for the other four songs. **Report any wrong note** — this is the one thing the builder could not verify.
4. In We do, choose "Line 1" and practise only that line.
5. You do: sing the whole song; the result groups misses by line.
6. On the iPhone, check that the lyric line, keyboard and strip all fit on screen without scrolling the page during a song.
