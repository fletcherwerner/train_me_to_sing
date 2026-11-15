# E04 — Turn 2 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

The coder's report says the tap targets were raised to 48 px and the keyboard capped at 180 px. The running app does not show either change. The phone screenshots match turn 1, and `src/index.css` on disk still has the old rules. The 4-click count-in and mid-play states are still not captured, because my Playwright script was not approved to run again.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Idle, range 45–64 | OK | Issue (UI-E04-T2-01) | `screenshots/dev-exercise-laptop.png`, `screenshots/dev-exercise-phone.png` |
| Idle, narrow range 50–58 | not viewed | Issue (UI-E04-T2-02) | `screenshots/narrow/dev-exercise-phone.png` |
| Count-in / playing / finished | not captured | not captured | none |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes | — |
| UR-05 | Yes (low/high markers) | — |
| UR-09 | Not verified | UI-E04-T2-03 |
| UR-10 | Not verified | UI-E04-T2-03 |
| UR-11 | Yes (Stop visible, disabled at idle) | — |
| UR-21 | Yes at idle | — |
| UR-22 | Partial: the narrow-range piano is about 300 px tall and pushes the controls down | UI-E04-T2-02 |
| UR-23 | No | UI-E04-T2-01 |
| UR-25 | Yes at idle | — |
| UR-26 | Yes at idle | — |
| UR-27 | Not re-checked this turn | — |

## Findings

### UI-E04-T2-01 — Phone tap targets are still below 44 px

- **Severity:** Blocking
- **Status:** Open
- **Where:** `/dev/exercise`, iPhone, idle; `screenshots/dev-exercise-phone.png`
- **Requirement:** `UR-23` "Tap targets are at least 44 px in both dimensions on the phone."
- **Problem:** In the screenshot the Play, Repeat and Stop buttons are about 43 px tall (about 102 px at 2.35 screenshot px per CSS px). The Exercise select is about 18 px and the Home link about 17 px. `src/index.css` has no `min-height` for the select. The button and input rule is 44 px, not 48, and sits inside `@media (max-width: 600px)`. The coder's "48 px unconditionally" is not in the working tree.
- **Change needed:** Confirm the CSS changes are saved and committed on the epic branch. Then give the buttons, the select and the Home link `min-height: 44px` (48 px is fine) and a `min-width` of at least 44 px, and re-capture the phone screenshot.

### UI-E04-T2-02 — Keyboard height cap is not applied

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `/dev/exercise`, iPhone, range 50–58; `screenshots/narrow/dev-exercise-phone.png`
- **Requirement:** `UR-22` "everything needed … is visible without scrolling the page."
- **Problem:** The keyboard is still about 260 CSS px tall with a 9-semitone range, and there is no `max-height` rule for `.dev-page .piano` in `src/index.css`. The buttons end at about 780 px of 852 px at idle. They could be pushed below the fold when lyrics wrap in Hot Cross Buns.
- **Change needed:** Apply the cap, for example `max-height: 180px`, and capture the playing state of Hot Cross Buns on the phone.

### UI-E04-T2-03 — Count-in and chip states still not verified

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** playing and count-in states, both sizes; no screenshot
- **Requirement:** `UR-09`, `UR-10`, `UR-02`, and the epic's SequenceStrip spec
- **Problem:** The coder deferred this. My script `ui-scripts/play.mjs` is ready, but running it needs approval that I did not get. The owner should check these states by hand.
- **Change needed:** The owner runs the Review script steps for the count-in and mid-play.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E04-T1-01 | Withdrawn | Not fixed. Carried forward and re-raised as UI-E04-T2-01 so the count stays accurate. |
| UI-E04-T1-02 | Withdrawn | Not fixed. Carried forward and re-raised as UI-E04-T2-02. |
| UI-E04-T1-03 | Withdrawn | Not fixed. Carried forward and re-raised as UI-E04-T2-03. |

## Not verified

- Review script steps 3–7: the 4 audible clicks, key and chip timing, Stop and Repeat while playing, the effect of a different range, and the iPhone check.
- Count-in, BeatIndicator during play, Hot Cross Buns lyrics, the "Needs N semitones" failure message, and dark mode this turn.

## Proposed requirement changes

None.
