# S04 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

S04 was already built on `main`. I checked it against the epic file and found no gaps. I added `docs/epic-notes/S04.md` and changed no code.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Axis bounds, split, labels | `src/core/exercise/pitchGraph.ts` | `GRAPH_MARGIN` 3; `resultsPitchBounds` removed |
| Graph drawing | `src/ui/components/PitchGraph.tsx` | dashed `graph-sung-off` path |
| Tests | `pitchGraph.test.ts`, `PitchGraph.test.tsx` | cover the spec |
| Notes | `docs/epic-notes/S04.md` | new |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (285 of 285) |
| `npm run test:e2e` | pass (50 of 50) |
| `npm run build` | pass |

## Response to findings

Turn 1: none.

## Not done

Nothing

## Assumptions and deviations

None.

## How to see it

Run a Stage 1 lesson with `?sim=octaveDown` and look at the graph.
