# Architecture

Rules and shared contracts for every epic. If an epic file and this file disagree, this file wins; raise the conflict rather than guessing.

## Stack

| Concern | Choice |
|---------|--------|
| Language / build | TypeScript (strict), Vite |
| UI | React 18, function components, plain CSS files per component |
| Routing | `react-router-dom` with `HashRouter` (works on any static host) |
| State | `zustand` for app state (profile, progress); local component state otherwise |
| Validation | `zod` for anything loaded from storage or files |
| Pitch detection | `pitchy` (McLeod Pitch Method) on time-domain data from an `AnalyserNode` |
| Sound output | Web Audio API oscillators with an envelope. No sample files in v1 |
| Unit tests | Vitest |
| End-to-end tests | Playwright (Chromium), using the synthetic pitch source |
| Package manager | npm |

Do not add other runtime dependencies without recording the reason in the epic's pull request.

## Folder layout

```
src/
  core/            Pure TypeScript. No DOM, no Web Audio, no React. Fully unit tested.
    music/         notes.ts — MIDI, frequency, note names, cents
    exercise/      types.ts, notation.ts, fit.ts
    scoring/       types.ts, tolerance.ts, evaluate.ts
    session/       sessionMachine.ts
  audio/           Web Audio wrappers. Each has an interface so it can be faked or replaced.
    audioEngine.ts       the single AudioContext, unlock/resume
    tonePlayer.ts        play/schedule notes
    metronome.ts
    pitch/
      PitchSource.ts     interface + PitchFrame
      MicPitchSource.ts
      SyntheticPitchSource.ts
  content/         Lesson data and the lesson registry
  storage/         schema.ts, store.ts, exportImport.ts
  ui/
    components/    PianoKeyboard, CentsMeter, SequenceStrip, BeatIndicator, ...
    screens/       Home, RangeSetup, Lesson, Results, Settings, dev/*
  app/             App.tsx, routes.tsx
tests/e2e/         Playwright specs
planning/          these documents
```

Dependency direction: `ui → audio, content, storage, core`; `audio → core`; `content → core`; `storage → core`. `core` imports nothing outside `core`.

## Core conventions

- **Pitch is a MIDI note number.** Integers for target notes (60 = C4). Floats for sung pitch (60.3 = C4 plus 30 cents). A4 = MIDI 69 = 440 Hz.
- **Cents** = `(sungMidi − targetMidi) × 100`.
- **One clock.** All times are seconds on `AudioContext.currentTime`. Playback scheduling, pitch frames and scoring all use it. Never mix in `Date.now()` or `performance.now()`.
- **Note names** use sharps: `C4`, `C#4`.

## Shared types

Define these exactly; later epics rely on the names.

```ts
// core/music/notes.ts
midiToFreq(midi: number): number
freqToMidi(freq: number): number            // float
midiToName(midi: number): string            // 61 -> "C#4"
nameToMidi(name: string): number
centsBetween(sungMidi: number, targetMidi: number): number
isBlackKey(midi: number): boolean

// core/exercise/types.ts
interface TemplateNote {
  offset: number;          // semitones from the tonic; may be negative
  startBeat: number;       // 0-based, quarter note = 1 beat
  durationBeats: number;
  lyric?: string;
}
interface ExerciseTemplate {
  id: string;
  title: string;
  tempoBpm: number;
  beatsPerBar: number;     // for the beat indicator (the lead-in is always 4 clicks)
  notes: TemplateNote[];   // sorted by startBeat, never overlapping (monophonic)
}
interface StudentRange { lowMidi: number; highMidi: number; }   // inclusive integers
interface ResolvedNote {
  index: number;
  midi: number;
  startSec: number;        // relative to exercise start
  durationSec: number;
  lyric?: string;
}
interface ResolvedExercise {
  templateId: string;
  tonicMidi: number;
  tempoBpm: number;
  beatsPerBar: number;
  notes: ResolvedNote[];
  totalSec: number;
}

// audio/pitch/PitchSource.ts
interface PitchFrame {
  tSec: number;            // AudioContext time
  midi: number | null;     // null = no confident pitch (silence, noise)
  clarity: number;         // 0..1
  rms: number;             // input level
}
interface PitchSource {
  start(): Promise<void>;
  stop(): void;
  subscribe(cb: (f: PitchFrame) => void): () => void;   // returns unsubscribe
}

// core/scoring/types.ts
interface ToleranceProfile {
  id: string;
  cents: number;           // max |cents| to count as on the note
  holdFraction: number;    // share of the note's frames that must be on the note
  timingMs: number;        // max onset error
}
type MissReason = 'silent' | 'wrong-octave' | 'wrong-note' | 'wavered' | 'early' | 'late';
interface NoteResult {
  index: number;
  targetMidi: number;
  hit: boolean;
  reason?: MissReason;     // set when hit is false
  medianCents: number | null;
  heldFraction: number;
  onsetErrorMs: number | null;
}
interface AttemptResult {
  notes: NoteResult[];
  score: number;           // hits / notes, 0..1
  passed: boolean;         // score >= passScore
}

// content
interface Lesson {
  id: string;              // stable, e.g. "s1-03"
  stage: 1 | 2 | 3;
  order: number;
  title: string;
  goal: string;            // one sentence shown to the student
  exercise: ExerciseTemplate;
  toleranceId: string;
  passScore: number;       // 0.8
  source: 'builtin' | 'imported';
}
interface LessonSource { list(): Lesson[]; }
```

