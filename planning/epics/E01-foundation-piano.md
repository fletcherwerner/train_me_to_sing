# E01 — Foundation: scaffold, music core, piano

## Goal

A running project with the music maths, the sound player and the piano keyboard component that every later epic uses.

## What you will review

A page showing a piano keyboard. Clicking or tapping a key plays that note and lights the key.

## Depends on

Nothing.

## Scope

In: project setup, `core/music`, `audioEngine`, `tonePlayer`, `PianoKeyboard`, a dev page.
Out: microphone, lessons, storage.

## Specification

### Project setup

1. Create the Vite React TypeScript project in the repo root. Keep the existing `planning/`, `comms/`, `harness/` and `.claude/` folders and the root `README.md` and `CLAUDE.md` untouched (do not let the Vite template overwrite them, and do not add a README anywhere else). The driver has already initialised git.
2. Install: `react-router-dom`, `zustand`, `zod`, `pitchy`; dev: `vitest`, `@playwright/test`, `@vitejs/plugin-basic-ssl`, `eslint` with the TypeScript and React plugins.
3. `tsconfig`: `"strict": true`.
4. `vite.config.ts`: enable `basicSsl()`; `base: './'`.
5. npm scripts: `dev`, `build`, `test` (vitest run), `test:e2e` (playwright), `lint`.
6. Create the folder layout from `01-architecture.md` (empty folders may hold a `.gitkeep`).
7. `HashRouter` with routes `/` (placeholder home with links to dev pages) and `/dev/piano`.
8. Add an ESLint rule (`no-restricted-imports`) so files under `src/core` cannot import from `src/audio`, `src/ui`, `src/storage`, `src/content`, or `react`.

### `src/core/music/notes.ts`

Implement the functions listed under "Shared types" in the architecture file.

- `midiToFreq(m) = 440 × 2^((m − 69) / 12)`
- `freqToMidi(f) = 69 + 12 × log2(f / 440)`
- `midiToName`: names `C C# D D# E F F# G G# A A# B`; octave = `floor(midi / 12) − 1`. Round the input to the nearest integer first.
- `nameToMidi`: inverse; throw on invalid input.
- `isBlackKey`: pitch classes 1, 3, 6, 8, 10.

### `src/audio/audioEngine.ts`

- `getAudioContext(): AudioContext` — creates the single context on first call.
- `unlockAudio(): Promise<void>` — calls `resume()`; must be called from a click/tap handler.
- `now(): number` — `currentTime`.

### `src/audio/tonePlayer.ts`

```ts
interface TonePlayer {
  playNote(midi: number, startSec: number, durationSec: number): void;  // startSec on the audio clock
  stopAll(): void;
}
createTonePlayer(): TonePlayer
```

- Each note: one triangle oscillator plus one sine oscillator an octave up at 0.3 gain, through a gain envelope: 10 ms attack to 0.3, hold, 60 ms release ending at `startSec + durationSec`.
- `stopAll` cancels every scheduled and sounding note immediately (keep references to active oscillators).

### `src/ui/components/PianoKeyboard.tsx`

```ts
interface PianoKeyboardProps {
  lowMidi: number;                 // first key shown
  highMidi: number;                // last key shown
  targetMidi?: number | null;      // highlighted as target
  sungMidi?: number | null;        // float; highlights the nearest key
  rangeMarkers?: { lowMidi: number; highMidi: number };  // student range limits
  onKeyPress?: (midi: number) => void;
}
```

- Render with SVG. White keys equal width filling the container; black keys 60% width and 62% height, positioned over the boundary between white keys.
- If `lowMidi` or `highMidi` is a black key, extend outward to the next white key.
- Label every C with its name (`C3`, `C4`).
- Colours (CSS variables in `:root`, with a dark-mode set):
  - `--key-target`: blue. Key equals `targetMidi`.
  - `--key-sung-match`: green. Nearest key to `sungMidi` equals `targetMidi`.
  - `--key-sung-off`: orange. Nearest key to `sungMidi` differs from `targetMidi`.
  - When there is no target, the sung key uses `--key-sung-match`.
- If `sungMidi` rounds to a key outside `[lowMidi, highMidi]`, show an arrow at that edge with the note name (e.g. `◀ G2`).
- `rangeMarkers`: small labelled brackets under the low and high keys ("low", "high").
- Pointer events: `onKeyPress(midi)` on pointer down. Works with mouse and touch.
- Must stay usable at 360 px width with 24 semitones shown.

### `/dev/piano` page

- "Start" button calls `unlockAudio()`.
- Keyboard from C3 (48) to C5 (72). Pressing a key plays it for 0.5 s and sets it as `targetMidi` for 0.5 s.
- Number inputs for low and high MIDI to test other ranges.

## Tests

- `notes.test.ts`: 69 ↔ 440 Hz; 60 ↔ "C4"; 61 ↔ "C#4"; `freqToMidi(midiToFreq(x)) ≈ x` for 36–84; `centsBetween(60.3, 60) ≈ 30`.
- `PianoKeyboard` render test: C3–C5 gives 15 white keys and 10 black keys; a key with `targetMidi` has the target class; out-of-range `sungMidi` shows the edge arrow.
- Playwright smoke: `/dev/piano` loads and shows the keyboard.

## Review script

1. `npm install`, `npm run dev`, open `https://localhost:5173/#/dev/piano`.
2. Click Start, then click several keys. Each plays the correct pitch (C4 sounds lower than C5) and lights up.
3. Change the range to 40–64; the keyboard redraws with C labels correct.
4. Narrow the window to phone width; keys stay visible and clickable.
5. `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build` all pass.
