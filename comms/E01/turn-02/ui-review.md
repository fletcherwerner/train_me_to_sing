# E01 — Turn 2 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The owner can now return home from /dev/piano, phone controls are 44 px tall, and the new query params let the sung, off-target, match, octave-away, edge-arrow and range-marker states be seen. All three turn 1 findings are fixed in fresh screenshots. No horizontal scroll at 393 px (scrollWidth 393) or 1280 px.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| /dev/piano, sung off-target (orange) with blue target, range markers | OK | OK | `screenshots/laptop.png`, `screenshots/phone.png` |
| Sung matches target (green) | - | OK | `screenshots/phone-match.png` |
| Sung an octave below target | - | OK | `screenshots/phone-octave.png` |
| Sung above keyboard (edge arrow "G#5 ▶") | - | OK | `screenshots/phone-above.png` |
| Dark mode | - | OK | `screenshots/phone-dark.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes | — |
| UR-02 | Yes: blue target and orange sung shown together | — |
| UR-03 | Partial: match (green) vs off (orange) is clear; how far flat or sharp is not shown yet (later epics) | — |
| UR-04 | Yes: octave-away key and edge arrow both visible | UI-E01-T2-01 |
| UR-05 | Yes: "low"/"high" brackets under the keys | — |
| UR-21 | Yes at 393 and 1280 | — |
| UR-23 | Yes for Home, Start, inputs (all 44 px high). White keys are about 25 px wide, inherent to 24 semitones | — |
| UR-24 | Yes: colour plus position/labels | — |
| UR-26 | Yes: Home link at top | — |
| UR-27 | Yes: dark mode legible | — |

## Findings

### UI-E01-T2-01 — Edge arrow label is small on the phone

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** /dev/piano with `sung=80`, 393 px; `screenshots/phone-above.png`
- **Requirement:** `UR-04`, `UR-06`
- **Problem:** The "G#5 ▶" marker is about 11 px text, small to read at arm's length.
- **Change needed:** Enlarge it when the keyboard is used on training screens (a later epic). Not needed now.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E01-T1-01 | Fixed | Home link visible, 59x44 px (`phone.png`) |
| UI-E01-T1-02 | Fixed | Start 81x44, inputs 67x44, Home 59x44 measured at 393 px |
| UI-E01-T1-03 | Fixed | Query params show sung, target and marker states |

## Not verified

- Pitch of each key by ear and sound on speakers.
- Real iPhone touch behaviour (pointer events only simulated).
- Whether the Home link navigates correctly was not clicked in this run (link visible only).

## Proposed requirement changes

None.
