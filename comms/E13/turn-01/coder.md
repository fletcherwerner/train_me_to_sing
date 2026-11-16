# E13 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

All of sections A to D are built, with tests. Audio recovery (range test, lesson, calibration, dev pages), microphone lost/missing handling, a run screen that fits 1280×800 and 393×852 with no page scroll, and one shared button/link style across screens. One item could not be done: `tsconfig.tsbuildinfo` is still tracked, because the environment refused `git rm --cached` (see Not done).

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| A1 audio engine | `src/audio/audioEngine.ts`, `src/core/session/stallDetector.ts` | `ensureAudioRunning`, `watchAudioClock`, pure `createStallDetector`, `window.__tmtsTest` only when URL has `sim=`. |
| A2 screens | `RangeSetup.tsx`, `Lesson.tsx`, `Calibrate.tsx`, `dev/TunerDev|ExerciseDev|AttemptDev.tsx`, `src/ui/audioMessages.ts` | Fixed wording. A lesson run whose audio clock did not reach the end is not scored. |
| A3 mic | `PitchSource.ts` (`onLost?`), `MicPitchSource.ts`, `SyntheticPitchSource.ts` | `ended` listener; `mic-missing` mapping; Reconnect microphone button in lesson; range "Try again" reconnects. |
| B1/B2 layout | `Lesson.tsx`, `Lesson.css`, `SequenceStrip.*`, `PitchGraph.css`, `BeatIndicator.css`, `CentsMeter.css` | One header row, no spacer, graph `clamp(110px,15vh,160px)`, one-row scrolling chips, results reordered with "Missed notes" heading. |
| B3/B4/B5 | `PianoKeyboard.tsx/.css`, `PitchGraph.tsx` | `matchCents`; label sizes from rendered scale; `GraphLegend`. |
| C styles | `index.css`, Home, Settings, ProfilesSection, ImportMidi, RangeSetup, Calibrate, dev pages | `.btn`, `.btn--primary`, `.btn--danger`, `.nav-link`, `.page-header`; CSS variables for dark mode. Home in the same place everywhere. |
| C3–C5 | `Home.tsx/.css`, `Settings.tsx`, `ImportMidi.tsx/.css` | Per spec. Import summary "N passed, M attempted". Dev links only when `import.meta.env.DEV`. |
| D1 | `schema.ts`, `store.ts`, `ProfileNotices.tsx` | `saveData` returns boolean; `saveFailed` flag and notice. |
| D2 | `.gitignore` | Entry added; file still tracked (see below). |
| Tests | `stallDetector.test.ts`, `audioEngine.test.ts`, `MicPitchSource.test.ts`, `SyntheticPitchSource.test.ts`, `PianoKeyboard.test.tsx`, `saveFailure.test.ts`, `exportImport.test.ts`, `tests/e2e/hardening.spec.ts`, updated `pitchGraph.spec.ts`, `home.spec.ts` | All listed unit and e2e cases. |
| Notes | `docs/epic-notes/E13.md` | Lists the `onLost` and graph-height deviations. |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (276 of 276) |
| `npm run test:e2e` | pass (47 of 47) |
| `npm run build` | pass |

## Response to findings

Turn 1: none.

## Not done

- D2 is partial: `tsconfig.tsbuildinfo` is in `.gitignore` but is still tracked. `git rm --cached` and `git update-index --force-remove` both required approval that this session could not give. The owner should run `git rm --cached tsconfig.tsbuildinfo`.
- Not checked on a real iPhone, headphones or microphone. Sound-stopped and mic-lost are tested only with `AudioContext.suspend()` and the synthetic source.
- Calibration's stall/lost handling has no dedicated e2e test (the spec lists none); the code path mirrors the lesson's.

## Assumptions and deviations

- `PitchSource` gained optional `onLost` (shared type in the architecture file); the S02 graph height changed to 110–160 px. Both are in `docs/epic-notes/E13.md`.
- "Exactly one primary button": on results, Try again is primary after a fail; after a pass nothing is primary (the next step is the Home link).
- At 393×660 the sticky bar stays the last element of the page, so scrolled to the bottom it covers nothing; the test checks this.
- The layout tests change the viewport inside one run per lesson instead of separate runs per size, to avoid replaying long I do runs six times.
- A lesson run is also treated as stalled when the audio clock is more than 0.5 s short of the run's end after the wall-clock timer fires. This is an addition for F2.
- The Import MIDI and dev-page "Needs N semitones" text keeps its old wording; only Home rows use "Doesn't fit:".

## How to see it

`npm run dev`, then Settings → Redo range test; a lesson such as Hot Cross Buns; Settings → Import progress. For recovery, add `?sim=perfect` (or `range:45,64`) and call `__tmtsTest.suspendAudio()` or `__tmtsTest.loseMic()` in the console. Automated: `npx playwright test tests/e2e/hardening.spec.ts`.

## Blocker

Not blocked.
