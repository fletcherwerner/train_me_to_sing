# S06 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the blocking UI finding: the live Sung readout, keys and cents meter in We do now use the same bleed gate as the graph, so the piano no longer shows as the student's voice.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Live gate | `src/ui/hooks/useLiveAttempt.ts` | New optional `gateRms` argument. While a note is playing, frames quieter than it give no sung note. |
| Lesson | `src/ui/screens/Lesson.tsx` | Passes `bleedGate(bleedRms)` in We do only; I do and You do pass null. |
| E2E | `tests/e2e/bleed.spec.ts` | With `sim=bleed`, the live readout shows "Sung: —" during the run. |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (292 of 292) |
| `npm run test:e2e` | pass (53 of 53) |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| UI-S06-T1-01 | Fixed | Live gate added as above, with an e2e assertion. |
| UI-S06-T1-02 | Deferred | The notice uses the existing `tuner-error` style, which the epic names. A restyle or reserved space is a design choice for the owner. |
| UI-S06-T1-03 | Deferred | I did not check phone scrolling this turn. The notice is an ordinary block in the page flow, so the page should scroll to the graph. |

## Not done

Nothing in scope. The e2e assertion samples the readout once, 3 s into the run, so it is a weak check.

## Assumptions and deviations

The live gate applies whenever a note is current, which matches the post-run gate's "inside a note" rule.

## How to see it

`/#/lesson/s1-05?sim=bleed`: do I do, then Sing along. The Sung readout stays "—".
