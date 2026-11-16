# E13 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The run screen now fits both window sizes with Home, title, step, graph, piano, Target/Sung, chips and Stop all visible. Sound-stopped and microphone-lost states show the specified wording with a clear retry. Buttons and Home are one consistent style across the screens I opened. I did not check dark mode, the Import progress prompt, or the range-test failure states in this turn; see "Not verified".

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Lesson You do, running (s1-05) | OK | OK | `screenshots/l-youdo-run-laptop.png`, `screenshots/l-youdo-run-phone.png` |
| Lesson You do, running, flat sung note (s3-01) | OK | OK | `screenshots/l-flat-youdo-phone.png`, `screenshots/l-flat-youdo-laptop.png` |
| Sound stopped mid-run | OK | OK | `screenshots/l-stalled-phone.png`, `screenshots/l-stalled-laptop.png` |
| Microphone lost, Reconnect microphone | OK | OK | `screenshots/l-miclost-phone.png`, `screenshots/l-miclost-laptop.png` |
| Results (fail) | OK | OK | `screenshots/results-flat40-phone.png`, `screenshots/results-flat40-laptop.png` |
| Home | OK | OK | `screenshots/home-phone.png`, `screenshots/home-laptop.png` |
| Settings | OK | OK | `screenshots/settings-phone.png`, `screenshots/settings-laptop.png` |
| Range test (find) | OK | OK | `screenshots/range-find-phone.png`, `screenshots/range-find-laptop.png` |
| Import MIDI (start) | OK | OK | `screenshots/import-phone.png`, `screenshots/import-laptop.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-03 | Yes | Flat note: the sung key is orange and the meter shows "♭ 40" (`l-flat-youdo-phone.png`); the results mark it as a miss. |
| UR-07 | Yes | Step labels read "I do · We do · You do" with the active one underlined, plus a one-line instruction. |
| UR-10 | Yes | The current chip is highlighted; the strip scrolls sideways inside itself. |
| UR-11 | Yes | Stop is visible during runs and is not covered by anything. |
| UR-13 | Yes | Verdict, score, pass mark and the action buttons are visible at the top on the phone. |
| UR-21 | Yes | No horizontal page scroll or overlap in the screenshots. |
| UR-22 | Yes | The page is not taller than the window in You do, at both sizes. |
| UR-23 | Yes | Buttons are about 48 px tall. |
| UR-24 | Yes | One button style; one primary button per state; the legend uses thick/thin line samples as well as colour. |
| UR-25 | Yes | Sound-stopped and mic-lost messages are in plain words with the next action. |
| UR-26 | Yes | Home is at top left on every screen I opened. |
| UR-27 | Not verified | Dark mode was not captured this turn. |

## Findings

### UI-E13-T1-01 — Phone chip strip cuts the last chip at the edge

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Lesson You do, s3-01, phone, `screenshots/l-flat-youdo-phone.png`
- **Requirement:** E13 B1 (the strip scrolls sideways inside itself) and UR-10
- **Problem:** The seventh chip is cut off at the right edge ("E3" shows as "E"). This is the scrolling strip working as specified, but nothing tells the student that more chips follow.
- **Change needed:** Optional: add a fade or a visible partial-chip hint at the right edge, or tell the owner this is intended.

### UI-E13-T1-02 — Large empty area below the controls on the phone

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Lesson You do, phone, `screenshots/l-youdo-run-phone.png`
- **Requirement:** UR-06 (readability at arm's length)
- **Problem:** About 25% of the screen is empty under Stop. The piano and graph could be taller to use it.
- **Change needed:** Optional: let the graph and piano grow on tall windows.

## Previous findings

Turn 1: none.

## Not verified

- Review script steps 1–3 with real headphones, Bluetooth or sleep/wake. I only used the `suspendAudio` and `loseMic` test hooks.
- The range-test failure screens (step 1) and the Calibrate recovery screen.
- Step 6 by ear. I did see an orange sung key on the piano for a flat note with `sim=flat40`.
- Step 8, dark mode (UR-27) on every screen.
- Step 9, the Import progress prompt (boxed, Merge primary, Replace danger and warning). It needs a file picked.
- Step 10: whether Settings lists only "Open the tuner" in a production build. The dev server shows dev links by design.
- The 393×660 window.
- Everything that needs a real iPhone.

## Proposed requirement changes

None
