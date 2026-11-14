# E02 — Turn 01 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Built mic pitch detection with `pitchy`, a synthetic pitch source for testing, a `CentsMeter` component, and a `/dev/tuner` page. All four checks (lint, test, test:e2e, build) pass.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| `src/audio/pitch/PitchSource.ts` | New | `PitchFrame` and `PitchSource` interfaces exactly as in the architecture file. |
| `src/audio/pitch/MicPitchSource.ts` | New | Real mic pitch detection using `pitchy`. `getUserMedia` with echo cancellation, noise suppression, auto gain all false. `AnalyserNode` (fftSize 2048), not connected to speakers. `requestAnimationFrame` loop computing RMS, pitch via `pitchy`, applying thresholds (clarity ≥ 0.9, rms ≥ 0.01, freq 60–1100 Hz), emitting frames. Exports `PITCH_CONFIG`. |
| `src/audio/pitch/SyntheticPitchSource.ts` | New | Synthetic source for testing. Takes `(tSec: number) => number | null` behaviour. Emits frames every animation frame with `clarity: 1`, `rms: 0.1`. Includes `constantPitch(midi)` helper. |
| `src/audio/pitch/index.ts` | New | `createPitchSource()` reads `sim` from URL hash (for HashRouter). If `sim=const:<midi>`, returns synthetic source; otherwise mic source. |
| `src/audio/pitch/smoothing.ts` | New | Pure `smoothPitch(values)` function: 5 raw midi values, returns median of non-null ones if ≥ 3, otherwise null. |
| `src/audio/pitch/smoothing.test.ts` | New | Unit tests for `smoothPitch` with spec examples. |
| `src/audio/pitch/SyntheticPitchSource.test.ts` | New | Unit tests for synthetic source emitting configured pitch and null behaviour. |
| `src/ui/components/CentsMeter.tsx` + `.css` | New | Horizontal bar −100 to +100, centre zone ±toleranceCents, needle (green inside, orange outside), text `♭ 30`, `♯ 12`, or `—`. |
| `src/ui/screens/dev/TunerDev.tsx` | New | `/dev/tuner` page: Start/Stop buttons, piano C2–C6, large note name, frequency in Hz, `CentsMeter` (tolerance 50), debug line (clarity, rms). Throttled to ~30fps. |
| `src/app/routes.tsx` | Modified | Added `/dev/tuner` route. |
| `src/ui/screens/Home.tsx` | Modified | Added link to tuner page. |
| `tests/e2e/tuner.spec.ts` | New | Playwright tests: page loads, sim mode shows C4 and ♯, no-pitch case. |
| `docs/epic-notes/E02.md` | New | Epic notes per architecture requirements. |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass (0 errors) |
| `npm test` | pass (4 files, 19 tests) |
| `npm run test:e2e` | pass (4 tests) |
| `npm run build` | pass |

## Response to findings

Turn 1: no previous findings.

## Not done

Nothing from the epic scope is missing.

## Assumptions and deviations

- `pitchy` is imported as an ES module (it declares `"type": "module"` in its package.json). The `PitchDetector.forFloat32Array(2048)` is created once and reused across all `MicPitchSource` instances.
- The `createPitchSource()` function parses query params from the hash fragment (`window.location.hash`) because `HashRouter` puts the query string inside the hash (e.g. `/#/dev/tuner?sim=const:60.3`).

## How to see it

Open `https://localhost:5173/#/dev/tuner` (laptop) or `https://<laptop-ip>:5173/#/dev/tuner` (iPhone). With `?sim=const:60.3` the synthetic source emits C4 at +30 cents.

## Blocker

None.
