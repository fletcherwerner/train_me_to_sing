# S07 — Turn 3 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The phone header overlap is fixed. At 393 px the "‹ Lessons" button ends at x 133 and the title starts at x 141. At 360 px the layout is the same. At 1280 px nothing changed. There is no horizontal scroll at any width.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Lesson header (s2-03, range 45–64, sim=perfect) | OK | OK | `screenshots/measure-393.png`, `screenshots/measure-360.png`, `screenshots/measure-1280.png` |

Turn-1 screens were not re-captured. Turn 3 touched only the header CSS.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-21 | Yes | — |
| UR-23 | Yes: the Lessons button is 48 px tall | — |
| UR-24 | Yes | UI-S07-T3-01 |
| UR-27 | Yes | UI-S07-T3-02 |

## Findings

### UI-S07-T3-01 — Missed-note tiles are saturated red (carried from UI-S07-T2-02)

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Results, not passed. Not re-checked.
- **Requirement:** epic section D
- **Problem:** Unchanged. The ✗ and the word carry the meaning.
- **Change needed:** Optional: a softer miss colour.

### UI-S07-T3-02 — Pitch graph stays white in dark mode (carried from UI-S07-T2-03)

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Running and results in dark mode. Not re-checked.
- **Requirement:** `UR-27`
- **Problem:** Unchanged.
- **Change needed:** Optional.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-S07-T2-01 | Fixed | Measured at 393 and 360 px: no overlap, 2-column grid (`screenshots/measure-393.png`). |
| UI-S07-T2-02 | Withdrawn | Carried as UI-S07-T3-01. |
| UI-S07-T2-03 | Withdrawn | Carried as UI-S07-T3-02. |

## Not verified

- Real microphone, piano sound and headphones.
- iPhone Safari rendering and tap comfort.
- Results screens in light and dark; not re-captured this turn.

## Proposed requirement changes

None.
