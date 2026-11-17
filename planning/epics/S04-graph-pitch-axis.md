# S04 — Spike: narrower pitch axis on the graph

> **Recorded after the fact.** The owner asked for this directly and it was built outside the build loop, on `main`, after S03. This file records what was built so the loop can review it. If the driver runs S04, the coder's job is to confirm the work below matches this file and the checks pass, and to fix any gaps, not to rebuild it.

## Goal

The pitch graph (S02) spanned the student's whole saved range plus 2 semitones, and the results graph also stretched to any sung pitch up to C2–C6. Rows were thin, so being a little sharp or flat was hard to see. The axis now spans only the exercise's notes plus a small buffer, so agreement (or disagreement) between the black target and the red voice is easy to read.

## What you will review

In a lesson, the live and results graphs show only a few semitones around the exercise's notes. In-tune singing sits on the black line; a quarter-tone off is clearly off it. Singing far outside the band shows as a dashed red line along the top or bottom edge.

## Depends on

S03 (run order only), S02 pitch graph (`src/core/exercise/pitchGraph.ts`, `src/ui/components/PitchGraph.tsx`).

## Scope

In: the pitch axis of the live graph and the results graph; how off-axis singing is drawn; axis labels.
Out: time axis, colours of the target and in-axis voice, graph size, scoring.

## Specification

### Bounds (`graphPitchBounds` in `src/core/exercise/pitchGraph.ts`)

- `GRAPH_MARGIN = 3` semitones.
- Bounds are the lowest target note − 3 to the highest target note + 3. The student's saved range no longer widens the axis.
- With no notes, the range ± 3 is used.
- The results graph uses the same bounds as the live graph. `resultsPitchBounds` (which widened to sung pitch, capped at C2–C6) is removed.

### Off-axis voice

- `splitByBounds(points, bounds)` splits one sung polyline into runs inside and outside the axis. Each run after the first starts with the previous run's last point, so the pieces join.
- Inside runs are drawn as before (`graph-sung`, solid red).
- Outside runs are pinned to the nearer edge, 2 px inside the box, and drawn dashed (`graph-sung-off`, class `pitch-graph__sung--off`). The live graph's ▲ / ▼ markers are unchanged.

### Labels

- `labelledMidis(bounds, range, notes)` labels every C, the range ends that fall inside the axis, and the lowest and highest target notes, so a narrow axis always has at least one label.

## Tests

- `pitchGraph.test.ts`: bounds are target low/high ± 3 and ignore a wider range; notes outside the range are covered; empty notes fall back to the range; `splitByBounds` keeps an inside line as one run and splits and joins on leaving and re-entering; labels include the target low and high.
- `PitchGraph.test.tsx`: `sim=perfect` red points within 50 cents of their notes on the narrow axis; `sim=octaveDown` keeps the axis at target ± 3, the solid path is empty and the dashed path runs along the bottom edge.
- Playwright: the existing pitch-graph, hardening and lesson specs pass unchanged.

## Review script

1. Open a Stage 1 lesson and run You do. The graph shows only a few rows around the notes, labelled with the lowest and highest note.
2. Sing slightly sharp on one note: the red line sits visibly above the black.
3. Sing one note an octave low: a dashed red line runs along the bottom edge for that note, and the per-note result says wrong octave.
4. On the results screen the axis is the same narrow band as during the run.
