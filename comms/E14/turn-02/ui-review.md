# E14 — Turn 2 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 3

## Summary

The blocking Prove instruction is fixed: before the run it says to start on the lit note, and during the run it says "Sing it from memory." with no key lit. Three non-blocking items from turn 1 remain open, as the coder deferred them.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Prove start | OK | OK | `screenshots/b04-prove-start-laptop.png`, `b04-prove-start-phone.png` |
| Prove run | OK | OK | `screenshots/b04-prove-run-laptop.png`, `b04-prove-run-phone.png` |
| Prove results | OK | OK | `screenshots/b04-prove-results-laptop.png`, `b04-prove-results-phone.png` |
| Other Stage 1 screens (re-captured, unchanged) | OK | OK | `screenshots/` |

The sideways-scroll check passed on every screen at phone size.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-07 | Yes | UI-E14-T1-01 fixed |
| UR-12, UR-14 | Partial | UI-E14-T1-03 (non-blocking) |
| UR-21 | Yes | UI-E14-T1-02 (non-blocking) |
| UR-22 | Yes | — |

## Findings

None new this turn.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E14-T1-01 | Fixed | `screenshots/b04-prove-start-phone.png` shows "Your turn. Start on the lit note, then sing from memory." with E3 lit. `b04-prove-run-phone.png` shows "Sing it from memory." with no key lit. |
| UI-E14-T1-02 | Open | Deferred by the coder. Non-blocking: the title still sits close to the Home button on long titles. |
| UI-E14-T1-03 | Open | Tip is now concrete. Non-blocking: match results still have no hit and missed tiles, so they look different from lesson results. |
| UI-E14-T1-04 | Open | Non-blocking: dark running and results states are still not reviewed. Home in dark mode is fine. |

## Not verified

- Echo with a real recording and playback.
- Hearing the target tone and the count-in clicks.
- Sliding on purpose, and the "you slid" message (needs a real voice).
- Whether the starting note changes between attempts.
- Stage 2 and 3 lessons.
- Everything on a real iPhone.

## Proposed requirement changes

None.
