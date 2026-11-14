# E02 — Turn 01 — Plan Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 2 · **Non-blocking open:** 1

## Summary

The epic builds the core pitch detection pipeline: `PitchSource` interface, `MicPitchSource`, `SyntheticPitchSource`, `smoothPitch`, `CentsMeter`, and the `/dev/tuner` page. All four build commands pass. However, the epic specification requires that `MicPitchSource` apply 5-frame median smoothing before emitting frames, but the current code emits raw midi values without smoothing. Additionally, the `SyntheticPitchSource` uses `now()` from `audioEngine` instead of `tSec` from the animation frame timing, which means its frames do not advance on the audio clock consistently. A non-blocking issue is that the `createPitchSource()` factory is not exported from `audio/pitch/index.ts` as a named export that UI code can import — it is exported but the file also re-exports `createMicPitchSource` and `constantPitch`/`createSyntheticPitchSource` which could cause confusion.

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
| **Each tick: 5-frame median smoothing applied before emit** | **No** | PLAN-E02-T1-01 |
| `stop()`: cancel loop, stop tracks, disconnect nodes | Yes | — |
| Permission denied → `start()` rejects with `Error` message `mic-denied` | No | PLAN-E02-T1-02 |
| `PITCH_CONFIG` exported object with thresholds | Yes | — |
| `SyntheticPitchSource` constructor takes `(tSec: number) => number | null` | Yes | — |
| `SyntheticPitchSource` emits frames every animation frame with `clarity: 1`, `rms: 0.1` | Partial | PLAN-E02-T1-03 |
| `constantPitch(midi)` helper | Yes | — |
| `createPitchSource()` reads `sim` from URL query string | Yes | — |
| `sim=const:<midi>` returns synthetic source | Yes | — |
| `CentsMeter` props: `cents: number | null`, `toleranceCents: number` | Yes | — |
| `CentsMeter`: horizontal bar −100 to +100, centre zone ±toleranceCents, needle (green inside, orange outside) | Yes | — |
| `CentsMeter` text: `♭ 30`, `♯ 12`, or `—` when null | Yes | — |
| `/dev/tuner`: "Start" button calls `unlockAudio()` then `source.start()` | Yes | — |
| `/dev/tuner`: clear message if mic denied | No | PLAN-E02-T1-04 |
| `/dev/tuner`: `PianoKeyboard` C2 (36) to C6 (84), `sungMidi` from latest frame | Yes | — |
| `/dev/tuner`: large text: note name, frequency in Hz, `CentsMeter` (tolerance 50) | Yes | — |
| `/dev/tuner`: debug line: clarity and rms to two decimals | Yes | — |
| `/dev/tuner`: "Stop" button | Yes | — |
| `/dev/tuner`: throttle display to ~30fps | Yes | — |
| Median smoothing pure function tested with spec examples | Yes | — |
| `SyntheticPitchSource` with fake timers emits frames | Yes | — |
| Playwright: `/dev/tuner?sim=const:60.3`, click Start, expect `C4` and `♯ 30` (± 2) | Yes | — |

## Findings

### PLAN-E02-T1-01 — MicPitchSource does not apply 5-frame median smoothing

- **Severity:** Blocking
- **Status:** Open
- **Where:** `src/audio/pitch/MicPitchSource.ts:69-74`
- **Requirement:** Epic specification, `MicPitchSource.ts` — "Smoothing: keep the last 5 raw values. If at least 3 are non-null, output the median of the non-null ones; otherwise output `null`."
- **Problem:** The `tick()` function in `MicPitchSource.ts` computes `midi` from the raw pitch detection and emits it directly. It never calls `smoothPitch()` or maintains a rolling buffer of 5 values. The `smoothPitch` function exists in `smoothing.ts` and is tested, but it is never used by `MicPitchSource`.
- **Change needed:** In `MicPitchSource.ts`, maintain a buffer of the last 5 raw midi values (some may be null). Before calling `emit()`, pass the buffer through `smoothPitch()` and emit the smoothed result instead of the raw value.

### PLAN-E02-T1-02 — MicPitchSource does not reject with `mic-denied` on permission denied

- **Severity:** Blocking
- **Status:** Open
- **Where:** `src/audio/pitch/MicPitchSource.ts:43-45`
- **Requirement:** Epic specification, `MicPitchSource.ts` — "If permission is denied, `start()` rejects with an `Error` whose message is `mic-denied`."
- **Problem:** The `start()` function calls `navigator.mediaDevices.getUserMedia(...)` but does not catch the case where the promise rejects with a `NotAllowedError`. It will reject with the browser's default error message, not `mic-denied`.
- **Change needed:** Wrap the `getUserMedia` call in a try/catch. If the error name is `NotAllowedError`, reject with `new Error('mic-denied')`.

### PLAN-E02-T1-04 — TunerDev does not show a clear message if mic is denied

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/screens/dev/TunerDev.tsx:33-36`
- **Requirement:** Epic specification, `/dev/tuner` page — "Show a clear message if the mic is denied."
- **Problem:** The `start()` function calls `unlockAudio()` and `source.start()` but does not handle the case where `source.start()` rejects (e.g., when `getUserMedia` is denied). The page will silently fail with no user feedback. The "No pitch detected" message only shows when `frame?.midi == null && started`, which is ambiguous — it could mean the user is silent or the mic was denied.
- **Change needed:** After `source.start()`, catch errors and display a clear "Microphone access denied" message. This is non-blocking because the `mic-denied` rejection (Finding 02) is itself blocking and fixing that will make the error path clearer.

## Previous findings

None (turn 1).

## Questions for the owner

None.
