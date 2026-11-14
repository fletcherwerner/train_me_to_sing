# E03 — Vocal range assessment

## Goal

Capture the student's lowest and highest notes and store them as the student range that every exercise is fitted into.

## What you will review

A guided setup: hold your lowest note during a recording window, then your highest. The result is shown on the piano, can be adjusted, and is still there after a reload.

## Depends on

E02: `createPitchSource`, `PianoKeyboard`, `CentsMeter`.

## Scope

In: storage module, range analysis function, `RangeSetup` screen, first-launch redirect.
Out: lessons, export/import (E10).

## Specification

### `src/storage/schema.ts` and `store.ts`

- zod schema for `StoredData` from the architecture file. Defaults: `range: null`, `settings.latencyOffsetMs: 0`, `progress: {}`, `importedLessons: []`.
- `loadData(): StoredData` — parse `localStorage['tmts.v1']`; on any failure return defaults.
- `saveData(data)`.
- zustand store `useAppStore` holding `StoredData` with actions `setRange(range)`, and (added in later epics) others. Every action saves.

### `src/core/exercise/rangeAnalysis.ts` (pure)

```ts
findHeldNote(frames: PitchFrame[], pick: 'lowest' | 'highest'):
  { ok: true; midi: number } | { ok: false; reason: 'no-voice' | 'unstable' }
```

1. If fewer than 30% of frames have a non-null `midi`, return `no-voice`.
2. Find every *stable segment*: a run of consecutive non-null frames lasting at least 0.5 s in which every value is within ±0.5 semitones of the run's median. (Scan forward; extend the run while the next frame is within ±0.5 of the running median; close the run otherwise.)
3. If there are none, return `unstable`.
4. Take the median of each segment. Return the lowest (or highest) median, rounded to the nearest integer.

This means that if the student wobbles while finding the note, the lowest note they actually *held* during the window is the one recorded.

### `RangeSetup` screen (`/range`)

A wizard with these steps. The mic stays on from step 2 to step 5.

1. **Intro.** Text: put on headphones; you will hold your lowest comfortable note, then your highest. "Start" button (unlocks audio, starts the pitch source).
2. **Lowest — find it.** Prompt: "Sing your lowest comfortable note and hold it." Keyboard C2–C6 shows the sung key live, with the note name in large text. Button: "Record".
3. **Lowest — recording window.** A visible "3 – 2 – 1" countdown (1 s each, with a click sound from `tonePlayer` on each), then "Recording… hold the note" with a progress bar for 3 seconds. Frames from the 3 s window are passed to `findHeldNote(frames, 'lowest')`.
   - On `ok`: show "Lowest note: E2", play that note back, buttons "Use this" and "Try again".
   - On failure: message ("We couldn't hear a steady note — try again, a little louder") and "Try again".
4. **Highest — find it** and **Highest — recording window.** Same as steps 2–3 with `'highest'`.
5. **Confirm.** Keyboard padded to whole octaves around the result, with `rangeMarkers`. Text: "Your range: E2 – C4 (20 semitones)". `−` / `+` buttons beside each limit nudge it by one semitone; tapping plays the note. Validation: high must be at least 5 semitones above low; if less than 7, show a warning that some lessons will not fit. "Save" stores the range with `assessedAt` (ISO date) and goes to `/`.

Countdown and window timing use the audio clock. Collect frames whose `tSec` falls inside the window.

### Routing

- On app load, if `range` is null, redirect `/` to `/range`.
- The placeholder home page shows the saved range and a "Redo range test" link.

## Tests

- `findHeldNote`: steady 45.1 for 3 s → 45; first second at 47, then 2 s at 45 → `lowest` gives 45, `highest` gives 47; all null → `no-voice`; continuous glide of 3 semitones per second → `unstable`.
- Storage: round-trip; corrupt JSON returns defaults.
- Add a `sim=range:<low>,<high>` option to `createPitchSource`: the synthetic source outputs `<low>` until the first "Use this" is clicked, then `<high>`. Playwright with `?sim=range:45,64` completes the wizard and expects "A2 – E4" on the confirm step and after a reload.

## Review script

1. Clear site data, open the app. You are taken to the range setup.
2. Find your lowest note; the keyboard shows it as you sing. Press Record, wait for the countdown, hold through the 3-second bar. The app names the note and plays it back. It should sound like what you sang.
3. Repeat for the highest note.
4. On the confirm screen, nudge a limit and hear the note. Save.
5. Reload. The home page shows your range and does not send you back to setup.
6. Try staying silent during a recording window — you get the retry message.
7. Repeat steps 1–5 on the iPhone.
