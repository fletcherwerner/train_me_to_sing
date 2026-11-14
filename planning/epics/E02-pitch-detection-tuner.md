# E02 — Mic pitch detection and live tuner

## Goal

Turn microphone input into a stream of pitch frames, and show the sung note on the piano in real time.

## What you will review

A tuner page: sing or hum and the matching key lights up, with a readout of note name and cents. Works on laptop and iPhone.

## Depends on

E01: `audioEngine`, `PianoKeyboard`, `core/music/notes`.

## Scope

In: `PitchSource` interface, `MicPitchSource`, `SyntheticPitchSource` (basic), `CentsMeter`, `/dev/tuner`.
Out: scoring, range saving, lessons.

## Specification

### `src/audio/pitch/PitchSource.ts`

`PitchFrame` and `PitchSource` exactly as in the architecture file.

### `src/audio/pitch/MicPitchSource.ts`

- `start()`:
  1. `getUserMedia` with echo cancellation, noise suppression and auto gain all `false`.
  2. `MediaStreamAudioSourceNode → AnalyserNode` (`fftSize = 2048`). Do not connect to `destination`.
  3. Create a `pitchy` `PitchDetector.forFloat32Array(2048)`.
  4. Start a `requestAnimationFrame` loop.
- Each tick:
  1. `getFloatTimeDomainData` into a reused `Float32Array`.
  2. `rms` = root mean square of the buffer.
  3. `[freq, clarity] = detector.findPitch(buffer, sampleRate)`.
  4. Raw midi = `freqToMidi(freq)` if `clarity ≥ 0.9` and `rms ≥ 0.01` and `60 ≤ freq ≤ 1100`; otherwise `null`.
  5. Smoothing: keep the last 5 raw values. If at least 3 are non-null, output the median of the non-null ones; otherwise output `null`.
  6. Emit `{ tSec: now(), midi, clarity, rms }` to subscribers.
- `stop()`: cancel the loop, stop all stream tracks, disconnect nodes.
- If permission is denied, `start()` rejects with an `Error` whose message is `mic-denied`.
- Put the thresholds (0.9, 0.01, 60, 1100, 5) in an exported `PITCH_CONFIG` object.

### `src/audio/pitch/SyntheticPitchSource.ts`

- Constructor takes a function `(tSec: number) => number | null` giving the midi value at a time.
- Emits a frame every animation frame with `clarity: 1`, `rms: 0.1`.
- Helper `constantPitch(midi)` for this epic. Exercise-following behaviours are added in E05.

### `createPitchSource()` in `src/audio/pitch/index.ts`

- Reads `sim` from the URL query string. If `sim=const:<midi>` (e.g. `?sim=const:60.3`), returns a synthetic source; otherwise the mic source.
- All UI code obtains its pitch source through this function.

### `src/ui/components/CentsMeter.tsx`

- Props: `cents: number | null`, `toleranceCents: number`.
- A horizontal bar from −100 to +100 with a centre zone of ±`toleranceCents` and a needle. Text: `♭ 30`, `♯ 12`, or `—` when null. Needle is green inside the zone, orange outside.

### `/dev/tuner` page

- "Start" button: `unlockAudio()` then `source.start()`. Show a clear message if the mic is denied.
- `PianoKeyboard` C2 (36) to C6 (84), `sungMidi` from the latest frame.
- Large text: note name of the nearest key, frequency in Hz, cents from that key. `CentsMeter` against the nearest key with tolerance 50.
- Debug line: clarity and rms to two decimals.
- "Stop" button.
- To avoid re-rendering the whole page 60 times a second, hold the latest frame in a ref and update display state at most 30 times a second.

## Tests

- Median smoothing extracted as a pure function and tested: `[60, null, 60.2, 60.1, null] → 60.1`; `[null, null, 60, null, null] → null`.
- `SyntheticPitchSource` with fake timers emits frames with the configured pitch.
- Playwright: `/dev/tuner?sim=const:60.3`, click Start, expect text `C4` and `♯ 30` (± 2).

## Review script

1. Laptop: open `/#/dev/tuner`, click Start, allow the mic. Hum a steady note — one key lights and stays lit. Slide up — the lit key moves up.
2. Play a note on any instrument or tuner app (e.g. A4 = 440 Hz). The page shows `A4` within ±10 cents.
3. Stay silent — no key is lit; readout shows `—`.
4. iPhone: run `npm run dev -- --host`, open `https://<laptop-ip>:5173/#/dev/tuner` in Safari, accept the certificate, repeat steps 1–3 with wired headphones.
5. Sing your lowest note. Note in `docs/epic-notes/E02.md` whether detection is stable there; if it flickers an octave up, record it as a known issue.
