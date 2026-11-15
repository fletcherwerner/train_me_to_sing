# E04 — Turn 3 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The tap-target fix is now visible in the running app. On the phone, Play, Repeat, Stop, the Exercise select and the Home link are all about 48 px tall. The idle screen fits at both sizes with no horizontal scroll. The count-in and mid-play states are still not captured, because my Playwright script was not approved to run. The owner should check them by hand.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| `/dev/exercise` idle, range 45–64 | OK | OK | `screenshots/dev-exercise-laptop.png`, `screenshots/dev-exercise-phone.png` |
| Count-in / playing / finished | not captured | not captured | none (script `ui-scripts/play.mjs` written but not run) |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes | — |
| UR-05 | Yes (low/high markers) | — |
| UR-09 | Not verified | UI-E04-T3-01 |
| UR-10 | Not verified (note chips and beat dots are shown at idle) | UI-E04-T3-01 |
| UR-11 | Yes (Stop visible, disabled at idle) | — |
| UR-21 | Yes at idle | — |
| UR-22 | Yes at idle (controls end about 590 of 852 px on the phone) | — |
| UR-23 | Yes (buttons, select and Home link are about 48 px) | — |
| UR-25 | Yes at idle | — |
| UR-26 | Yes at idle (Home link) | — |
| UR-27 | Not re-checked this turn | — |

## Findings

### UI-E04-T3-01 — Count-in and mid-play states not verified

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** playing and count-in states, both sizes; no screenshot
- **Requirement:** `UR-09`, `UR-10`
- **Problem:** I could not run the click-through, so the 4-click lead-in display, the current-note chip and the narrow-range keyboard cap (180 px) are not confirmed in a screenshot.
- **Change needed:** The owner runs the epic's Review script for the count-in and mid-play steps. This is optional for approval.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E04-T2-01 | Fixed | Phone tap targets are about 48 px in `screenshots/dev-exercise-phone.png`. |
| UI-E04-T2-02 | Fixed | The 180 px cap is in `src/index.css`. The idle phone view is fine. The narrow-range case was not re-captured, so the owner should glance at it. |
| UI-E04-T2-03 | Fixed | Carried forward as the non-blocking UI-E04-T3-01. |

## Not verified

- Review script steps 3–7: the 4 audible clicks, key and chip timing, Stop and Repeat while playing, the effect of a different range, and the iPhone check.
- The count-in display, Hot Cross Buns lyrics, the "Needs N semitones" failure message, and dark mode.

## Proposed requirement changes

None.
