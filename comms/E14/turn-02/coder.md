# E14 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the blocking Prove instruction finding and replaced the generic match pass tip. Other non-blocking items are deferred with reasons.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Prove instruction | `src/ui/screens/Lesson.tsx` | Prove You do shows "Your turn. Start on the lit note, then sing from memory." before the run and "Sing it from memory." during it. |
| Match tip | `src/ui/screens/MatchRun.tsx` | Perfect-run tip is now "Every note matched. Move on to the next lesson, or try again to match faster." |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (379 of 379) |
| `npm run test:e2e` | pass (70 of 70, 9.2 min) |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| UI-E14-T1-01 | Fixed | Prove-specific lines as requested. Existing e2e checks for "Your turn" still pass. |
| UI-E14-T1-02 | Deferred | Phone header spacing not changed this turn; the header is shared across lessons and needs a layout change beyond a small fix. |
| UI-E14-T1-03 | Fixed in part | Tip is now concrete. Hit/missed tiles for match results deferred (larger restyle). |
| UI-E14-T1-04 | Deferred | Reviewer asked for no change. |
| PLAN-E14-T1-01 | Deferred | Full run passed 70 of 70 here, but is slow (stage1 spec ~7.6 min). Shortening the three-level runs would reduce coverage; left for the owner to decide. |

## Not done

Match results tiles and phone header gap (see above).

## Assumptions and deviations

None.

## How to see it

`npm run dev`, open a Stage 1 Unit B lesson, advance to Prove.
