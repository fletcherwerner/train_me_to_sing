# E07 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The owner can use what this epic delivers. Home lists the eight Stage 1 lessons with "0 of 8 passed" and a Continue card. Not started, Best %, Passed and doesn't-fit states are all distinct, and each has a label as well as an icon. Settings has the range, a clear reset confirmation, and Home links. Two minor polish items are listed below.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home, range A2–E4, nothing started | OK | OK | `screenshots/home-laptop.png`, `screenshots/home-phone.png` |
| Home, range D3–B3 (9 semitones), all fit | OK | OK | `screenshots/narrow/home-laptop.png`, `screenshots/narrow/home-phone.png` |
| Home, 3-semitone range (disabled rows) | OK | Issue (UI-E07-T1-01) | `screenshots/home-smallrange-laptop.png`, `screenshots/home-smallrange-phone.png` |
| Home with a passed and an attempted lesson | OK | OK | `screenshots/home-progress-laptop.png`, `screenshots/home-progress-phone.png` |
| Settings | OK | Issue (UI-E07-T1-02) | `screenshots/settings-laptop.png`, `screenshots/settings-phone.png` |
| Settings, reset confirmation | OK | OK | `screenshots/settings-confirm-laptop.png`, `screenshots/settings-confirm-phone.png` |
| Lesson not found | OK | OK | `screenshots/lesson-nope-laptop.png`, `screenshots/lesson-nope-phone.png` |

Page scroll width equals the viewport width at both sizes (1280 and 393), so there is no horizontal scrolling.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-18 | Yes | — |
| UR-19 | Yes | UI-E07-T1-01 (polish) |
| UR-20 | Yes | — |
| UR-21 | Yes | — |
| UR-23 | Partial | UI-E07-T1-02 (developer links only) |
| UR-24 | Yes | — |
| UR-25 | Yes | — |
| UR-26 | Yes | — |
| UR-27 | Not checked | Dark mode not captured this turn |

## Findings

### UI-E07-T1-01 — Disabled row layout varies by reason length

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Home, 3-semitone range, iPhone; `screenshots/home-smallrange-phone.png`
- **Requirement:** UR-19, UR-24 (consistency)
- **Problem:** Most disabled rows put the reason on its own line below the title. "Leaps up" puts it to the right of the title. The rows look inconsistent. Nothing says "Doesn't fit" in words, but the reason is clear.
- **Change needed:** Use one layout for all disabled rows (reason on its own line). Optionally start the reason with "Doesn't fit:".

### UI-E07-T1-02 — Developer links on Settings are small tap targets

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Settings, iPhone; `screenshots/settings-phone.png`
- **Requirement:** UR-23
- **Problem:** The four developer links measure about 18 px tall. The owner's controls (Home, Redo range test, Reset progress, Settings) are 48 px and fine.
- **Change needed:** Give the dev links a minimum height of 44 px, or accept that they are developer-only.

## Previous findings

None: this is turn 1.

## Not verified

- Review-script steps 2–8 with real singing: completing lessons, failing a passed lesson, reloading, and working through all eight lessons. I checked the passed, attempted and reset states only with seeded storage. The coder's Playwright tests cover the simulated runs.
- Whether any lesson feels too hard, too easy or mis-scored.
- The iPhone run on a real device.
- Dark mode.

## Proposed requirement changes

None.
