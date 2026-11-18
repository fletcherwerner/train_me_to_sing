# S05 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 0

## Summary

The app opens on Home with no saved range. It shows a "Get started" card with "Find my range" and "Load it in Settings", and every lesson is locked with "Find your range first". A lesson link with no range lands on the same Home. It fits at both sizes, in light and dark mode.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home, no range | OK | OK | `screenshots/home-laptop.png`, `screenshots/home-phone.png` |
| Lesson link, no range (redirects to Home) | OK | OK | `screenshots/lesson-x-laptop.png`, `screenshots/lesson-x-phone.png` |
| Home, no range, dark mode | OK | OK | `screenshots/dark/home-laptop-dark.png`, `screenshots/dark/home-phone-dark.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-18 | Yes | — |
| UR-19 | Yes | — |
| UR-20 | Yes | — |
| UR-21 | Yes | — |
| UR-23 | Yes | — |
| UR-24 | Yes | — |
| UR-25 | Yes | — |
| UR-26 | Yes | — |
| UR-27 | Yes | — |

- **UR-18:** the status text on each row is plain words, "Find your range first".
- **UR-19:** each locked lesson row says why it is locked. The dashed borders and grey text mark it as unavailable.
- **UR-20:** with no range, the next action is the primary "Find my range" button at the top. It is the first thing on the screen.
- **UR-21:** no horizontal scrolling or clipping at 1280 px or 393 px.
- **UR-23:** the buttons look at least 44 px tall in the phone screenshot. I did not measure them.
- **UR-24:** locked rows have a text label as well as grey styling.
- **UR-25:** "no range set" is explained, with the next action beside it.
- **UR-26:** this is Home, and a lesson link with no range lands here.
- **UR-27:** text and the primary button are legible in dark mode.

## Findings

None.

## Previous findings

Turn 1: none.

## Not verified

- Review script step 2 (loading a saved profile in Settings, then Home with range and progress). I did not click through it.
- Review script step 3 (completing the range test needs a microphone).
- Review script step 1 (reset in Settings) was checked only as a fresh load. I did not exercise the reset button.
- Real iPhone rendering. I used a 393×852 emulation.

## Proposed requirement changes

None
