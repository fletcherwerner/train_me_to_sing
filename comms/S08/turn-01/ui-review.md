# S08 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The owner can use what this epic delivers. The best-accuracy line, the results accuracy line with "New best!" or "Best: n%", the per-note accuracy and the Home status all appear and read clearly at both sizes. The one weak spot is that the best-accuracy line is very small and tucked under the title on step screens.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Lesson intro, no best | OK | OK | `screenshots/laptop-intro-nobest.png`, `screenshots/phone-intro-nobest.png` |
| Lesson intro, with best | OK | OK | `screenshots/laptop-intro-best.png`, `screenshots/phone-intro-best.png` |
| Results, first attempt (new best) | OK | OK | `screenshots/laptop-results-perfect.png`, `screenshots/phone-results-perfect.png` |
| Results, lower accuracy (Best: n%) | OK | OK | `screenshots/laptop-results-flat40.png`, `screenshots/phone-results-flat40.png` |
| Match lesson results | OK | OK | `screenshots/laptop-match-results.png`, `screenshots/phone-match-results.png` |
| Home statuses (seeded) | OK | OK | `screenshots/phone-home-status.png` (text: "✓ Passed · 91%", "◐ Learn · Best 74%", "◐ Learn · Started") |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-12 | Yes: every note shows "✓ hit · n%" and match targets list it too | — |
| UR-13 | Yes: score, pass mark and verdict are visible without scrolling | — |
| UR-18 | Yes: status shows Passed · 91% or Best 74% | — |
| UR-21 | Yes: no horizontal scroll or clipping at either size | — |
| UR-22 | Not affected: the best line sits in the header and does not push the run screen | — |
| UR-24 | Yes: "New best!" has a ✓ and is not colour alone | UI-S08-T1-01 |
| UR-27 | Not checked in dark mode | — |

## Findings

### UI-S08-T1-01 — Best-accuracy line is tiny and crowds the title

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** lesson header on step and results screens, iPhone and laptop; `screenshots/phone-results-perfect.png`
- **Requirement:** UR-21 (nothing crowded or overlapping). Taste only; not enforced as blocking.
- **Problem:** "Best accuracy: 99%" is roughly 11 px and sits almost touching the title. It is hard to read at arm's length.
- **Change needed:** Give it a larger font, or put it on its own line when there is room.

## Previous findings

None (turn 1).

## Not verified

- Dark mode was not captured.
- Review-script step 5 (export and import on another browser) was not run.
- Real singing was not tested. I used the simulated singer, so "perfect" gave 99–100%, as the coder noted.
- Today's practice was not captured.

## Proposed requirement changes

None.
