# E06 — Turn 2 — UI Review

**Verdict:** BLOCKED - NEEDS OWNER

**Blocking open:** 3 · **Non-blocking open:** 2

## Summary

I still cannot see the lesson steps or the results screen. The shell again refused to run the click-through script (`node comms/E06/turn-02/ui-scripts/flow.mjs`, "requires approval"), although the screenshot tool ran. The coder disputed UI-E06-T1-01 for the same reason, so it has been open and disputed for two turns. It needs the owner to allow the script or to walk through the lesson. The intro screen was recaptured; the Home link still looks like a plain blue text link.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| `/lesson/demo` intro (range 45–64) | Captured, not opened | Issue (Home link look) | `screenshots/lesson-demo-laptop.png`, `screenshots/lesson-demo-phone.png` |
| `/lesson/nope` | Captured, not opened | Captured, not opened | `screenshots/lesson-nope-laptop.png`, `screenshots/lesson-nope-phone.png` |
| I do, We do, You do (idle and running), results | Not seen | Not seen | none |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 to UR-14 | Not verified (lesson body not seen) | UI-E06-T2-01 |
| UR-21, UR-22, UR-27 | Not verified beyond the intro | UI-E06-T2-01 |
| UR-23 | Unconfirmed: the coder says the Home link has a 48 px minimum, but on the phone it still looks like a small plain link | UI-E06-T2-02 |
| UR-24 | Partial: the intro is now centred, but it still has default link and button styling | UI-E06-T2-02 |
| UR-26 | Home link present on the intro | — |

## Findings

### UI-E06-T2-01 — Lesson steps and results not seen in a running app

- **Severity:** Blocking
- **Status:** Open
- **Where:** `/lesson/demo` after Start, all steps and results, both sizes; no screenshot exists
- **Requirement:** UR-01 to UR-14, UR-22; epic "Layout top to bottom" and "Results view"
- **Problem:** The script was refused permission to run a second time. The coder's dispute is correct that this is a permission problem and not a code defect, but I cannot approve screens I have not seen.
- **Change needed:** The owner should allow `node comms/E06/turn-02/ui-scripts/flow.mjs perfect` and `... octaveDown`, or run the review script on the real app, then restart the review.

### UI-E06-T2-02 — Home link still looks small and unstyled on the phone

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Intro, iPhone; `screenshots/lesson-demo-phone.png`
- **Requirement:** UR-23, UR-24
- **Problem:** Home appears as a default blue underlined link. The 48 px tap area could not be measured because I could not run a script. The link also does not match the button styling on the range screen.
- **Change needed:** Style Home as a visible button, like the other controls.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E06-T1-01 | Open | Disputed by the coder; script still refused. Needs the owner. |
| UI-E06-T1-02 | Open | Blocking in turn 1. The size could not be measured, and the link looks small and unstyled; see UI-E06-T2-02. |
| UI-E06-T1-03 | Open | Non-blocking. Intro is now centred. Default link and button looks remain; see UI-E06-T2-02. |

## Not verified

- Review script steps 2–8: I do, We do, You do, results, chip tap, Try again / Hear it again, leaving mid-run.
- Microphone prompt and indicator, sound, the iPhone itself, dark mode.

## Proposed requirement changes

None
