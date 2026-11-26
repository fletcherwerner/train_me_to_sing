# S11 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Stage 1 You do now plays the whole pattern (then a beat of silence, then the count-in) at every level. The solo is earned: We do is gated, Practise needs two Learn passes and starts at We do. The note guide reacts at the speed of the pitch tracking and is taller on the laptop. Details and deviations are also in `docs/epic-notes/S11.md`.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Call before a solo | `core/exercise/timeline.ts`, `audio/exercisePlayer.ts`, `ui/hooks/usePlaybackPosition.ts`, `useLiveAttempt.ts`, `audio/pitch/frameRecorder.ts` | `playCall`; handle has `callStartSec`/`callEndSec`; `startSec` is still the student's beat 0; frames before `callEndSec` dropped; no sung value shown during the call |
| Lesson screen | `ui/screens/Lesson.tsx`, `Lesson.css` | `run-status` ("Listen…" / "Your turn"), `hear-again`, `wedo-gate`, gated primary, "Passed at Learn: n of 2" |
| Session | `core/session/sessionMachine.ts` | `createSession(levels, level, { guided })`; guided Practise starts at We do (BEGIN, ADVANCE, STEP_DOWN) |
| Unlock | `storage/schema.ts`, `store.ts`, `level.ts`, `exportImport.ts` | optional `learnPasses`; 2 Learn passes in Stage 1; older entries at Practise keep it; merge takes the max |
| Guide | `ui/components/NoteGuide.tsx`, `.css`, `PitchGraph.css` | 35 ms hold on text; live cents rounded to 5; hidden `aria-live` (once a second); 30 ms dot easing; no held-cents state; laptop guide 90 px, graph 100 px |
| Live smoothing | `audio/pitch/smoothing.ts`, `MicPitchSource.ts`, `PitchSource.ts` | `SMOOTH_WINDOW_DISPLAY = 3`; frame carries `midiFast`; scoring keeps `midi` (5) |
| Test singers | `audio/pitch/simSinger.ts` | `weDoMiss`, `step300` |
| Tests | session, progress, timeline, smoothing, NoteGuide, simSinger unit tests; `tests/e2e/soloReadiness.spec.ts` | updated `noteGuide`, `stage1`, `lesson`, `practice`, `pitchGraph`, `hardening` specs |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (637 of 637) |
| `npm run test:e2e` | pass (165 passed, 1 skipped: the laptop-only height test on the phone project) |
| `npm run build` | pass |

## Response to findings

Turn 1: none.

## Not done

Nothing in scope is missing.

## Assumptions and deviations

- Built-in Stage 2–3 lessons have `levels: false`, so they have no Practise to unlock. The e2e checks that they keep the start-note flow (no call, no "Hear it again", no level message). The store unit test covers "Stage 2 unlocks after one".
- Existing specs updated for the new flow: first Learn pass is "Passed" (1 of 2); Practise starts at We do; graph minimum height lowered from 110/109 to 100 px on the laptop (the epic allows down to 100); count-in waits allow for the call.
- "Hear it again" also appears at Prove and in Today's practice reviews (same screen). At Prove the piano shows no target keys during the call ("stays as today").
- The "2 consecutive frames" hold is a 35 ms timer, since `NoteGuide` re-renders only when the value changes.
- `step300` stamps `window.__tmtsStepAt` (test instrumentation) for the response-time test; it passes at ≤120 ms for `data-state` and ≤150 ms for the text, on both sizes.
- At 1280 × 800 the layout only just fits (guide 90 px, graph 100 px, tighter guide margins and text line) to keep the `run fits the window` specs green.

## How to see it

`npm run dev`, open Sol–mi (`#/lesson/s1b-01`) and follow the review script in `planning/epics/S11-solo-readiness.md`. With `?sim=weDoMiss` the gate shows; with `?sim=step300` the guide steps.
