# S06 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

The Lesson screen now measures the piano level at the microphone during I do and ignores quieter input inside notes in We do. The gate applies to the live graph, scoring and the results graph. A headphones notice shows when the gate is above 0.02. The simulator has `bleed` and `bleedSing` modes.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Pure bleed logic | `src/core/scoring/bleed.ts`, `bleed.test.ts` | `measureBleed`, `bleedGate`, `applyGate` |
| Lesson | `src/ui/screens/Lesson.tsx` | I do records and measures. We do gates live and after the run. Notice `bleed-notice`. You do is not gated. |
| Sim | `simSinger.ts`, `SyntheticPitchSource.ts`, `index.ts`, `frameRecorder.ts` | New behaviours, per-frame rms, `melodyPlaying` and `sings` flags, optional transform in `recordFrames` |
| E2E | `tests/e2e/bleed.spec.ts` | bleed, bleedSing, perfect on `s1-05` |
| Notes | `docs/epic-notes/S06.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (292 of 292) |
| `npm run test:e2e` | pass (53 of 53) |
| `npm run build` | pass |

## Not done

Nothing. One known gap: the live piano keys and cents meter (`useLiveAttempt`) still read the ungated source. The spec names only the graph.

## Assumptions and deviations

- `core/scoring/bleed.ts` defines `MIN_RMS = 0.01` itself, because `core` cannot import `PITCH_CONFIG`.
- The bleed level is React state, not a ref, so the notice re-renders. It is per Lesson visit.
- In I do, the non-bleed sims report rms 0, as with headphones. That keeps `sim=perfect` free of the notice.
- The `sim=bleed` e2e allows at most one stray dot on the red path. The simulator looks one frame ahead at a note edge, so a strict empty path fails.

## How to see it

`/#/lesson/s1-05?sim=bleed`: play I do, then We do. The practice line says 0 of 5 notes and the notice shows. Try `sim=bleedSing` and `sim=perfect` the same way.
