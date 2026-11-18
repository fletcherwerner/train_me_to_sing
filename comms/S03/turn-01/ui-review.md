# S03 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The mic check screen is clear and usable at both sizes. It has a level bar with a detector mark, a plain status line, a large "Hearing" note, a lit piano key, and a "Notes caught" list that stays after Stop. There is no horizontal scroll in light or dark mode. The one small issue is that the layout shifts when the level bar appears.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Idle (light, dark) | OK | OK | `screenshots/idle-laptop.png`, `idle-phone.png`, `idle-*-dark.png` |
| Running, sim C4 (light, dark) | OK | OK | `screenshots/running-laptop.png`, `running-phone.png`, `running-*-dark.png` |
| Stopped, C4 still listed (light, dark) | OK | OK | `screenshots/stopped-phone-dark.png`, `stopped-laptop.png`, `stopped-phone.png` |
| Start error (no mic in headless browser) | OK | OK | `screenshots/error-phone.png` |
| Home with Mic check link | OK | OK | `screenshots/home-phone.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes | — |
| UR-02 | Not applicable | There is no target note on this screen. |
| UR-05 | Not applicable | Range is not used on this screen. |
| UR-06 | Partial | "Hearing: C4" is about 18 px. This is readable on a phone held close, but not at arm's length. See UI-S03-T1-01. |
| UR-11 | Yes | Stop is a visible control. |
| UR-21 | Yes | `scrollWidth` did not exceed the window at either size. Nothing is clipped. |
| UR-22 | Yes | Everything fits in one screen. |
| UR-23 | Yes | Home, Start/Stop and Clear are about 48 px tall and at least 83 px wide. |
| UR-24 | Yes | The status is stated in words. The green piano key means "being sung", which matches the earlier screens. |
| UR-25 | Yes | The mic-denied, mic-missing and mic-lost messages say what to do. The generic fallback "Could not start the microphone. Check your settings and try again." is less specific. |
| UR-26 | Yes | A Home button is at the top. |
| UR-27 | Yes | Both modes are legible, and the buttons invert in dark mode. |

## Findings

### UI-S03-T1-01 — Note readout is small, and the layout jumps on Start

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Mic check, running, iPhone; `screenshots/running-phone.png` against `screenshots/stopped-phone.png`
- **Requirement:** `UR-06` (large enough at arm's length). Also general polish.
- **Problem:** "Hearing: C4" is small body text. The piano also moves down when Start is tapped, because the meter and status rows appear. That makes the screen jump while the student is looking at it.
- **Change needed:** Make the Hearing note noticeably larger, for example 2 rem or more. Reserve the space for the meter and status so the piano does not move.

## Previous findings

Turn 1: none.

## Not verified

- Review-script steps 1 to 7 need a real microphone, so none were run live. The simulator showed the "We can hear you." state only.
- The amber "Too quiet" and "No sound yet" states and the real mic-denied message were not captured.
- The mic-disconnected message (step 7) was not captured.
- The iPhone home-screen app with wired headphones was not tested.

## Proposed requirement changes

None.
