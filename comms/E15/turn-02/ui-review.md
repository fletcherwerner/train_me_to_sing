# E15 — Turn 2 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 1

## Summary

The turn-1 blocker is fixed: each warm-up glide now shows the piano with range markers, the live sung key and a "Target / Sung" line. The fix made the laptop warm-up page too tall (933 px against an 800 px window), so "Start glide" and "Stop" sit below the fold. The phone fits.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Warm-up idle | Issue (Start glide below fold) | OK | `screenshots/laptop-practice-0.png`, `screenshots/phone-practice-0.png` |
| Warm-up running | Issue (page scrolls, heading hidden) | OK | `screenshots/laptop-glide-run.png`, `screenshots/laptop-practice-6.png`, `screenshots/phone-practice-2.png` |
| Pitch finding running with "good session" note | OK | OK | `screenshots/phone-p-pitch-run1500.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01, UR-02 | Yes: warm-up now has the piano, target key and sung key | — |
| UR-05 | Yes: low/high markers shown | — |
| UR-06 | Yes: "Target: A2 · Sung: D3" in large type | — |
| UR-09 | Yes: four dots and a count ("2") show before the glide starts | — |
| UR-21 | Yes: no horizontal scroll at either size | — |
| UR-22 | No on laptop warm-up: the page is 933 px tall, so the start/stop control and the instructions cannot both be seen | UI-E15-T2-01 |
| UR-11 | Partial on laptop: Stop is below the fold | UI-E15-T2-01 |

## Findings

### UI-E15-T2-01 — Laptop warm-up needs page scrolling

- **Severity:** Blocking
- **Status:** Open
- **Where:** `/practice`, Warm-up, idle and running, laptop 1280×800; `screenshots/laptop-practice-0.png`, `screenshots/laptop-glide-run.png`
- **Requirement:** `UR-22` "During a run, everything needed (piano, target, sung note, progress, stop control) is visible without scrolling the page"
- **Problem:** The page is 933 px tall. "Start glide" is below the fold when idle. After starting, the page scrolls itself by 133 px and the glide title and instructions disappear off the top, with the sticky header covering the rest (`laptop-practice-6.png`). The piano is very tall on the laptop and takes most of the screen.
- **Change needed:** Make the warm-up fit in 800 px: cap the piano height, as the other training screens do, or trim the instruction text. Check that the Start and Stop buttons and the Target/Sung line are visible together with the graph and piano.

### UI-E15-T2-02 — Glide lead-in audio not confirmed

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Warm-up, after tapping "Start glide"
- **Requirement:** `UR-09`
- **Problem:** The four dots and a count are shown on screen. I could not check the clicks, so audio is left for the owner. This replaces turn-1 finding UI-E15-T1-02.
- **Change needed:** None on screen. The owner should check that the clicks are heard.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E15-T1-01 | Fixed | Piano, markers and Target/Sung line present; see `phone-practice-2.png`. |
| UI-E15-T1-02 | Withdrawn | Visual lead-in is present; audio unchecked. Replaced by UI-E15-T2-02. |
| UI-E15-T1-03 | Fixed | Note sits below the controls and no longer moves the piano (`phone-p-pitch-run1500.png`). I did not look at the wrap-up with the note. |

## Not verified

- Audio of the glides and the lead-in clicks.
- The real microphone and the iPhone itself.
- New-pattern, review and results states, "Passed once", "Review due", scooped misses.
- Export and import of proofs and reviews.
- Dark mode.
- The wrap-up without the "good session" note.

## Proposed requirement changes

None
