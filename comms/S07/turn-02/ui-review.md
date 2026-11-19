# S07 — Turn 2 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

The phone header overlap from turn 1 is not fixed in the running app. At 393 px the "‹ Lessons" button still runs into the lesson title. The stacked-header rule the coder added in `Lesson.css` has no effect, because `.page-header` in `index.css` sets the three-column grid and wins. Everything else I reviewed in turn 1 is unchanged and fine.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Lesson header (s2-03, range 45–64, sim=perfect) | OK | Issue (overlap) | `screenshots/lesson-s2-03-phone.png`, `screenshots/lesson-s2-03-laptop.png`, `screenshots/measure-393.png`, `screenshots/measure-360.png`, `screenshots/measure-1280.png` |

Turn-1 screens (Home, step flow, results, light and dark) were not re-captured. The coder's turn-2 change touched only the header.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-21 | Partial: header overlap at 393 and 360 px; no horizontal scroll | UI-S07-T2-01 |
| UR-26 | Yes | — |
| UR-27 | Yes | UI-S07-T2-03 |
| UR-24 | Yes | UI-S07-T2-02 |

## Findings

### UI-S07-T2-01 — "‹ Lessons" button overlaps the lesson title on the phone (re-raised from UI-S07-T1-01)

- **Severity:** Blocking
- **Status:** Open
- **Where:** every lesson screen at 393 px (`screenshots/lesson-s2-03-phone.png`, `screenshots/measure-393.png`) and 360 px.
- **Requirement:** `UR-21` "nothing clipped or overlapping"
- **Problem:** I measured the elements at 393 px. The computed grid is still three columns (`102px 140px 102px`). The button spans x 16–133 and the title spans x 126–267, so they overlap by about 7 px. The screenshot shows the title glued to the button, centred, not stacked. At 1280 px there is no overlap.
- **Change needed:** Make the narrow-screen rule actually win. Either raise its specificity (`.page-header.lesson-header { grid-template-columns: 1fr; }` inside the media query) or fix the order in which the two CSS files load. Then confirm with a computed-layout check (button right edge ≤ title left edge) at 393 and 360 px. The existing e2e overlap assertion passed against this build, so it is not testing the right thing. Check that it measures the header on the lesson-step screen, and check that it fails without the fix.

### UI-S07-T2-02 — Missed-note tiles are saturated red (carried from UI-S07-T1-02)

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Results, not passed. Deferred by the coder; I did not re-check it.
- **Requirement:** epic section D
- **Problem:** Unchanged from turn 1.
- **Change needed:** Optional: a softer miss colour.

### UI-S07-T2-03 — Pitch graph stays white in dark mode (carried from UI-S07-T1-03)

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Running and results in dark mode. Deferred by the coder; I did not re-check it.
- **Requirement:** `UR-27`
- **Problem:** Unchanged from turn 1.
- **Change needed:** Optional.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-S07-T1-01 | Withdrawn | Not fixed; re-raised as UI-S07-T2-01 (still overlapping by about 7 px at 393 px; the new CSS is not applied). |
| UI-S07-T1-02 | Withdrawn | Carried as UI-S07-T2-02. Deferred, non-blocking. |
| UI-S07-T1-03 | Withdrawn | Carried as UI-S07-T2-03. Deferred, non-blocking. |

## Not verified

- Real microphone, piano sound and headphones.
- iPhone Safari rendering and tap comfort.
- Today's practice and tapping "Next lesson" (covered by the coder's e2e).
- Results screens in light and dark. I did not re-capture them this turn.

## Proposed requirement changes

None.
