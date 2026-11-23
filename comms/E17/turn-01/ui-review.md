# E17 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 3

## Summary

The owner can use what this epic delivers. Home has the weekly ring and a Progress button. Progress shows the week, time, Today, patterns, improvements, trend and best runs in the specified order. Results show "Focus next" with a plain tip. Both sizes have no horizontal scrolling, and dark mode is legible. The remaining issues are small polish items.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home, empty and goal met | OK | OK (header buttons stack, see 03) | `screenshots/home-empty-*.png`, `home-goal-*.png`, `home-after-perfect-*.png` |
| Progress, empty | Issue (02) | Issue (02) | `screenshots/progress-empty-*.png` |
| Progress, 4 weeks of data (patterns, improvements, trend) | OK | OK | `screenshots/progress-four-*.png` |
| Progress, 4 weeks, dark | OK | OK | `screenshots/progress-four-dark-*.png` |
| Progress, goal met and streak | OK | OK | `screenshots/progress-goal-*.png` |
| Progress, 5 days (7-day window) | OK | OK | `screenshots/progress-five-*.png` |
| Progress after a real run (Today card, Best runs, "New this week") | OK | Issue (01) | `screenshots/progress-after-perfect-*.png` |
| Results with "Focus next", positive (perfect) and flat40 | OK | OK | `screenshots/results-perfect-*.png`, `results-flat40-*.png` |

The phone flat40 results did capture (`screenshots/results-flat40-phone-full.png`): "Landing flat" with the cents, the tip and the link, and no overflow. `fail-flat40-phone.png` is blank because my script's later navigation ran after I had stopped the server. It is not an app problem.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-14 | Yes. One concrete tip per area, with a suggested lesson link. | — |
| UR-12 | Yes. Per-note hit or miss tiles are still on results. | — |
| UR-13 | Yes. Score, pass mark and verdict are visible without scrolling at both sizes. | — |
| UR-18 | Yes. The weekly ring on Home and the week card on Progress show status. | — |
| UR-21 | Yes. No horizontal overflow at either size. | — |
| UR-23 | Yes. The Home ring and Progress button are at least 44 px tall. The day dots are about 36 px, but they aren't tappable. | — |
| UR-24 | Partial. Today is shown by an outline and active days by a filled dot plus a label. The "Goal met" text is present. | 01 |
| UR-25 | Yes. The "Sing on a few more days" and "Keep going" texts are plain. | — |
| UR-26 | Yes. "‹ Lessons" is on Progress. | — |
| UR-27 | Yes. Dark mode is legible. | — |

## Findings

### UI-E17-T1-01 — Repeated heading in the empty patterns card

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Progress, 1 active day, phone; `screenshots/progress-after-perfect-phone.png`
- **Requirement:** Epic section F (patterns card)
- **Problem:** The card shows the heading "Your patterns", then the same words again as a grey sub-line. The window label slot is filled with the title.
- **Change needed:** Leave the sub-line empty when no window applies.

### UI-E17-T1-02 — Empty-state card looks broken

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Progress, new student, both sizes; `screenshots/progress-empty-phone.png`, `progress-empty-laptop.png`
- **Requirement:** Epic section F (empty state)
- **Problem:** "Sing your first lesson to start your week." sits in a thin card with no padding or heading. It looks clipped next to the other cards.
- **Change needed:** Give it normal card padding.

### UI-E17-T1-03 — Home header buttons stack on the phone

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Home, phone; `screenshots/home-after-perfect-phone.png`
- **Requirement:** Epic section F ("Home's layout otherwise stays as it is"); UR-22 is not affected
- **Problem:** Settings, Mic check and Progress stack in a staggered column on the right. This pushes the content down by about 100 px.
- **Change needed:** Put them in one wrapped row below the title, or use a compact layout.

## Previous findings

Turn 1: none.

## Not verified

- A real microphone and speakers.
- Review-script steps 5 and 6 with real use over days. I covered them with seeded histories and `?today=`.
- Step 7 (export then import) and step 8 (`progress.json` on the iPhone).

## Proposed requirement changes

None.
