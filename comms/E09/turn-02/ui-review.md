# E09 — Turn 2 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

Both blocking problems from turn 1 are fixed. On a laptop at 1280×800 the Stop button is now fully visible during I do, We do and You do. The results screen shows all 42 note chips with their hit/miss labels, and the tip sits directly under the score. Two small non-blocking items remain.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Twinkle I do playing | OK | OK | `screenshots/laptop-s3-04-ido-playing.png`, `screenshots/phone-s3-04-ido-playing.png` |
| We do, Line 2 | OK | OK | `screenshots/laptop-s3-04-wedo-line2.png`, `screenshots/phone-s3-04-wedo-line2.png` |
| You do running | OK (page 16 px taller than window) | OK (page 18 px taller than window) | `screenshots/laptop-s3-04-youdo-running.png`, `screenshots/phone-s3-04-youdo-running.png` |
| Results with misses (sim flat40) | OK | OK | `screenshots/laptop-results-flat40.png`, `screenshots/phone-results-flat40.png` |

Scripts: `ui-scripts/flow.mjs`, `ui-scripts/miss.mjs`.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-06 | Yes | — |
| UR-10 | Yes | — |
| UR-11 | Yes | — |
| UR-12 | Yes | — |
| UR-13 | Yes | — |
| UR-14 | Yes | — |
| UR-21 | Yes | UI-E09-T2-02 |
| UR-22 | Yes | UI-E09-T2-01 |
| UR-24 | Yes | — |

## Findings

### UI-E09-T2-01 — You do running: page is slightly taller than the window

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** You do running, laptop (page height 816 against 800) and iPhone (870 against 852); `screenshots/laptop-s3-04-youdo-running.png`, `screenshots/phone-s3-04-youdo-running.png`
- **Requirement:** UR-22
- **Problem:** The piano, target, progress strip and Stop button are all visible, but the page can still scroll by about 16 to 18 px.
- **Change needed:** Trim about 20 px of bottom padding or margin so the page does not scroll during a run.

### UI-E09-T2-02 — Small chips cut off the note names

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Live strip while running, both sizes; `screenshots/laptop-s3-04-youdo-running.png`
- **Requirement:** UR-21 "nothing clipped"
- **Problem:** On the narrow chips, "F#3" and syllables such as "Twin", "wha" and "worl" are cut off at the edge.
- **Change needed:** Reduce the font size on narrow chips or let the chip width fit its content.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E09-T1-01 | Fixed | Stop is at y 736 to 784 on laptop in You do, and at y 681 to 729 in I do. |
| UI-E09-T1-02 | Fixed | All 42 chips show with the hit/miss label on both sizes. |
| UI-E09-T1-03 | Fixed | Layout shift is much reduced. A small difference between steps remains, but it does not block. |
| UI-E09-T1-04 | Fixed | The current syllable is now about twice the neighbours' size and centred. |
| UI-E09-T1-05 | Fixed | The tip sits under the score. The lists are left-aligned and the per-note list is in two columns on laptop. |

## Not verified

- Listening to the melodies and the audible 4-click lead-in.
- Lyrics advancing in time with sound.
- The real iPhone fit, only approximated at 393×852 in Chromium.
- Real microphone singing. Only the simulated singer was used.

## Proposed requirement changes

None.
