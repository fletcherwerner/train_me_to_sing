# E03 — Turn 2 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The two blocking findings from turn 1 are fixed on the screens I could capture. The intro now has Start and Home buttons of at least 44 px, and the home page links have a 44 px minimum. The sandbox again refused to run my click-through script, so I did not see any wizard step after "Start". I am approving because I found no open Blocking problem, but those steps are unseen and left for the owner.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| /range intro | OK | OK | `screenshots/range-laptop.png`, `screenshots/range-phone.png` |
| Home with saved range | OK | OK | `screenshots/home-laptop.png`, `screenshots/home-phone.png` |
| Find, countdown, recording, result, failure, confirm | Not seen | Not seen | none |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-15 | Not verified | — |
| UR-16 | Not verified | — |
| UR-17 | Not verified | — |
| UR-05 | Not verified | — |
| UR-21 | Partial (intro and home: no horizontal scroll, nothing clipped) | — |
| UR-23 | Yes on intro and home (Start and Home buttons look at least 44 px; `.tap-link` is 44 px in CSS). Other steps not seen. | — |
| UR-26 | Yes on intro (Home button visible). The coder says it is on every step; I did not see that. | — |
| UR-27 | Not verified | — |
| UR-25 | Not verified | — |

## Findings

### UI-E03-T2-01 — Pages still unstyled; layouts differ between screens

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Intro and home, both sizes; `screenshots/range-phone.png`, `screenshots/home-phone.png`
- **Requirement:** `UR-24` (consistency)
- **Problem:** The intro is centred with a default-looking heading, and the home page is left-aligned. This is the deferred UI-E03-T1-03. The coder's reason is accepted: a shared layout belongs to a later epic.
- **Change needed:** None this epic. Revisit when the app shell is built.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E03-T1-01 | Fixed | Start 44 px or more and Home visible in the new intro screenshots; home links have a 44 px minimum. Other wizard buttons not seen. |
| UI-E03-T1-02 | Fixed | A Home button shows on the intro at both sizes. Behaviour on other steps and microphone stop are not seen. |
| UI-E03-T1-03 | Open | Deferred by the coder; stays Non-blocking. Carried forward as UI-E03-T2-01. |

## Not verified

- Every wizard step after Start: live keyboard C2–C6 with large note name, the 3 – 2 – 1 countdown with highlighted digit, the 3 s progress bar, result with playback, the failure message, and the confirm step with range markers, −/+ nudges and warning. My script `ui-scripts/wizard.mjs` is written, and it also logs any button under 44 px, but the sandbox would not run it. The owner should run `node comms/E03/turn-02/ui-scripts/wizard.mjs` with the dev server up, or step through by hand.
- Whether the Home button is present on every step and stops the microphone and sound.
- Dark mode (UR-27).
- Hearing the countdown clicks and note playback; real microphone and iPhone behaviour.
- Review-script steps 2 to 7.
- The dev server I started may still be running; I could not stop it from this session.

## Proposed requirement changes

None.
