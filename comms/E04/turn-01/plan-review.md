# E04 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The work meets the epic. The notation parser, fit and displayRange follow the architecture algorithm. The lead-in is a pure, tested timeline with 4 clicks, and the player, hook, components and `/dev/exercise` page match the specification. I found one minor non-blocking phase-labelling issue.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 49 of 49 pass | Yes |
| `npm run test:e2e` | 8 of 8 pass | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| types.ts (architecture types) | Yes | — |
| parseNotation (rests, beats, negatives, lyrics, errors) | Yes | — |
| fit (algorithm, range-too-small) | Yes | — |
| displayRange | Yes | — |
| metronome scheduleClick (30 ms square, 1000/1500 Hz, gain 0.15) | Yes | — |
| playExercise / PlaybackHandle / LEAD_IN_CLICKS, audio-clock scheduling, stop | Yes | — |
| Lead-in always plays; start note then a beat of silence | Yes | — |
| usePlaybackPosition | Yes | PLAN-E04-T1-01 (minor) |
| SequenceStrip (chips, min 28 px, results, scroll) | Yes | — |
| BeatIndicator | Yes | — |
| /dev/exercise (templates, fit info, failure text, keyboard, buttons, range link) | Yes | — |
| Tests: parser, fit, property, timing, lead-in (60/120 bpm, 3/4), Playwright | Yes | — |

The property test uses inline templates because the catalog is not built yet. That is acceptable.

## Findings

### PLAN-E04-T1-01 — 'startNote' phase reported during the 0.2 s pre-roll when there is no start note

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/hooks/usePlaybackPosition.ts:31`
- **Requirement:** E04 spec, usePlaybackPosition: phase is one of startNote, countIn, playing or done.
- **Problem:** `positionAt` returns `startNote` whenever `t < countInStart`. That includes the 0.2 s before the first click when `playStartNote` is false.
- **Change needed:** Optional. Pass whether a start note is used, or return `countIn` with `countInRemaining` 4 in that case. E06 may rely on this phase.

## Previous findings

None (turn 1).

## Questions for the owner

None
