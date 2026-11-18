# S04 — Spike: narrower pitch axis on the graph — Summary

**Approved:** 2026-11-17 · **Turns:** 1 · **Branch merged:** `epic/S04` into `main`

## What was accomplished

- The live and results pitch graphs now show only the exercise's notes plus 3 semitones above and below. Your saved range no longer widens the axis, so being a little sharp or flat shows as a clear gap between the red voice line and the black target.
- The results graph uses the same band as the live graph. The old wider results axis (up to C2–C6) is gone.
- Singing outside the band is drawn as a dashed red line pinned to the top or bottom edge. The ▲ / ▼ markers on the live graph are unchanged.
- Axis labels now include the lowest and highest target note, so a narrow axis always has labels.

The work was built on `main` before the loop ran. The coder only confirmed it matched the epic and changed no code.

## Changes made during review

None. Both reviews approved in turn 1.

## How to test it

1. Run `npm run dev` and open a Stage 1 lesson from Home (`/lesson/:lessonId`). Add `?sim=perfect` to the URL to use the simulated singer.
2. Run You do. The graph shows a few rows around the notes, with the lowest and highest note labelled. The red line sits on the black line.
3. Try `?sim=flat40`. The red line sits visibly below the black.
4. Try `?sim=octaveDown`. A dashed red line runs along the bottom edge, and the per-note result says "Right note, wrong octave".
5. On the results screen, the axis is the same narrow band as during the run.
6. Run the automated checks: `npm run lint`, `npm test` (285 pass), `npm run test:e2e` (50 pass) and `npm run build`.

## Not verified by the agents

- Singing with a real microphone: slightly sharp, and one note an octave low.
- Dark mode was not captured. S04 changes no colours.
- The live dashed line mid-note on a phone. The octaveDown live screenshot was taken before the first note, so only the results graph shows the dashed line.

## Known issues and deferred items

None. The coder notes (`docs/epic-notes/S04.md`) and both reviews record no open findings.

## For the owner to decide

None.
