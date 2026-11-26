# S11 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The owner can use what S11 delivers. In Sol–mi You do, the "Listen…" call plays first with the G#3 key lit, then the count-in. "Hear it again" sits next to Start, and the We do gate line and the results line "Passed at Learn: 1 of 2" show correctly at both sizes. One non-blocking issue: on the laptop, the buttons after a We do result sit below the fold.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| We do result after a miss (`sim=weDoMiss`), gate line | Issue (buttons below the fold) | OK | `screenshots/laptop-weDoMiss-01-wedo-result.png`, `screenshots/phone-weDoMiss-01-wedo-result.png` |
| You do idle, with "Hear it again" | OK | OK | `screenshots/laptop-perfect-02-youdo-idle.png`, `screenshots/phone-perfect-02-youdo-idle.png` |
| You do during the call ("Listen…") | OK | OK | `screenshots/laptop-perfect-03-call.png`, `screenshots/phone-perfect-03-call.png` |
| Results after the first Learn pass | OK | OK | `screenshots/laptop-perfect-05-results.png`, `screenshots/phone-perfect-05-results.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-02 | Yes (the call lights the target key; the sung key is empty during the call) | — |
| UR-07 | Yes ("Listen…" during the call, a one-line instruction, step tabs with ticks) | — |
| UR-08 | Partial (retry is one tap, but on the laptop the button needs a scroll after We do) | UI-S11-T1-01 |
| UR-10 | Yes (note chips and dots) | — |
| UR-11 | Yes (Stop is visible during the call) | — |
| UR-12–UR-14 | Yes (results show the score, the pass mark and "Passed", the tip, and the new "1 of 2" line) | — |
| UR-21 | Yes at both sizes; no horizontal scroll, nothing clipped | — |
| UR-22 | Yes during the run, on both sizes | — |
| UR-23 | Yes (buttons look 44 px or taller on the phone) | — |
| UR-24 | Yes (the green hit and red miss chips carry ✓ and ✗ labels) | — |

## Findings

### UI-S11-T1-01 — Laptop: gated primary button is below the fold after We do

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** We do, after a run, at 1280×800; `screenshots/laptop-weDoMiss-01-wedo-result.png`
- **Requirement:** UR-08, "'We do' … can be retried with one tap". The epic also says "Sing along again" is the primary after a miss.
- **Problem:** The gate line is visible, but "Sing along again" and "Next: You do" are below the visible area at 800 px. The live graph is shown twice (live and result), which pushes them down. The phone shows them all.
- **Change needed:** On the laptop, drop the duplicate result graph, or move the buttons above it, so the primary is visible without scrolling.

## Previous findings

Turn 1: none.

## Not verified

- Sound: the piano actually playing sol then mi, the 1-beat silence, and the audible count-in.
- Sliding your voice: the dot following with no lag, and "go up / come down" flipping with no pause.
- Seeing a small miss and a big miss at different heights in the laptop guide. The guide is at least 90 px tall on the laptop, but I did not drive it with a real voice.
- "Hear it again" replaying without starting a run. I saw the button but did not press it.
- The second Learn pass showing "Practise is unlocked", and a Practise visit starting at We do. I did not run these.
- Dark mode and the iPhone device itself.
- My script's "Your turn" capture matched the heading text, so I have no clean screenshot of the "Your turn" status.

## Proposed requirement changes

None.
