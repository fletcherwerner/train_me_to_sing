# E04 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Built the exercise model (notation parser, range fitting, display range), a pure lead-in timeline, metronome, exercise player, playback-position hook, `SequenceStrip`, `BeatIndicator` and the `/dev/exercise` page. All four checks pass. I did not listen to the audio or try an iPhone.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Core exercise | `src/core/exercise/types.ts`, `notation.ts`, `fit.ts`, `timeline.ts` | `timeline.ts` is the pure schedule (4-click lead-in, optional start note, exercise clicks) |
| Audio | `src/audio/metronome.ts`, `src/audio/exercisePlayer.ts` | Clicks and notes scheduled up front on the audio clock; `stop()` stops both |
| UI | `usePlaybackPosition.ts`, `SequenceStrip.tsx/.css`, `BeatIndicator.tsx/.css`, `screens/dev/ExerciseDev.tsx` | Route `/dev/exercise` added, link on Home |
| Tests | `src/core/exercise/exercise.test.ts`, `tests/e2e/exercise.spec.ts` | Unit tests for parser, fit (incl. property test), timeline; e2e plays and sees chips advance |
| Docs | `docs/epic-notes/E04.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass (0 errors) |
| `npm test` | pass (49 of 49) |
| `npm run test:e2e` | pass (8 of 8) |
| `npm run build` | pass |

## Response to findings

None (turn 1).

## Not done

Nothing in scope. Review-script steps 3–7 (listening, Stop mid-way by ear, iPhone) are not verified by me.

## Assumptions and deviations

- `LEAD_IN_CLICKS` is defined in `core/exercise/timeline.ts` and re-exported from `exercisePlayer.ts`, so the pure timeline can be tested without Web Audio.
- Playback `totalSec` is the end of the last note.
- The fit property test uses inline templates because the catalog is not built yet.
- The lead-in always plays; the metronome option only controls clicks during the exercise. Exercise clicks accent each bar start.

## How to see it

Set a range, then open `/#/dev/exercise`.
