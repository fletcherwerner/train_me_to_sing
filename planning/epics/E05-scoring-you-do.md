# E05 — Scoring engine and graded "You do"

## Goal

Compare what was sung with the exercise, note by note, and show target and sung notes together on the piano while it happens.

## What you will review

A page where you sing an exercise without the melody playing. During it, the piano shows the target key and your key. Afterwards you get a result for every note and a score.

## Depends on

E02 (pitch source), E04 (exercise player, fit, strip).

## Scope

In: tolerance profiles, `evaluateAttempt`, a frame recorder, synthetic singer behaviours, `/dev/attempt`.
Out: the three-step session flow (E06), saving progress (E07).

## Specification

### `src/core/scoring/tolerance.ts`

- Export the four profiles `t1`–`t4` from `02-lesson-catalog.md` and `getTolerance(id)`.
- Export `TOLERANCE_FLOOR = { cents: 25, timingMs: 150 }` and a test that no profile is below it.

### `src/core/scoring/evaluate.ts` (pure)

```ts
evaluateAttempt(
  ex: ResolvedExercise,
  frames: PitchFrame[],        // tSec already relative to exercise start (see recorder)
  tol: ToleranceProfile,
  passScore: number
): AttemptResult
```

For each note `n` with window `[s, e]` = `[n.startSec, n.startSec + n.durationSec]`:

1. **Frames in window** `W` = frames with `s ≤ tSec < e`. "On the note" means `midi` is non-null and `|midi − n.midi| × 100 ≤ tol.cents`.
2. **Silent.** If fewer than 20% of `W` have a non-null `midi` → miss, `silent`.
3. **Median pitch** `m` = median of non-null `midi` in `W`. `medianCents = (m − n.midi) × 100`.
4. **Wrong octave.** If `|m − n.midi|` is within `tol.cents / 100` of 12 or 24 → miss, `wrong-octave`.
5. **Wrong note.** Else if `|medianCents| > tol.cents` → miss, `wrong-note`.
6. **Held fraction.** `heldFraction` = (frames in `W` on the note) / (all frames in `W`), ignoring the first `min(150 ms, 25% of the note)` of the window to allow for the scoop into the note. If `heldFraction < tol.holdFraction` → miss, `wavered`.
7. **Onset.** Search frames from `s − 2 × timingMs` to `e` for the first frame that starts a run of at least 80 ms on the note. `onsetErrorMs = (onsetTime − s) × 1000`.
   - If the previous note has the same `midi` and ends at `s` (a repeated note with no gap), skip the timing check: set `onsetErrorMs = null`.
   - If `onsetErrorMs < −tol.timingMs` → miss, `early`.
   - If `onsetErrorMs > tol.timingMs` → miss, `late`.
8. Otherwise → hit.

Checks run in the order above; the first failure sets `reason`. `score = hits / notes.length`; `passed = score ≥ passScore`.

### `src/audio/pitch/frameRecorder.ts`

```ts
recordFrames(source: PitchSource, startSec: number, endSec: number, latencyOffsetSec: number):
  { frames: PitchFrame[]; stop(): void }
```

- Subscribes to the source and keeps frames with `startSec − 1 ≤ tSec ≤ endSec + 0.5`.
- Stores each frame with `tSec` rewritten to `tSec − startSec − latencyOffsetSec`, so time 0 is exercise beat 0.
- `latencyOffsetSec` comes from `settings.latencyOffsetMs / 1000` (0 until E08).

### Synthetic singer behaviours

Extend `SyntheticPitchSource` and `createPitchSource` with `?sim=` values that follow the current exercise. The lesson/attempt page registers the active `ResolvedExercise` and `startSec` with the source.

| `sim` | Output |
|-------|--------|
| `perfect` | Exact target pitch during each note |
| `flat40` | Target − 0.4 semitones |
| `flat70` | Target − 0.7 semitones |
| `octaveDown` | Target − 12 |
| `late300` | Perfect, delayed 0.3 s |
| `wobble` | Target for the first 30% of each note, then target + 1.5 |
| `silent` | Always null |

### Live feedback hook `useLiveAttempt`

- Inputs: pitch source, playback handle, exercise, tolerance.
- Returns the current note index, latest `sungMidi`, `cents` against the current target (or `null`), for the keyboard and `CentsMeter`.

### `/dev/attempt` page

- Exercise dropdown as in `/dev/exercise`; tolerance dropdown `t1`–`t4`.
- "Start attempt": unlock audio, start mic, `playExercise` with `{ playMelody: false, metronome: true, playStartNote: true }` (the 4-click lead-in is automatic), record frames.
- During: keyboard with `targetMidi` and `sungMidi`; `CentsMeter` with the profile's tolerance; `SequenceStrip`; `BeatIndicator`.
- After: run `evaluateAttempt` (pass score 0.8). Colour the strip chips by result. Show a table: note name, hit/miss, reason in words, median cents, held %, onset ms. Show the score as "4 of 5 notes (80%)" and Pass/Fail.
- Reason wording: `silent` "No sound detected"; `wrong-octave` "Right note, wrong octave"; `wrong-note` "Sharp by N cents" / "Flat by N cents"; `wavered` "Drifted off the note"; `early` "Came in early"; `late` "Came in late".

## Tests

Build frames with a helper `framesFor(ex, fn)` at 60 frames per second.

| Case | Expected with `t1` |
|------|--------------------|
| perfect | all hit, score 1 |
| 40 cents flat | all hit |
| 70 cents flat | all `wrong-note`, `medianCents ≈ −70` |
| octave down | all `wrong-octave` |
| late 300 ms | all hit under `t1` (400 ms); all `late` under `t4` (200 ms) |
| on target 30% then +1.5 semitones | `wrong-note` or `wavered` — assert miss |
| on target 80% then silent | hit |
| silent | all `silent`, score 0 |
| repeated notes `0 0 0`, continuous pitch | all hit (timing check skipped) |
| 4 of 5 notes perfect, one silent | score 0.8, passed |

Playwright: `/dev/attempt?sim=perfect` → "Pass"; `?sim=octaveDown` → every row shows "wrong octave" and "Fail".

## Review script

1. Open `/#/dev/attempt`, choose the three-note exercise and `t1`. Start.
2. You hear the first note, a count-in, then only clicks. The target key is lit blue. As you sing, your key lights green when it matches and orange when it does not; the cents meter moves.
3. Sing it as well as you can. Check the table agrees with what you felt.
4. Deliberately sing an octave low — notes report "Right note, wrong octave" and the lit key (or edge arrow) is visibly an octave from the target.
5. Deliberately start each note late — "Came in late".
6. Stay silent — "No sound detected", 0%.
7. Open `/#/dev/attempt?sim=perfect` and `?sim=flat70` to see the simulated results.
8. Repeat steps 1–3 on the iPhone with wired headphones.
