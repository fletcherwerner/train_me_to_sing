# S10 — Turn 2 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The clipped octave dot is fixed. At 393 px the dot and its ▲ marker now sit fully inside the guide box, and the text reads "Right note, but an octave too low: try higher". The Practise results now say "A little low (70 cents)", matching the guide's wording. The only open item is the short guide on the laptop, which the coder deferred for the owner to decide.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Learn, We do, octave (`octaveDown`) | OK | OK | `screenshots/state-octaveDown-phone.png`, `learn-octaveDown-laptop.png` |
| Learn, We do, far (`sharp300`) | OK | OK | `screenshots/state-sharp300-phone.png`, `learn-sharp300-laptop.png` |
| Learn, on it and near | OK | OK | `learn-perfect-*.png`, `learn-flat70-*.png` |
| Practise results | OK | OK | `practise-results-laptop.png`, `practise-results-phone.png` |
| Practise rescue, Prove, Find one note | OK | OK | `practise-rescue-*.png`, `prove-*.png`, `match-*-*.png` |

No horizontal scroll was measured at either size. The Stop button is visible at 393×750.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-02, UR-03, UR-04 | Yes | — |
| UR-12 | Yes | — The reason is now in plain high/low words. |
| UR-21 | Yes | UI-S10-T1-01 is fixed. |
| UR-22 | Yes | — |
| UR-24 | Yes | — The guide and results now use the same wording. |

## Findings

### UI-S10-T2-01 — Guide is short on the laptop (carried over)

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Learn, We do, laptop. `screenshots/learn-flat70-laptop.png`
- **Requirement:** Epic section B ("about 120 px tall")
- **Problem:** The guide box is about 45–60 px tall, so the dot moves only a few pixels. The coder kept this on purpose to protect the graph height.
- **Change needed:** The owner should accept this or ask for a taller guide.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-S10-T1-01 | Fixed | The dot and marker are fully inside the box at maximum offset (`state-octaveDown-phone.png`). |
| UI-S10-T1-02 | Withdrawn | Deferred by the coder. Restated as UI-S10-T2-01. |
| UI-S10-T1-03 | Fixed | The results show "A little low (70 cents)" (`practise-results-phone.png`). |

## Not verified

- Singing with a real microphone: review script steps 1–3 and 7, and readability at arm's length on an iPhone.
- The Practise fade-in and the dot easing (still frames only).
- Today's practice, Pitch finding, was not opened.
- `prefers-reduced-motion`.

## Proposed requirement changes

None
