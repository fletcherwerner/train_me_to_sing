# E03 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 2 · **Non-blocking open:** 1

## Summary

I could only capture the intro and the home page. The sandbox refused to run my click-through script, so I did not see any wizard step after "Start": find, countdown, recording, result, failure and confirm. What I did see is unstyled, with a tap target on the Start button that is far too small for the phone and no way back to the home screen. The wizard states need a second look once these are fixed.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| /range intro | Issue | Issue | `screenshots/range-laptop.png`, `screenshots/range-phone.png` |
| Home with saved range | OK | OK | `screenshots/home-laptop.png`, `screenshots/home-phone.png` |
| Find, countdown, recording, result, failure, confirm | Not seen | Not seen | none |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-15 | Not verified | — |
| UR-16 | Not verified | — |
| UR-17 | Not verified | — |
| UR-05 | Not verified | — |
| UR-21 | Partial (intro and home only, no horizontal scroll seen) | — |
| UR-23 | No | UI-E03-T1-01 |
| UR-26 | No | UI-E03-T1-02 |
| UR-27 | Not verified | — |
| UR-25 | Not verified | — |

## Findings

### UI-E03-T1-01 — Start button is under 44 px tall on the phone

- **Severity:** Blocking
- **Status:** Open
- **Where:** /range intro, iPhone 393 px; `screenshots/range-phone.png`
- **Requirement:** `UR-23` "Tap targets are at least 44 px in both dimensions on the phone."
- **Problem:** The Start button is a default browser button, roughly 45 × 20 px. It is the only control on the screen. The "Redo range test" link on the home page has the same problem. The other wizard buttons (Record, Use this, Try again, −/+, Save) are probably the same, since the intro has no styling.
- **Change needed:** Give every wizard button and the home links a minimum of 44 × 44 px on the phone. The −/+ buttons must have the same minimum.

### UI-E03-T1-02 — No way back to the home screen from /range

- **Severity:** Blocking
- **Status:** Open
- **Where:** /range intro, both sizes; `screenshots/range-laptop.png`
- **Requirement:** `UR-26` "Every screen has an obvious way back to the home screen. Leaving a lesson stops sound and the microphone."
- **Problem:** The intro shows no link or button back home. A student who already has a range and opens "Redo range test" cannot cancel. The epic says the microphone stays on through the wizard, so leaving must also stop it.
- **Change needed:** Add a visible "Home" or "Cancel" control on every wizard step. Leaving must stop the microphone and any playing note.

### UI-E03-T1-03 — Pages are unstyled and the layout is inconsistent

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Intro and home, both sizes; `screenshots/range-phone.png`, `screenshots/home-laptop.png`
- **Requirement:** `UR-24` (consistency)
- **Problem:** The intro is centred but the home page is left-aligned. On the laptop the home content starts at x=280 with a large empty area. This is a placeholder look and I did not block on it.
- **Change needed:** Use one shared page layout and heading style across screens.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| — | — | Turn 1. |

## Not verified

- Every wizard step after Start: the live keyboard C2–C6 with large note name, the 3-2-1 countdown, the 3 s progress bar, the result with playback, the failure message, and the confirm step with range markers, −/+ nudges and the warning. My script `ui-scripts/wizard.mjs` is written but the sandbox would not run it. The driver or owner may need to approve running it.
- Dark mode (UR-27) was not captured.
- Hearing the countdown clicks and note playback, and all real microphone and iPhone behaviour.
- The review-script steps 2 to 7.
- I did not stop the dev server I started in the background.

## Proposed requirement changes

None.
