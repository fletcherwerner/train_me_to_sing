# S06 — Spike: ignore the piano leaking into the microphone

## Goal

Without headphones, the app's own piano reaches the microphone. In We do the melody plays while the attempt is scored, so a student who sings quietly (or not at all) is credited with the piano's notes, and the red line on the graph follows the piano. The microphone runs with echo cancellation off (`src/audio/pitch/MicPitchSource.ts:48`), on purpose: echo cancellation distorts the voice, and fails worst when voice and piano sing the same pitch, which is exactly the We do case.

Fix it by measuring how loud the piano is at the microphone, then ignoring input that is no louder than that while the piano plays. I do already plays the melody while the student only listens and the microphone is open, so it is a free measurement. With headphones the leak is near zero and nothing changes.

## What you will review

Without headphones, stay silent in We do: the practice line says no notes were heard and no red line follows the piano. Sing along normally: your notes count. A notice suggests headphones when the piano is loud at the microphone. With headphones, everything behaves as before.

## Depends on

S05 (run order only), E06 lesson session (`src/ui/screens/Lesson.tsx` `run()`), E05 frame recording (`recordFrames`) and scoring (`evaluateAttempt`), E02 `MicPitchSource`.

## Scope

In: measuring the leak in I do; gating We do frames; a notice; simulated-singer modes for tests.
Out: turning on browser echo cancellation; changing You do (it plays only the starting note before beat 0, outside the scored window, and clicks); the range test and calibration; storing the leak level.

## Specification

### Measuring the leak (`src/core/scoring/bleed.ts`, pure)

- `measureBleed(frames, notes)`: takes the frames recorded during an I do play (exercise time, as from `recordFrames`) and the exercise's notes. Uses only frames inside a note, skipping the first 100 ms of each note (the tone's attack). Returns the 75th percentile of their `rms`, or `null` if fewer than 10 frames qualify.
- `bleedGate(bleedRms)`: the level a frame must reach to count as voice while the piano plays. `max(MIN_RMS, 2.5 × bleedRms)`, capped at 0.05 so a student who hums along in I do cannot lock themselves out. `MIN_RMS` is `PITCH_CONFIG.MIN_RMS` (0.01). `null` gives `MIN_RMS`.
- `applyGate(frames, notes, gateRms)`: returns a copy of the frames where any frame inside a note with `rms < gateRms` has `midi: null`. Frames outside notes are unchanged.

### Lesson screen (`Lesson.tsx`)

- I do: record frames (as We do does today) and, when the run ends normally, store `bleedRms = measureBleed(...)` in a ref for this lesson visit. Replaying I do measures again and replaces it.
- We do: after the run, gate the frames with `applyGate(frames, ex.notes, bleedGate(bleedRms))` before scoring and before the results graph draws them. Gate the live graph's frames the same way so the red line does not follow the piano while it plays.
- If We do is run before any I do play in this visit (Back to We do after a reload, for example), use the gate from `null` (no change from today).
- You do is not gated.
- When `bleedGate(bleedRms) > 0.02`, show a notice under the step text in We do: "The microphone can hear the piano. Use headphones, or sing louder than the piano." The notice uses the existing notice style and does not block the run.

### Simulated singers (`src/audio/pitch/simSinger.ts`, `SyntheticPitchSource.ts`)

- Let a behaviour set `rms` per frame, not only `midi`. Existing behaviours keep `rms: 0.1`.
- `bleed`: the piano only. While the melody plays (I do and We do), the target pitch at `rms: 0.02`; silence otherwise, including You do.
- `bleedSing`: piano plus a perfect singer. I do as `bleed`; in We do and You do, the target pitch at `rms: 0.1`.
- The synthetic source needs to know whether the melody is playing; pass it through `registerSimExercise` (for example a `melodyPlaying` flag).

## Tests

- `bleed.test.ts`: `measureBleed` skips attacks and frames outside notes, returns the 75th percentile and `null` when too few frames; `bleedGate` floors at `MIN_RMS`, scales by 2.5 and caps at 0.05; `applyGate` nulls only quiet frames inside notes.
- Playwright on `s1-05` (or its replacement id after E14):
  - `sim=bleed`: play I do, then We do: the practice line reports 0 notes, the We do results graph has no solid red path, and the headphones notice shows.
  - `sim=bleedSing`: same steps: the practice line reports every note.
  - `sim=perfect`: unchanged results and no notice.
- All existing specs pass.

## Review script

1. Unplug headphones and use the laptop speakers at a normal volume.
2. Open a Stage 1 lesson, play I do and stay silent.
3. In We do, stay silent: the practice line says 0 notes and no red line follows the piano. The headphones notice shows.
4. Run We do again and sing along at normal volume: your notes count.
5. Put on headphones, reload the lesson, play I do and We do: no notice; scoring as before.