## Lesson modularity

- A lesson is data only. Adding a lesson means adding one object; no UI or engine changes.
- All lessons run through the same `Lesson` screen and session state machine.
- The lesson registry (`content/registry.ts`) merges any number of `LessonSource`s. Built-in lessons are one source; imported MIDI lessons (E11) are another.
- Exercises are authored with a short notation string, parsed by `core/exercise/notation.ts`:
  - Tokens separated by spaces: `offset:beats`. `r:beats` is a rest. Beats default to 1.
  - Example: `"0 2 4:2 r 4 2 0:2"`.
  - Lyrics are a separate array with one entry per non-rest note.

## Range fitting (`core/exercise/fit.ts`)

```
fit(template, range) -> { ok: true, exercise: ResolvedExercise } | { ok: false, reason: 'range-too-small', neededSemitones, haveSemitones }
```

1. `minOff`, `maxOff` = min and max `offset` in the template. `span = maxOff − minOff`.
2. `size = range.highMidi − range.lowMidi`. If `span > size`, return `ok: false`.
3. `lowestNote = range.lowMidi + floor((size − span) / 2)`. `tonicMidi = lowestNote − minOff`.
4. Each note: `midi = tonicMidi + offset`, `startSec = startBeat × 60 / tempoBpm`, `durationSec = durationBeats × 60 / tempoBpm`.

## Audio rules

- One `AudioContext` for the whole app, created in `audioEngine.ts`. It is created or resumed inside a user tap ("Start" button). iOS Safari will not produce sound otherwise.
- Microphone: `getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })`. Requires HTTPS or `localhost`.
- The mic stream goes to an `AnalyserNode` (fftSize 2048) and is **not** connected to the speakers.
- Pitch frames are produced on `requestAnimationFrame`. A frame has `midi: null` unless clarity ≥ 0.9, rms above the gate, and frequency is 60–1100 Hz. Apply a 5-frame median filter to non-null values.
- **Lead-in.** Every playback of an exercise, in I do, We do and You do, starts with exactly 4 metronome clicks at the exercise tempo; the exercise begins on the next beat. This is fixed, not a per-lesson option.
- Notes are scheduled ahead of time on the audio clock (`osc.start(t)`), never with `setTimeout` for musical timing.

## Testability without a microphone

- `SyntheticPitchSource` takes a `ResolvedExercise` plus a behaviour (`perfect`, `flat40`, `octaveDown`, `late300`, `silent`) and emits frames on the audio clock.
- Adding `?sim=<behaviour>` to the URL makes the app use it instead of the mic. Playwright tests use this.
- Scoring is a pure function of `(ResolvedExercise, PitchFrame[], ToleranceProfile, latencyOffsetSec)` and is tested with hand-built frame arrays.

## Storage

- `localStorage` key `tmts.v1`, one JSON document, validated with zod on load. Invalid or missing data falls back to defaults.

```ts
interface StoredData {
  version: 1;
  range: (StudentRange & { assessedAt: string }) | null;
  settings: { latencyOffsetMs: number };
  progress: Record<string, {            // keyed by lesson id
    passed: boolean;
    bestScore: number;
    attempts: number;
    lastAttemptAt: string;
  }>;
  importedLessons: Lesson[];            // used from E11
}
```

## Running and reviewing

- `npm run dev` — laptop review at `https://localhost:5173`.
- `npm run dev -- --host` — iPhone review on the same Wi-Fi at `https://<laptop-ip>:5173`. The dev server uses `@vitejs/plugin-basic-ssl`; accept the certificate warning once. This is needed because the mic only works over HTTPS.
- `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build` must all pass at the end of every epic.

## Definition of done for every epic

1. All four commands above pass.
2. The epic's review script works on laptop Chrome and, from E02 on, iPhone Safari.
3. No file in `core/` imports from outside `core/`.
4. Work from earlier epics still passes its review script.
5. A short `docs/epic-notes/Exx.md` lists what was built, any deviation from the plan, and known issues.
