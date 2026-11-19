# S07 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

The forward-pointing buttons, results actions, step bar, Next tag, status pills and light/dark tokens all work and look calmer at both sizes, with no sideways scroll. One real defect: on the phone the "‹ Lessons" button overlaps the lesson title in the header of every lesson screen.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home, light | OK | OK | `screenshots/home-laptop.png`, `home-phone.png` |
| Home, dark | OK | OK | `screenshots/dark/home-laptop-dark.png`, `dark/home-phone-dark.png` |
| Lesson intro (s2-03) | OK | Issue (header) | `screenshots/lesson-s2-03-phone.png` |
| I do, after one play ("Next: We do" primary) | OK | Issue (header) | `screenshots/flow-2-ido-played-phone-light.png`, `flow-2-ido-played-laptop-light.png` |
| We do done, You do, running (dark and light) | OK | Issue (header) | `screenshots/flow-3-wedo-done-*.png`, `flow-4-youdo-*.png`, `flow-5-running-phone-dark.png` |
| Results, passed ("Next lesson: …") | OK | Issue (header) | `screenshots/flow-6-results-perfect-phone-light.png`, `flow-6-results-perfect-laptop-dark.png` |
| Results, not passed (sim=silent) | OK | Issue (header) | `screenshots/silent-results-phone.png`, `silent-results-laptop.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-07 | Yes: step bar shows current (filled), done (✓), later (muted) with labels | — |
| UR-08 | Yes: "Play again" / "Sing along again" one tap | — |
| UR-11 | Yes: Stop visible while running | — |
| UR-13 | Yes: score, pass mark, verdict visible without scrolling | — |
| UR-18 | Yes: every lesson shows a pill with icon and word | — |
| UR-20 | Yes: "Next" tag on the recommended row; "Start today's practice" on top | — |
| UR-21 | Partial: no horizontal scroll, but header overlap at 393 px | UI-S07-T1-01 |
| UR-22 | Yes: running screen fits at 393×852 | — |
| UR-23 | Yes: buttons look at least 44 px tall | — |
| UR-24 | Yes: ✓ / ✗ / ○ with words; green for hit/pass and red for miss are consistent | UI-S07-T1-02 |
| UR-26 | Yes: "‹ Lessons" on every lesson screen and on results | — |
| UR-27 | Yes: both modes legible | UI-S07-T1-03 |

## Findings

### UI-S07-T1-01 — "‹ Lessons" button overlaps the lesson title on the phone

- **Severity:** Blocking
- **Status:** Open
- **Where:** every lesson screen (intro, steps, running, results) at 393 px; `screenshots/flow-2-ido-played-phone-light.png`, `silent-results-phone.png`
- **Requirement:** `UR-21` "nothing clipped or overlapping"
- **Problem:** The bordered "‹ Lessons" button's right edge runs into the "M" of "Major scale up", so the title looks glued to or under the button. Longer lesson titles will likely collide more.
- **Change needed:** Give the header a gap between the button and the title (or put the title on its own line below the button on narrow screens) so they never touch, and check the longest lesson title at 393 px.

### UI-S07-T1-02 — Missed-note tiles are saturated red

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Results, not passed; `screenshots/silent-results-phone.png`
- **Requirement:** epic section D: "Not yet… not red: it's encouragement"
- **Problem:** The verdict is calm, but a wall of bright red "miss" tiles undercuts that. Meaning is still carried by the ✗ and the word.
- **Change needed:** Optional: a softer miss colour.

### UI-S07-T1-03 — Pitch graph stays white in dark mode

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Running and results in dark mode; `screenshots/flow-5-running-phone-dark.png`, `flow-6-results-perfect-laptop-dark.png`
- **Requirement:** `UR-27`, epic section D (graph drawing is out of scope apart from colour tokens)
- **Problem:** A bright white graph and piano on a dark page glare, but they are legible.
- **Change needed:** Optional: take the surface and background from the dark tokens.

## Previous findings

None: turn 1.

## Not verified

- Real microphone, real piano sound and headphones (I used `sim=perfect` and `sim=silent`).
- Review-script step 5 (Today's practice, only "Next part" highlighted) was not walked through; the coder's e2e spec covers it.
- Tapping "Next lesson" to open the next lesson was not checked by me (the coder's e2e does).
- iPhone safari rendering and tap comfort.

## Proposed requirement changes

None.
