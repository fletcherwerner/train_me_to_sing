# E01 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

The piano page works: keys light blue when pressed, C labels are correct, the range inputs redraw the keyboard, and there is no horizontal scroll at 1280, 393 or 360 px, in light or dark mode. The one blocking problem is that /dev/piano has no way back to the home screen (UR-26).

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home (placeholder) | OK | OK | `screenshots/home-laptop.png`, `home-phone.png`, `dark/home-phone-dark.png` |
| /dev/piano, default C3-C5 | OK | OK | `screenshots/dev-piano-laptop.png`, `dev-piano-phone.png`, `dark/dev-piano-*-dark.png` |
| Key pressed (target lit) | OK | OK | `screenshots/target-lit-laptop.png`, `target-lit-phone.png`, `target-lit-phone-dark.png` |
| Range 40-64 and 49-70 (black-key ends) | OK | OK (also 360 px) | `screenshots/range40-64-*.png`, `range-black-ends-*.png` |

Sung-note, edge-arrow and range-marker states are not reachable from the dev page, so they were not seen in the running app (render tests only).

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes (piano shown, no piano roll) | — |
| UR-02, UR-03, UR-04, UR-05 | Not verifiable yet: dev page cannot show sung note, edge arrow or range markers | UI-E01-T1-03 |
| UR-21 | Yes: scrollWidth equals viewport at 1280, 393, 360 | — |
| UR-23 | Partial | UI-E01-T1-02 |
| UR-24 | Yes: target is blue, plus position | — |
| UR-26 | No | UI-E01-T1-01 |
| UR-27 | Yes: dark-mode keys, labels and inputs legible | — |

## Findings

### UI-E01-T1-01 — No way back to home from /dev/piano

- **Severity:** Blocking
- **Status:** Open
- **Where:** /dev/piano, all states, both sizes; `screenshots/dev-piano-phone.png`
- **Requirement:** `UR-26`: "Every screen has an obvious way back to the home screen."
- **Problem:** The page has only a heading, Start, the keyboard and inputs. The owner must edit the URL or use browser back.
- **Change needed:** Add a visible "Home" link to `/` at the top of the dev page. Make it at least 44 px tall on the phone.

### UI-E01-T1-02 — Small tap targets on the phone

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** /dev/piano at 393 px; `screenshots/dev-piano-phone.png`
- **Requirement:** `UR-23`
- **Problem:** The Start button is 41 px high. White keys are about 25 px wide (15 keys in 361 px). Number inputs and the home link are small. Key width is inherent to showing 24 semitones, but the other controls can be fixed.
- **Change needed:** Make Start, the inputs and links at least 44 px tall on the phone. Later epics should show fewer keys or make the keyboard taller where precise tapping matters.

### UI-E01-T1-03 — Dev page cannot exercise sung, arrow and range-marker states

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** /dev/piano
- **Requirement:** UR-02 to UR-05 (visual checks)
- **Problem:** Those states cannot be reviewed by eye, and the owner cannot check them either.
- **Change needed:** Optionally add dev controls or query params (`?sung=62.4&target=64&markers=48,67`) so these states can be seen.

## Previous findings

None (turn 1).

## Not verified

- Pitch of each key by ear (C4 lower than C5), and sound on a real device (no speakers).
- Touch behaviour on a real iPhone. Pointer events were simulated.
- Sung-note colours, edge arrows and range markers (see UI-E01-T1-03).

## Proposed requirement changes

None.
