# E15 — Turn 3 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The laptop warm-up now fits in 800 px. I measured the page height at 800 px on laptop and 852 px on phone, so neither scrolls. Start glide, Stop and the Target/Sung line are visible together with the graph and piano.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Warm-up running | OK | OK (fits 852 px) | `screenshots/laptop-glide-run.png`, `screenshots/phone-glide-run.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-22 | Yes: no page scroll at either size | — |
| UR-11 | Yes: Stop is visible | — |
| UR-21 | Yes | — |

## Findings

### UI-E15-T3-01 — Glide lead-in audio not confirmed

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Warm-up, after tapping "Start glide"
- **Requirement:** `UR-09`
- **Problem:** The dots and count are shown. I could not check the clicks.
- **Change needed:** None on screen. The owner should check that the clicks are heard.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E15-T2-01 | Fixed | Page height equals the window height at both sizes; see `laptop-glide-run.png`. |
| UI-E15-T2-02 | Withdrawn | Replaced by UI-E15-T3-01 (same audio check for the owner). |

## Not verified

- Audio of the glides and the lead-in clicks.
- The real microphone and the iPhone itself.
- New-pattern, review and results states, export and import, dark mode.

## Proposed requirement changes

None
