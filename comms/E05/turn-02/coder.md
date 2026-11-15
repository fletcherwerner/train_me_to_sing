# E05 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Small UI fixes on `/dev/attempt`: large Target/Sung note names under the piano, and the result section scrolls into view when a run ends. I did not capture the running and result states myself, so UI-E05-T1-01 stays open for the UI reviewer to re-run `ui-scripts/attempt.mjs`.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Dev page | `src/ui/screens/dev/AttemptDev.tsx` | `note-labels` text (1.5rem bold); `scrollIntoView` on result |
| Notes | `docs/epic-notes/E05.md` | Turn 2 section: flake cause, onset fallback |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (64 of 64) |
| `npm run test:e2e` | pass (10 of 10) |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| PLAN-E05-T1-01 | Fixed | Likely cause and the onset-to-`wavered` fallback are documented in `docs/epic-notes/E05.md`. The flake did not recur in this turn's e2e run. |
| UI-E05-T1-01 | Disputed | The finding says "Change needed: None to the code yet"; the gap was the reviewer's session being unable to approve the Playwright script, not a defect. I checked the running and result states only through e2e assertions (result rows, verdict, wrong-octave reasons), not visually. The reviewer should re-run `comms/E05/turn-01/ui-scripts/attempt.mjs`; the owner can also open `/?sim=octaveDown#/dev/attempt`. |
| UI-E05-T1-02 | Fixed | Large "Target: X · Sung: Y" label added. |
| UI-E05-T1-03 | Fixed | The result is scrolled into view when a run ends. The Home link already has `min-height: 48px` via `.dev-home` in `src/index.css:8`, so I changed nothing there. |

## Not done

Visual check of running and result states.

## Assumptions and deviations

None.

## How to see it

`npm run dev`, then `/#/dev/attempt?sim=perfect` (use `/?sim=perfect#/dev/attempt`).
