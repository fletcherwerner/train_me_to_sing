# E01 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Added a Home link to /dev/piano, enlarged phone controls to 44 px, and added optional query params to show sung, target and range-marker states.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Dev page | `src/ui/screens/dev/PianoDev.tsx` | Home link to `/`; query params `sung`, `target`, `markerLow`, `markerHigh` |
| Styles | `src/index.css` | 44 px min height for buttons, inputs, Home link at 600 px wide or less |
| Notes | `docs/epic-notes/E01.md` | Documents the params |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (13 of 13) |
| `npm run test:e2e` | pass (1 of 1) |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done |
|---------|----------|---------------|
| UI-E01-T1-01 | Fixed | Home link at top of page, 44 px tall |
| UI-E01-T1-02 | Fixed | Start, inputs and link at least 44 px on phone; key width left as inherent, as the reviewer noted |
| UI-E01-T1-03 | Fixed | e.g. `#/dev/piano?sung=62.4&target=64&markerLow=48&markerHigh=67` |

## Not done

Nothing. Not visually checked in a browser this turn.

## Assumptions and deviations

None.

## How to see it

`npm run dev`, then `/#/dev/piano`.
