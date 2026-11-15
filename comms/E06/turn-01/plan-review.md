# E06 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The session reducer, Lesson screen, results view, tips, demo lesson and route all match the epic specification. Every listed test exists and passes, except that one extra e2e test (no-range redirect) failed once in the full run. It passed when run alone. The two open findings are non-blocking.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass, 0 errors | Yes |
| `npm test` | 76 of 76 pass | Yes |
| `npm run test:e2e` | 12 of 13 pass. The no-range redirect test failed at `page.goto` in the full run and passed alone. | Partly (report said 13 of 13) |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| Reducer types, events and rules (NEXT gating, RUN_ENDED storage, invalid events unchanged) | Yes | — |
| Step table (melody, metronome, start note, mic, graded, controls) | Yes | — |
| 4-click lead-in on every run, including repeats, via `playExercise` | Yes | — |
| Stop button while running | Yes | — |
| Route `/lesson/:lessonId`, `demoLesson` (`0 2 4 2 0`, 60 bpm, t1, 0.8) | Yes | — |
| Redirect to `/range` when no range; fit failure message with needed and available semitones plus a home link | Yes | — |
| Layout order and instruction lines | Yes | — |
| Intro: goal, headphones reminder, Start unlocks audio and requests the mic | Yes | — |
| We do practice line; You do goes to results automatically | Yes | — |
| Leaving the screen stops playback and the mic | Yes | — |
| Results: headline, score, pass mark, chips that play a note, missed-note reasons, tip, buttons, `onAttemptComplete` | Yes | — |
| Reducer tests (all five listed) | Yes | — |
| Playwright perfect and octaveDown tests | Yes | PLAN-E06-T1-01 |

## Findings

### PLAN-E06-T1-01 — No-range e2e test failed once in the full run

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `tests/e2e/lesson.spec.ts:52`
- **Requirement:** `planning/01-architecture.md`, Definition of done: tests pass.
- **Problem:** The test failed at `page.goto('/#/lesson/demo')` during the full e2e run. It passed when run alone. The coder reported 13 of 13.
- **Change needed:** Find the cause. It may be a shared-context or timing problem after the long tests. Make the test reliable, for example by navigating to `/` first and then setting the hash.

### PLAN-E06-T1-02 — `onAttemptComplete` is not called for a You do run with no result

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/screens/Lesson.tsx` (`run`)
- **Requirement:** `planning/epics/E06-lesson-session.md`, Results view: "Expose an `onAttemptComplete(result)` callback prop".
- **Problem:** If the mic source is missing, a You do run ends with no result and does not show results. The student sees nothing change and has no message. This is unlikely, because the mic is opened on Start.
- **Change needed:** Optional. Show a short message when a You do run ends without a result.

## Previous findings

None (turn 1).

## Questions for the owner

None
