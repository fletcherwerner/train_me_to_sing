# E08 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 3 · **Non-blocking open:** 3

## Summary

Stage 2 on Home, the disabled-lesson reasons, the plain-words tolerance line and the one-time calibrate hint all look right and fit both sizes. The calibration screen is bare. While it runs there is no visible click or countdown and no Stop control. The delay slider on Settings is too small to use on a phone.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home, Stage 2, range 45–64 | OK | OK (last row's status wraps below the title) | `screenshots/home-laptop.png`, `screenshots/home-phone.png` |
| Home, range 50–58 (disabled lessons) | not captured | OK | `screenshots/narrow/home-phone.png` |
| Lesson intro s2-01 (tolerance line, calibrate hint) | OK | OK | `screenshots/lesson-s2-01-laptop.png`, `screenshots/lesson-s2-01-phone.png` |
| Lesson intro s2-07 | OK | OK | `screenshots/lesson-s2-07-laptop.png`, `screenshots/lesson-s2-07-phone.png` |
| Settings, timing slider | OK | Issue | `screenshots/settings-laptop.png`, `screenshots/settings-phone.png` |
| Calibrate, intro | OK | OK | `screenshots/settings-calibrate-phone.png` |
| Calibrate, running | Issue | Issue | `screenshots/cal-running-phone.png` |
| Calibrate, error "Couldn't hear clear sounds" | not captured | OK | `screenshots/cal-result-phone.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-09 | No (calibration run) | UI-E08-T1-01 |
| UR-11 | No (calibration run) | UI-E08-T1-01 |
| UR-16 | Partial | UI-E08-T1-01 |
| UR-18 | Yes | — |
| UR-19 | Yes, with reason shown ("Needs 12 semitones; your range is 8") | UI-E08-T1-04 |
| UR-21 | Yes | — |
| UR-23 | No | UI-E08-T1-02 |
| UR-24 | Partial | UI-E08-T1-04 |
| UR-25 | Yes (error text and "Try again") | — |
| UR-26 | Partial | UI-E08-T1-03 |
| UR-27 | Not checked in dark mode | — |

## Findings

### UI-E08-T1-01 — Calibration run shows nothing and cannot be stopped

- **Severity:** Blocking
- **Status:** Open
- **Where:** Calibrate, running, iPhone; `screenshots/cal-running-phone.png`
- **Requirement:** `UR-09` "4-click lead-in that is both heard and shown"; `UR-11` "stopped at any moment with one visible control"
- **Problem:** After Start, the only change is a line of text. The page is otherwise blank, with no click indicator, no count-in or click number, and no Stop or Cancel button. The student cannot tell when the 8 measured clicks begin, which is the point of the exercise.
- **Change needed:** Show the lead-in visibly (for example "1 2 3 4", then "Click 3 of 8"). Add a visible Stop button that cancels the run and releases the microphone.

### UI-E08-T1-02 — Delay slider is too small to use on a phone

- **Severity:** Blocking
- **Status:** Open
- **Where:** Settings, Timing delay, iPhone; `screenshots/settings-phone.png`
- **Requirement:** `UR-23` "Tap targets are at least 44 px"
- **Problem:** The slider track is about 120 px wide and the thumb is about 15 px, so it is hard to drag to a value between 0 and 500 in 10 ms steps. There is also no label showing the 0–500 range.
- **Change needed:** Make the slider full width with a thumb and touch area of at least 44 px high. Optionally add −10 / +10 buttons that are 44 px or larger.

### UI-E08-T1-03 — Calibration screen has no way back to Home, and no Save/Retry view was reachable

- **Severity:** Blocking
- **Status:** Open
- **Where:** Calibrate, all states; `screenshots/settings-calibrate-phone.png`
- **Requirement:** `UR-26` "Every screen has an obvious way back to the home screen"
- **Problem:** The only link is a small "Settings" text link, and Settings is one tap from Home. The link is also under 44 px tall. I could not reach the "Measured delay: N ms" screen with Save and Retry, because `?sim=` gives constant rms.
- **Change needed:** Add a Home link, and make these links at least 44 px tall. Provide a sim option, or a Playwright hook, that produces a successful measurement so the result screen can be reviewed.

### UI-E08-T1-04 — Minor consistency issues

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Home, Stage 2, iPhone; `screenshots/home-phone.png`, `screenshots/narrow/home-phone.png`
- **Requirement:** `UR-24`
- **Problem:** The last row ("Natural minor…") puts "Not started" below the title, while the other rows put it on the right. Disabled rows have a dashed border but no icon. They are told apart by the wording "Needs 12 semitones…", which is acceptable.
- **Change needed:** Use the same row layout for every row. Optionally add a lock icon to disabled rows.

### UI-E08-T1-05 — Calibration and Settings styling is unstyled browser default

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Calibrate and Settings; screenshots above
- **Requirement:** `UR-24`
- **Problem:** The default grey buttons and blue links differ from the bordered buttons on Home.
- **Change needed:** Use the same button style as Home's "Start lesson".

### UI-E08-T1-06 — Hint wording and the Stage 2 note point at Settings

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Home Stage 2 note; `screenshots/home-phone.png`
- **Requirement:** `UR-20`, `UR-25`
- **Problem:** "Calibrate timing in Settings first." is plain text and not a link. The lesson hint does link.
- **Change needed:** Make "Calibrate timing" in the Stage 2 note a link to `/settings/calibrate`.

## Previous findings

None; this is turn 1.

## Not verified

- Real-microphone calibration: script steps 2, 3 and 7, and the plausibility of the measured values.
- Whether the audible clicks are heard.
- Steps 4–6: lateness marking, the 500 ms slider effect, and whether tolerances feel fair on s2-07 and s2-05.
- iPhone behaviour (real device).
- The Save/Retry result screen (see UI-E08-T1-03).
- Dark mode.
- Laptop view of the narrow-range Home.

## Proposed requirement changes

None.
