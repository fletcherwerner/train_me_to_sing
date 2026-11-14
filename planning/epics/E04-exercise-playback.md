# E04 — Exercise model, range fitting, "I do" playback

## Goal

Define exercises as range-independent data, transpose them into the student range, and play them while showing each note on the piano. This is the "I do" step.

## What you will review

A page where you pick a sample exercise; it plays in your range, lighting each key in time, with a strip of note chips and a Repeat button.

## Depends on

E01 (`tonePlayer`, `PianoKeyboard`), E03 (stored range).

## Scope

In: `core/exercise` (types, notation, fit), exercise player, metronome, `SequenceStrip`, `BeatIndicator`, `/dev/exercise`.
Out: microphone during playback, scoring.

## Specification

### `src/core/exercise/types.ts`

Types from the architecture file.

### `src/core/exercise/notation.ts`

```ts
parseNotation(text: string, lyrics?: string[]): TemplateNote[]
```

- Split on whitespace. Token `a:b` → offset `a`, beats `b`; token `a` → beats 1. Offset `r` is a rest: it advances time and produces no note.
- Offsets are integers and may be negative. Beats are positive numbers (`.5`, `1.5`).
- `startBeat` accumulates from 0.
- If `lyrics` is given its length must equal the number of notes; assign in order. Throw a descriptive `Error` on any invalid token or length mismatch.

### `src/core/exercise/fit.ts`

`fit(template, range)` exactly as specified under "Range fitting" in the architecture file.

Also `displayRange(range): { lowMidi, highMidi }` — the keyboard span to draw: extend `lowMidi` down to the nearest C and `highMidi` up to the nearest B.

### `src/audio/metronome.ts`

- `scheduleClick(tSec: number, accent: boolean)` — a 30 ms noise-free tick: square oscillator at 1000 Hz (accent 1500 Hz), gain 0.15.

### `src/audio/exercisePlayer.ts`

```ts
interface PlaybackOptions {
  playMelody: boolean;       // false in "You do"
  metronome: boolean;
  playStartNote: boolean;    // play the first note for 1 beat before the lead-in
}
export const LEAD_IN_CLICKS = 4;   // always 4, in every step; not configurable per lesson
interface PlaybackHandle {
  startSec: number;          // audio-clock time of exercise beat 0
  endSec: number;
  stop(): void;
  done: Promise<void>;       // resolves at endSec, or when stopped
}
playExercise(ex: ResolvedExercise, opts: PlaybackOptions): PlaybackHandle
```

- Timeline: `t0 = now() + 0.2`. If `playStartNote`, play note 0 for one beat at `t0`, then one beat of silence. Then the lead-in: exactly `LEAD_IN_CLICKS` (4) metronome clicks, one beat apart at the exercise's `tempoBpm`, accent on the first. The lead-in sets the tempo for the student. `startSec` is one beat after the fourth click, so the exercise begins exactly where a fifth click would fall.
- The lead-in is the same in I do, We do and You do, for every lesson, song and phrase, whatever the time signature. It always plays, even when `metronome` is false (that option only controls clicks during the exercise).
- Schedule all melody notes and metronome clicks up front on the audio clock.
- `stop()` calls `tonePlayer.stopAll()` and resolves `done`.

### `src/ui/hooks/usePlaybackPosition.ts`

- Given a `PlaybackHandle` and the exercise, returns `{ phase: 'startNote' | 'countIn' | 'playing' | 'done', currentNoteIndex: number | null, beatInBar: number, countInRemaining: number }`, updated on `requestAnimationFrame` from `now()`.
- `currentNoteIndex` is the note whose `[startSec, startSec + durationSec)` contains the current time; `null` during rests.

### `SequenceStrip` component

- Props: `notes: ResolvedNote[]`, `currentIndex: number | null`, `results?: (boolean | undefined)[]`.
- One chip per note: note name, lyric below if present. Chip width proportional to duration (min 28 px). Current chip highlighted; chips with a result are green (true) or red (false).
- Wraps onto multiple lines. The current chip is scrolled into view.

### `BeatIndicator` component

- Props: `beatsPerBar`, `beatInBar`, `countInRemaining`.
- A row of dots, the current beat filled. During count-in, shows the remaining count as a large number.

### `/dev/exercise` page

- Dropdown of three hard-coded templates: `0 2 4` (60 bpm), `0 2 4 5 7 5 4 2 0:2` (60 bpm), and Hot Cross Buns from the lesson catalog with lyrics.
- Shows the fit result: tonic name, lowest and highest note. If the fit fails, shows "Needs N semitones; your range is M."
- Keyboard using `displayRange`, with `rangeMarkers` and `targetMidi` = current note.
- `SequenceStrip`, `BeatIndicator`.
- Buttons: "Play" (melody on, metronome on, no start note), "Repeat" (same again), "Stop".
- If no range is stored, link to `/range`.

## Tests

- `parseNotation`: `"0 2 4:2 r 4"` → four notes with start beats 0, 1, 2, 5; errors on `"x"`, `"0:0"`, lyric count mismatch.
- `fit`: template offsets 0–4 in range 45–64 → lowest note 52, tonic 52; template with offsets −5..9 → tonic = lowest + 5; span 12 in a 10-semitone range → `ok: false` with both numbers; every resolved note is inside the range (property test over random ranges and the catalog templates).
- Timing: at 60 bpm, note 2 of `0 2 4` has `startSec` 2 and `durationSec` 1.
- Lead-in: extract the timeline as a pure function and test it. At 60 bpm there are 4 clicks 1 s apart and `startSec` is 1 s after the last; at 120 bpm they are 0.5 s apart; a 3/4 template still gets 4 clicks.
- Playwright: on `/dev/exercise` with a seeded range, press Play; the chip highlight advances and reaches the last note.

## Review script

1. Complete range setup if you have not.
2. Open `/#/dev/exercise`. The page states the tonic and that the notes fit your range.
3. Play the three-note exercise. You hear exactly 4 clicks at the exercise tempo, then three notes starting on the next beat; each key lights exactly when its note sounds; chips advance together with the sound.
4. Play the scale and Hot Cross Buns (lyrics appear under the chips; the tune is recognisable).
5. Press Stop mid-way — sound stops at once. Press Repeat — it starts again from the count-in.
6. Redo the range test with a noticeably different range; the same exercise now plays at a different pitch, still inside the range markers.
7. Repeat on the iPhone.
