# E09 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 2 · **Non-blocking open:** 3

## Summary

Stage 3 appears on the home screen with five songs, lyrics show on the chips and in a "now singing" line, the phrase selector works, and on the phone a whole song fits without page scrolling. The problems are on a laptop: during a long song the Stop button is pushed below the fold. In results, the note chips are clipped and only 15 of 42 are visible.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home, Stage 3 list | OK | OK | `screenshots/laptop-home.png`, `screenshots/phone-home.png` |
| Twinkle I do playing | Issue | OK | `screenshots/laptop-s3-04-ido-playing.png`, `screenshots/phone-s3-04-ido-playing.png` |
| We do, Line 2 selected / finished | OK | OK | `screenshots/laptop-s3-04-wedo-line2.png`, `screenshots/laptop-s3-04-wedo-done.png`, `screenshots/phone-s3-04-wedo-line2.png` |
| You do running | Issue | OK | `screenshots/laptop-s3-04-youdo-running.png`, `screenshots/phone-s3-04-youdo-running.png` |
| Results passed | OK | Issue | `screenshots/phone-s3-04-youdo-late.png` |
| Results with misses (sim flat40) | Issue | Issue | `screenshots/laptop-results-flat40.png`, `screenshots/phone-results-flat40.png` |

Scripts: `ui-scripts/flow.mjs`, `ui-scripts/miss.mjs`.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes | — |
| UR-02 | Yes | — |
| UR-03 | Yes | — |
| UR-05 | Yes | — |
| UR-06 | Partial | UI-E09-T1-04 |
| UR-10 | Yes | — |
| UR-11 | Partial | UI-E09-T1-01 |
| UR-12 | Yes | UI-E09-T1-02 |
| UR-13 | Yes | — |
| UR-14 | Partial | UI-E09-T1-05 |
| UR-18 | Yes | — |
| UR-21 | No | UI-E09-T1-01 |
| UR-22 | No | UI-E09-T1-01 |
| UR-23 | Yes | — |
| UR-24 | Partial | UI-E09-T1-02 |

## Findings

### UI-E09-T1-01 — Stop button pushed below the fold on laptop during long songs

- **Severity:** Blocking
- **Status:** Open
- **Where:** Twinkle, I do and You do running, laptop 1280×800 (page height 836 to 847 px); `screenshots/laptop-s3-04-ido-playing.png`, `screenshots/laptop-s3-04-youdo-running.png`
- **Requirement:** UR-22 "everything needed (piano, target, sung note, progress, stop control) is visible without scrolling the page"; UR-11
- **Problem:** The Stop button sits at about y=767 to 815, so its lower part is cut off by an 800 px window. A page scroll is needed.
- **Change needed:** Fit the lesson screen in 800 px at laptop size with a three-row strip. For example, tighten vertical spacing, or on laptop put the strip beside the piano. Check I do, We do and You do.

### UI-E09-T1-02 — Results note chips are clipped and hide most of the song

- **Severity:** Blocking
- **Status:** Open
- **Where:** Results, laptop and phone, 42-note song; `screenshots/phone-results-flat40.png`, `screenshots/laptop-results-flat40.png`, `screenshots/phone-s3-04-youdo-late.png`
- **Requirement:** UR-21 "nothing clipped"; UR-24 meaning needs a label; UR-12
- **Problem:** Each chip is 52 px tall but needs 57 px, so the bottom "hit" / "miss" label is cut off. The strip is capped at 3 rows, so only 15 (phone) or 33 (laptop) of 42 notes show. The rest are reachable only by scrolling inside the strip, which is easy to miss.
- **Change needed:** Make chips tall enough for the label. In the results view, let the strip show every note (the three-row cap belongs to the live run), or show a clear "scroll for more" cue.

### UI-E09-T1-03 — Layout shifts between I do, We do and You do on laptop

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Twinkle I do, then We do, laptop; `screenshots/laptop-s3-04-ido-playing.png`, `screenshots/laptop-s3-04-wedo-line2.png`
- **Requirement:** UR-24 (consistent positions)
- **Problem:** The lyric line and keyboard sit at different heights in I do, We do and You do. The current syllable jumps about 50 px between steps.
- **Change needed:** Reserve the same space for the selector row in every step, or hide it consistently.

### UI-E09-T1-04 — "Now singing" syllable is small

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** You do running, phone; `screenshots/phone-s3-04-youdo-running.png`
- **Requirement:** UR-06 "large enough to read at arm's length on the phone"
- **Problem:** The bold current syllable is only slightly bigger than its neighbours (about 24 px). Single letters such as "I" look like a thin bar. When idle, the line shows "how  I" off-centre.
- **Change needed:** Make the current syllable about twice the size of the neighbours and centre the line.

### UI-E09-T1-05 — Results: miss list is unstyled and pushes the tip off screen

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Results with misses, both sizes; `screenshots/phone-results-flat40.png`
- **Requirement:** UR-14 (one concrete tip), UR-13 (readability)
- **Problem:** The "Line n: k missed" summary and 42 per-note lines are plain centred bullets. The tip is at the very bottom, after about 1,000 px of list.
- **Change needed:** Put the tip directly under the score and the line summary. Collapse or two-column the per-note list, and left-align it.

## Previous findings

Turn 1: no earlier findings.

## Not verified

- Listening to the melodies (review script steps 2 and 3), so wrong notes remain unchecked.
- Lyrics advancing in time with sound, and the audible 4-click lead-in at tempo.
- The real iPhone fit, only approximated at 393×852 in Chromium.
- Real microphone singing. Only the simulated singer was used.

## Proposed requirement changes

None.
