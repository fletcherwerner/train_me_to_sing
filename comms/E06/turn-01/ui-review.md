# E06 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 2 · **Non-blocking open:** 1

## Summary

The lesson intro and the "lesson not found" message load correctly at both sizes. I could not run the click-through script (the shell refused to run it), so I have not seen I do, We do, You do or results on screen. Those states are the point of this epic, so I cannot approve yet. The intro's Home link is also too small to tap on the phone.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| `/lesson/demo` intro (range seeded 45–64) | Issue | Issue | `screenshots/lesson-demo-laptop.png`, `screenshots/lesson-demo-phone.png` |
| `/lesson/nope` unknown lesson | OK | Issue | `screenshots/lesson-nope-laptop.png`, `screenshots/lesson-nope-phone.png` |
| `/lesson/demo` with no range (redirects to `/range`) | OK | OK | overwritten by the seeded capture; the redirect was seen in the first capture |
| I do, We do, You do (idle and running), results | Not seen | Not seen | none (script `ui-scripts/flow.mjs` written but could not run) |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01, UR-02, UR-03, UR-04, UR-05, UR-06 | Not verified (piano not seen) | UI-E06-T1-01 |
| UR-07, UR-08, UR-09, UR-10, UR-11 | Not verified | UI-E06-T1-01 |
| UR-12, UR-13, UR-14 | Not verified | UI-E06-T1-01 |
| UR-21 | Partial: intro fits at both sizes, nothing else seen | UI-E06-T1-01 |
| UR-22 | Not verified | UI-E06-T1-01 |
| UR-23 | No: Home link is about 24 px tall on the phone | UI-E06-T1-02 |
| UR-25 | Yes for unknown lesson | — |
| UR-26 | Partial: Home link present on the intro, too small to tap reliably | UI-E06-T1-02 |
| UR-27 | Not verified | UI-E06-T1-01 |

## Findings

### UI-E06-T1-01 — Lesson steps and results not seen in a running app

- **Severity:** Blocking
- **Status:** Open
- **Where:** `/lesson/demo` after Start, all steps and results, both sizes; no screenshot exists
- **Requirement:** UR-01 to UR-14, UR-22; epic "Layout top to bottom" and "Results view"
- **Problem:** My click-through script (`ui-scripts/flow.mjs`) was refused permission to run, so no screenshot of the lesson body exists. I cannot confirm the layout order, the piano, the 4-click lead-in, the Stop button, or whether results fit without scrolling.
- **Change needed:** Nothing in the code yet. The driver or owner must allow `node comms/E06/turn-01/ui-scripts/flow.mjs perfect` (and `octaveDown`) to run. It saves screenshots to `screenshots/`. I will review them next turn.

### UI-E06-T1-02 — Home link too small to tap on the phone

- **Severity:** Blocking
- **Status:** Open
- **Where:** Intro and not-found screens, iPhone; `screenshots/lesson-demo-phone.png`, `screenshots/lesson-nope-phone.png`
- **Requirement:** UR-23 "Tap targets are at least 44 px in both dimensions on the phone"; UR-26
- **Problem:** "Home" is a plain text link about 24 px tall. It is the only way back from the not-found message and is easy to miss with a thumb.
- **Change needed:** Give the Home link a minimum 44 × 44 px tap area, or style it as a button like the other controls. Check that the same applies to Home on the results screen.

### UI-E06-T1-03 — Intro and not-found screens look unstyled

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Intro, laptop and iPhone; `screenshots/lesson-demo-laptop.png`
- **Requirement:** UR-24 (consistency with earlier screens)
- **Problem:** The Home link is the default blue and the Start button is left-aligned with a default look. On the range screen both are centred and larger, so the two screens do not match. On the laptop the content is also pushed to a left column.
- **Change needed:** Use the same button and link styling and alignment as the range and home screens.

## Previous findings

Turn 1: none.

## Not verified

- All of review script steps 2–8: I do, We do, You do, results, chip tap, Try again / Hear it again, leaving mid-run.
- The microphone prompt and the real mic indicator turning off.
- Sound (piano, clicks, start note).
- The iPhone itself and dark mode.

## Proposed requirement changes

None
