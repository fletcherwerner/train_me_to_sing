# S02 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The pitch graph works as specified. It sits above the piano in I do, We do and You do, and the results screen draws the whole attempt as black and red lines. At 1280 and 393 px there is no sideways scroll and Stop stays visible. The one risk is that the owner has not yet decided whether UR-01 ("no scrolling piano roll") still applies, because this epic adds a scrolling graph. The long-song (over 30 s) results scrolling was not exercised.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| I do, count-in and running (black only) | OK | OK | `screenshots/laptop-perfect-1-ido-countin.png`, `screenshots/phone-perfect-2-ido-run.png` |
| We do (sim=perfect) | OK | OK | `screenshots/laptop-perfect-3-wedo.png`, `screenshots/phone-perfect-3-wedo.png` |
| You do running, on target | OK | OK | `screenshots/laptop-perfect-4-youdo.png`, `screenshots/phone-perfect-4-youdo.png` |
| You do, octave low (▼ marker at the now line) | OK | OK | `screenshots/laptop-octaveDown-4-youdo.png`, `screenshots/phone-octaveDown-4-youdo.png` |
| Results, passed (red lies on black) | OK | OK | `screenshots/laptop-perfect-5-results.png`, `screenshots/phone-perfect-5-results-full.png` |
| Results, octave error (red an octave below) | OK | OK | `screenshots/laptop-octaveDown-5-results-full.png`, `screenshots/phone-octaveDown-5-results.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Partial (the piano is still there; a scrolling graph is added, as the epic specifies) | see Proposed requirement changes |
| UR-02 | Yes | — |
| UR-03 | Yes (the graph adds to the existing cents meter) | — |
| UR-04 | Yes (live ▼ marker, and the results red line sits an octave away) | — |
| UR-05 | Yes (the piano still shows the low/high markers) | — |
| UR-10 | Yes | — |
| UR-12 | Yes | — |
| UR-13 | Yes (score, pass mark and verdict visible without scrolling on the phone) | — |
| UR-21 | Yes (scrollWidth equals clientWidth at both sizes) | — |
| UR-22 | Yes (graph, piano, chips and Stop all fit in 852 px) | — |
| UR-24 | Partial | UI-S02-T1-01 |
| UR-27 | Not checked in dark mode | UI-S02-T1-02 |

## Findings

### UI-S02-T1-01 — Graph has no legend

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** results screen, both sizes; `screenshots/phone-octaveDown-5-results.png`
- **Requirement:** `UR-24`. Meaning is never carried by colour alone.
- **Problem:** Nothing says that black is the target and red is your voice. The thick and thin line widths help, but a beginner has to guess.
- **Change needed:** Add a small caption or legend such as "Black = target, red = you".

### UI-S02-T1-02 — Dark mode not checked

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** the graph in dark mode
- **Requirement:** `UR-27`
- **Problem:** The graph has its own light background by design. I did not capture it in dark mode, so I cannot confirm that the axis labels and the surrounding page are legible.
- **Change needed:** Capture a dark-mode screenshot next turn, or confirm that it was checked.

## Previous findings

None (turn 1).

## Not verified

- Review-script steps 2, 3 and 5 with a real voice: going sharp or flat on purpose, the gap when you pause, and singing one note low. I used only `sim=perfect` and `sim=octaveDown`.
- Step 6: the Stage 3 song results scroll sideways inside the graph box. Not exercised.
- Reduced-motion behaviour.
- Real iPhone and sound. Whether the graph and the audio feel in sync can only be judged by ear.

## Proposed requirement changes

- Update UR-01, which says "There is no scrolling piano roll". This epic deliberately adds a scrolling pitch graph above the piano, so the owner should reword UR-01, for example "The piano is the main key visualization; a pitch graph above it shows the notes over time." Alternatively the owner can retire the "no scrolling" clause.
