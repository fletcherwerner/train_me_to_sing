# E15 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the blocking UI finding: each warm-up glide now shows the piano (range markers, target key, live sung key) and a "Target / Sung" note line. The "Good session" note moved below the content so it no longer pushes the piano down, and it is dropped from the wrap-up.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Warm-up piano and note name | `src/ui/screens/Warmup.tsx` | `PianoKeyboard` under the graph, plus `warmup-note-labels` |
| Good-session note | `src/ui/screens/Practice.tsx` | Rendered after the body; hidden in the wrap-up |
| e2e | `tests/e2e/practice.spec.ts` | Warm-up asserts the piano and note labels for every glide |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (440 of 440) |
| `npm run test:e2e` | pass (80 of 80) |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| UI-E15-T1-01 | Fixed | Piano with range markers and live sung key, and a Target/Sung note line, added to the warm-up; e2e asserts them. |
| UI-E15-T1-02 | Deferred | Warm-up glides use `BeatIndicator` with the same count-in (`metronome: true`) as other exercises. I did not change it and did not check it on screen. |
| UI-E15-T1-03 | Fixed | Note moved below the content and removed from the wrap-up. It still appears below the controls when it shows, so it does not move the piano or Stop. |
| PLAN-E15-T1-01 | Deferred | Unit A match lessons use their own scoring. Owner to confirm that skipping the tip there is acceptable. |
| PLAN-E15-T1-02 | Deferred | The review part is covered by the separate seeded lesson test. Not changed this turn. |

## Not done

Nothing in scope is missing apart from the two deferred non-blocking items above.

## Assumptions and deviations

None new.

## How to see it

`/practice`, Warm-up. Add `?minutes=21` to see the note below the content.
