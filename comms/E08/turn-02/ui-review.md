# E08 — Turn 2 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 4

## Summary

All three blocking findings from turn 1 are fixed. The calibration run now shows "Count-in n of 4" and "Click n of 8" with a Stop button and a Home link, and the Save/Retry result screen can be reached with `?sim=calibrate:200`. The delay slider is full width with −10/+10 buttons and a range label. The screens are still plainly styled.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Calibrate, count-in | OK | OK | `screenshots/cal-count-phone.png`, `screenshots/cal-count-laptop.png` |
| Calibrate, measured clicks | OK | OK | `screenshots/cal-click-phone.png`, `screenshots/cal-click-laptop.png` |
| Calibrate, result (Save / Retry) | OK | OK | `screenshots/cal-result-phone.png`, `screenshots/cal-result-laptop.png` |
| Calibrate, after Stop | OK | OK | `screenshots/cal-stopped-phone.png`, `screenshots/cal-stopped-laptop.png` |
| Settings, timing slider | OK | OK | `screenshots/settings-phone.png`, `screenshots/settings-laptop.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-09 | Yes (count-in is shown; the audible click was not heard) | — |
| UR-11 | Yes | — |
| UR-16 | Yes | — |
| UR-21 | Yes | — |
| UR-23 | Yes (Stop, Save, Retry, ±10 and the links are 44 px or taller; the slider thumb looks small, see below) | UI-E08-T2-01 |
| UR-24 | Partial | UI-E08-T2-02 |
| UR-26 | Yes (Home link on Calibrate and Settings) | — |

## Findings

### UI-E08-T2-01 — Slider thumb looks small

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Settings, iPhone; `screenshots/settings-phone.png`
- **Requirement:** `UR-23`
- **Problem:** The thumb looks about 15 px wide, although the coder says the touch area is 44 px. The −10/+10 buttons give a fallback.
- **Change needed:** Confirm the touch area is 44 px, or make the thumb larger.

### UI-E08-T2-02 — Calibrate and Settings buttons are browser default

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Calibrate and Settings; screenshots above
- **Requirement:** `UR-24`
- **Problem:** This is the turn 1 styling finding, deferred by the coder. The screens work.
- **Change needed:** Use the Home button style in a later polish pass.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E08-T1-01 | Fixed | Count-in and click counter are shown, and Stop is visible. |
| UI-E08-T1-02 | Fixed | The slider is full width, with ±10 buttons and a range label. |
| UI-E08-T1-03 | Fixed | The Home link is present, and the Save/Retry screen was reached. |
| UI-E08-T1-04 | Open | Deferred by the coder; non-blocking. It stays open as a Non-blocking finding. |
| UI-E08-T1-05 | Open | Carried forward as UI-E08-T2-02. |
| UI-E08-T1-06 | Fixed | Home note "Calibrate timing" is now a link (code and coder report only; I did not capture a new Home screenshot). |

## Not verified

- Real-microphone calibration, audible clicks, and review-script steps 2–7.
- Dark mode.
- A real iPhone.

## Proposed requirement changes

None.
