# E02 — Turn 02 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 0

## Summary

All four findings from Turn 1 are fixed. The epic builds the complete pitch detection pipeline: `PitchSource` interface, `MicPitchSource` with 5-frame median smoothing and `mic-denied` error handling, `SyntheticPitchSource` with correct time tracking, `CentsMeter`, and the `/dev/tuner` page with error UI. All four build commands pass (`lint`, `test`, `test:e2e`, `build`). No new issues found.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass (0 errors) | Yes |
| `npm test` | pass (4 files, 19 tests) | Yes |
| `npm run test:e2e` | pass (4 tests) | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| `PitchFrame` and `PitchSource` interfaces exactly as in architecture file | Yes | — |
| `MicPitchSource.start()`: `getUserMedia` with echoCancellation, noiseSuppression, autoGainControl all false | Yes | — |
| `MicPitchSource.start()`: `MediaStreamAudioSourceNode → AnalyserNode` (fftSize 2048), not connected to destination | Yes | — |
| `MicPitchSource.start()`: `PitchDetector.forFloat32Array(2048)` | Yes | — |
| `MicPitchSource.start()`: `requestAnimationFrame` loop | Yes | — |
| Each tick: `getFloatTimeDomainData` into reused `Float32Array` | Yes | — |
| Each tick: `rms` computed | Yes | — |
| Each tick: `pitchy.findPitch(buffer, sampleRate)` | Yes | — |
| Each tick: thresholds (clarity ≥ 0.9, rms ≥ 0.01, 60 ≤ freq ≤ 1100) | Yes | — |
| Each tick: 5-frame median smoothing applied before emit | Yes | — |
| `stop()`: cancel loop, stop tracks, disconnect nodes | Yes | — |
| Permission denied → `start()` rejects with `Error` message `mic-denied` | Yes | — |
| `PITCH_CONFIG` exported object with thresholds | Yes | — |
| `SyntheticPitchSource` constructor takes `(tSec: number) => number | null` | Yes | — |
| `SyntheticPitchSource` emits frames every animation frame with `clarity: 1`, `rms: 0.1` | Yes | — |
| `constantPitch(midi)` helper | Yes | — |
| `createPitchSource()` reads `sim` from URL query string | Yes | — |
| `sim=const:<midi>` returns synthetic source | Yes | — |
| `CentsMeter` props: `cents: number | null`, `toleranceCents: number` | Yes | — |
| `CentsMeter`: horizontal bar −100 to +100, centre zone ±toleranceCents, needle (green inside, orange outside) | Yes | — |
| `CentsMeter` text: `♭ 30`, `♯ 12`, or `—` when null | Yes | — |
| `/dev/tuner`: "Start" button calls `unlockAudio()` then `source.start()` | Yes | — |
| `/dev/tuner`: clear message if mic denied | Yes | — |
| `/dev/tuner`: `PianoKeyboard` C2 (36) to C6 (84), `sungMidi` from latest frame | Yes | — |
| `/dev/tuner`: large text: note name, frequency in Hz, `CentsMeter` (tolerance 50) | Yes | — |
| `/dev/tuner`: debug line: clarity and rms to two decimals | Yes | — |
| `/dev/tuner`: "Stop" button | Yes | — |
| `/dev/tuner`: throttle display to ~30fps | Yes | — |
| Median smoothing pure function tested with spec examples | Yes | — |
| `SyntheticPitchSource` with fake timers emits frames | Yes | — |
| Playwright: `/dev/tuner?sim=const:60.3`, click Start, expect `C4` and `♯ 30` (± 2) | Yes | — |

## Findings

None.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| PLAN-E02-T1-01 | Fixed | `MicPitchSource.ts:84-91` maintains a `rawBuffer` of max 5 elements and calls `smoothPitch(rawBuffer)` before emitting. The `smoothPitch` function (in `smoothing.ts`) filters non-null values, returns the median if ≥ 3 are non-null, otherwise null. Matches the spec exactly. |
| PLAN-E02-T1-02 | Fixed | `MicPitchSource.ts:46-55` wraps `getUserMedia` in a try/catch. If the error is `NotAllowedError`, throws `new Error('mic-denied')`. Matches the spec exactly. |
| PLAN-E02-T1-03 | Fixed | `SyntheticPitchSource.ts:14-21` tracks `lastTime` and computes `elapsed = t - lastTime`. The behaviour function receives `t + elapsed` (monotonically increasing time), and the frame's `tSec` is `t` from `AudioContext.currentTime`. Frames advance on the audio clock consistently. |
| PLAN-E02-T1-04 | Fixed | `TunerDev.tsx:40-45` catches `mic-denied` and displays "Microphone access denied. Please allow microphone access in your browser settings and reload." The error state is separate from the silence state and is cleared on `stop()` or a new `start()` attempt. |

## Questions for the owner

None.
