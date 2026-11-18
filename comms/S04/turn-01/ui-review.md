# S04 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 0

## Summary

The graph now shows a narrow band around the exercise notes, labelled with the lowest and highest note. In the screenshots, a flat voice (flat40) sits visibly below the black target. A wrong-octave voice shows as a dashed red line along the bottom edge. The results graph uses the same narrow band. Both sizes are usable with no clipping or side scrolling.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| You do, live graph (octaveDown, flat40, perfect) | OK | OK | `screenshots/laptop-octaveDown-live.png`, `screenshots/phone-flat40-live.png`, `screenshots/*-perfect-live.png` |
| Results, passed (perfect, flat40) | OK | OK | `screenshots/laptop-perfect-results.png`, `screenshots/laptop-flat40-results.png`, `screenshots/phone-*-results.png` |
| Results, wrong octave (octaveDown) | OK | OK | `screenshots/phone-octaveDown-results.png`, `screenshots/laptop-octaveDown-results.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-03 | Yes. Flat or sharp shows as a visible gap between the red and black lines. | — |
| UR-04 | Yes. The dashed edge line plus "Right note, wrong octave" in the results. | — |
| UR-10 | Yes. The graph still shows what remains and what was sung. | — |
| UR-12 | Yes. The octaveDown results list each miss with its reason. | — |
| UR-21 | Yes. No horizontal scroll or clipping at 1280 or 393 px. | — |
| UR-22 | Yes. Graph, piano, note chips and Stop are all visible without scrolling during You do. | — |
| UR-24 | Yes. The dashed line is a different shape as well as a colour, and the legend is unchanged. | — |

## Findings

None.

## Previous findings

None. This is turn 1.

## Not verified

- Singing with a real microphone: sharp by a small amount, and the octave-low step in the review script. I used the simulated singer only.
- Dark mode was not captured. S04 changes no colours.
- A phone screenshot with the live dashed line caught mid-note. The octaveDown live frame was captured before the first note, so only the results graph shows the dashed line.

## Proposed requirement changes

None
