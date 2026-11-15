# E04 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

`/dev/exercise` is laid out cleanly at both sizes: fit sentence, keyboard with low/high markers, note chips, beat dots, and Play/Repeat/Stop. The no-range message links to `/range`. The main problem is that the phone controls are slightly under the 44 px tap-target minimum. I could not capture the playing or count-in states, because my own Playwright script was not approved to run, so those are left unverified.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Idle, range 45–64, three-note exercise | OK | Issue (UI-E04-T1-01) | `screenshots/dev-exercise-laptop.png`, `screenshots/dev-exercise-phone.png` |
| No range stored | OK (not viewed; same code path) | OK | `screenshots/norange/dev-exercise-phone.png` |
| Narrow range 50–58 | not viewed | Issue (UI-E04-T1-02) | `screenshots/narrow/dev-exercise-phone.png` |
| Dark mode | not viewed | OK | `screenshots/dark/dev-exercise-phone-dark.png` |
| Count-in / playing / finished | not captured | not captured | none (see Not verified) |
| Fit failure message, Hot Cross Buns with lyrics | not captured | not captured | none |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes | — |
| UR-05 | Yes (low/high markers shown) | — |
| UR-09 | Not verified (count-in only appears during play) | — |
| UR-10 | Partial: chips are present, but progress states are unverified | UI-E04-T1-03 |
| UR-11 | Yes (Stop is visible; it is disabled while idle) | — |
| UR-21 | Yes at idle: no horizontal scroll visible, nothing clipped | UI-E04-T1-02 |
| UR-22 | Partial: fits at idle, unverified while playing | UI-E04-T1-02 |
| UR-23 | No | UI-E04-T1-01 |
| UR-25 | Yes (no-range message links to `/range`) | — |
| UR-26 | Yes (Home link on the page) | — |
| UR-27 | Yes (dark mode legible) | — |

## Findings

### UI-E04-T1-01 — Phone tap targets are below 44 px

- **Severity:** Blocking
- **Status:** Open
- **Where:** `/dev/exercise`, iPhone, idle; `screenshots/dev-exercise-phone.png`
- **Requirement:** `UR-23` "Tap targets are at least 44 px in both dimensions on the phone."
- **Problem:** I measured the Play, Repeat and Stop buttons at about 43 px tall. The Exercise dropdown is about 18 px tall and the Home link is about 20 px tall. The owner will have trouble hitting them when the phone is propped at arm's length.
- **Change needed:** Give buttons, the select and the Home link `min-height: 44px` and a `min-width` of at least 44 px.

### UI-E04-T1-02 — Narrow range makes the piano very tall, and the playing layout is unchecked

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `/dev/exercise`, iPhone, range 50–58; `screenshots/narrow/dev-exercise-phone.png`
- **Requirement:** `UR-22` "everything needed … is visible without scrolling the page."
- **Problem:** With a 9-semitone range the keyboard grows to about 370 px tall. Idle, the buttons end at about 783 px of 852 px. Hot Cross Buns chips with lyrics wrap onto several lines, and the count-in number appears during play, so the controls could be pushed below the fold.
- **Change needed:** Cap the keyboard height, for example at 180 px, so the controls stay on screen. Check the playing state with the longest exercise.

### UI-E04-T1-03 — Chip states not verified

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** playing state, both sizes; no screenshot
- **Requirement:** `UR-10`, `UR-02`, and the epic's SequenceStrip spec (current chip highlighted, scrolled into view)
- **Problem:** I could not see whether the current chip and the lit key are clearly distinct from the idle state. The idle chips are all the same grey outline.
- **Change needed:** On turn 2 the coder should supply, or the owner should check, screenshots of the count-in and mid-play states. The current chip must be clearly highlighted, and chips already played and still to come should be distinguishable.

## Previous findings

Turn 1: none.

## Not verified

- Review script steps 3–7: the 4 audible clicks, key and chip timing, Stop and Repeat while playing, the effect of a different range, and the iPhone check.
- Count-in display, BeatIndicator during play, Hot Cross Buns lyrics, and the "Needs N semitones; your range is M." failure message. My script to capture these was blocked.

## Proposed requirement changes

None.
