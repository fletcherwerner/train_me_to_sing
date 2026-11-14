# E11 — MIDI import

## Goal

Let the student turn a MIDI file's melody into a lesson that behaves like any built-in lesson.

## What you will review

Import a `.mid` file, choose its melody track, and sing it as a lesson that appears in a "My songs" section.

## Depends on

E09 (song handling), E07 (registry). Uses `StoredData.importedLessons` and `LessonSource`, which exist from the start for this purpose.

## Scope

In: MIDI parsing, conversion to `ExerciseTemplate`, import screen, imported-lesson source, delete.
Out: lyrics from MIDI, polyphonic parts, tempo changes mid-song, MusicXML.

## Specification

### Dependency

Add `@tonejs/midi` for parsing only (it does not require Tone.js audio).

### `src/core/exercise/fromMidi.ts` (pure; takes already-parsed data)

```ts
interface RawMidiNote { midi: number; startBeat: number; durationBeats: number; }
interface RawMidiTrack { name: string; notes: RawMidiNote[]; }

summariseTrack(track): { noteCount: number; lowMidi: number; highMidi: number; overlapRatio: number }
toTemplate(track: RawMidiTrack, opts: { id: string; title: string; tempoBpm: number; beatsPerBar: number;
  startBeat?: number; endBeat?: number }): ExerciseTemplate
```

`toTemplate` steps:
1. Keep notes within `[startBeat, endBeat)` if given.
2. Make monophonic: sort by start; where notes start within 0.05 beats of each other keep the highest; where a note overlaps the next, shorten it to end at the next note's start.
3. Quantise starts and durations to the nearest 1/4 beat (sixteenth note). Drop notes that quantise to zero length.
4. Shift so the first note starts at beat 0.
5. Tonic = the lowest note. `offset = midi − tonic` (all offsets ≥ 0).
6. Return the template. Reject (throw) if there are fewer than 3 notes or more than 400.

`overlapRatio` = share of notes that overlap another note; used to warn that a track looks like chords rather than a melody.

### `src/content/importedSource.ts`

- A `LessonSource` that returns `StoredData.importedLessons`. Registered at start-up.
- Store actions `addImportedLesson(lesson)` and `removeImportedLesson(id)` (also removes its progress).
- Imported lessons: `stage: 3`, `source: 'imported'`, `toleranceId: 't3'`, `passScore: 0.8`, id `imp-<timestamp>`.

### Import screen (`/import`)

1. File picker (`.mid`, `.midi`). Parse with `@tonejs/midi`. Convert tick positions to beats using the file's PPQ. Read the first tempo and time signature (defaults 100 bpm, 4/4).
2. Track list: only tracks with notes. Each row shows name, note count, lowest–highest note, and a "looks like chords" warning when `overlapRatio > 0.3`. A "Preview" button plays the first 8 bars through `tonePlayer` at original pitch.
3. Options: title (default: file name), tempo (editable number, 40–160), optional bar range (start bar, end bar).
4. Summary: note count, span in semitones, and whether it fits the student range ("Fits" or "Needs N semitones; your range is M" — import is still allowed).
5. "Add lesson" saves and returns home.

### Home

- New section "My songs" listing imported lessons, shown only when there is at least one. Each row has a delete action with confirmation.
- "Import a MIDI file" link at the bottom of the home screen.

### Export/import interaction

- Imported lessons are already part of `StoredData`, so they travel with export/import (E10). Add a test.

## Tests

- `toTemplate`: chord of three simultaneous notes keeps the top one; overlapping notes are trimmed; quantisation of start 1.02 → 1.0; offsets relative to the lowest note; range `[startBeat, endBeat)` respected; fewer than 3 notes throws.
- A small fixture MIDI file (C major scale, one track) checked into `tests/fixtures/` parses to offsets `0 2 4 5 7 9 11 12`.
- Imported lessons pass the generic content tests and `fit`.
- Playwright `?sim=perfect`: import the fixture, open the new lesson, pass it; delete it; it disappears along with its progress.

## Review script

1. Find a simple single-melody MIDI file (search for a nursery rhyme `.mid`).
2. Home → Import a MIDI file → choose it. Preview the tracks and pick the melody.
3. Trim to the first 8 bars, set a comfortable tempo, add the lesson.
4. It appears under "My songs". Run it: I do plays the tune in your range; We do and You do work as usual.
5. Import a file with chords and confirm the warning appears.
6. Delete the imported lesson.
