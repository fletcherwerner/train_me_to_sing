# S10 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

The note guide works and the owner can use it. The dot sits above or below the line, it turns green with "On it", and the wording is plain ("About 3 notes too high: come down"). It replaces the cents meter, and Prove shows nothing. One defect remains. On the phone, the octave-off dot sits at the bottom edge and is half cut off.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Sol–mi Learn, We do, on it (`perfect`) | OK | OK | `screenshots/live-perfect-laptop.png`, `live-perfect-phone.png` |
| Learn, near (`flat70`) | OK | OK | `live-flat70-laptop.png`, `live-flat70-phone.png` |
| Learn, far (`sharp300`), light and dark | OK | OK | `live-sharp300-laptop.png`, `live-sharp300-laptop-dark.png`, `live-sharp300-phone.png` |
| Learn, octave (`octaveDown`) | OK | Issue | `live-octaveDown-phone.png`, `live-octaveDown-laptop.png` |
| Learn, count-in and I do (line only) | OK | OK | `learn-ido-laptop.png`, `learn-ido-phone.png`, `learn-flat70-laptop.png` |
| Practise You do, rescue visible | OK | not captured | `practise-rescue-laptop.png` |
| Practise results ("guide helped") | OK | not captured | `practise-results-laptop.png` |
| Prove You do (no guide) | OK | not captured | `prove-laptop.png` |
| Find one note, "On it" with "Found it" | OK | not captured | `match-perfect-laptop.png`, `match-sharp300-laptop.png` |

No horizontal scroll was measured on any of the Learn screens at either size. The Stop button is visible without scrolling at 393×750.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-02, UR-03 | Yes | — The dot sits above or below the line, with a ▲/▼ marker, a text line and a colour change. |
| UR-04 | Yes | UI-S10-T1-01 covers the clipped dot on the phone. The text says "Right note, but an octave too low: try higher". |
| UR-07 | Yes | — |
| UR-10 | Yes | — |
| UR-11, UR-22 | Yes | — |
| UR-21 | Partial | UI-S10-T1-01 |
| UR-24 | Yes | — Green means on it, amber/brown means far or octave. Every state also has text and an arrow. |
| UR-27 | Yes | — Dark mode is legible. |
| UR-12 | Yes | — The results show hit or miss with a reason. See UI-S10-T1-03 about the wording. |

## Findings

### UI-S10-T1-01 — Octave dot clipped at the bottom of the guide on the phone

- **Severity:** Blocking
- **Status:** Open
- **Where:** Sol–mi Learn, We do, `sim=octaveDown`, 393 px. `screenshots/live-octaveDown-phone.png`
- **Requirement:** UR-21 "nothing clipped or overlapping"; epic section B (dot is drawn at the edge on the octave's side)
- **Problem:** The dot and its ▲ marker sit on the bottom border of the guide box, and the lower half of both is cut off. The same would happen for "octave too high" and for "far" cases beyond 700 cents.
- **Change needed:** Keep the dot and its marker fully inside the box at maximum offset. Add padding, or limit the edge position to the radius of the dot plus the marker.

### UI-S10-T1-02 — Guide is very short at 1280×800

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Learn, We do, laptop. `live-flat70-laptop.png`, `live-perfect-laptop.png`
- **Requirement:** Epic section B ("about 120 px tall") and the layout rule to shrink the graph first
- **Problem:** The guide box is only about 45–60 px tall, so the dot moves only a few pixels. A 70-cent miss and a 300-cent miss look much alike apart from the text. The coder explained this as a deliberate trade-off to keep the graph at 110 px or more.
- **Change needed:** If there is room, give the guide more height on the laptop, for example by reducing the instruction block. Otherwise the owner should accept this.

### UI-S10-T1-03 — Results still say "Flat by 70 cents"

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Practise results. `practise-results-laptop.png`
- **Requirement:** UR-12 "plain words (no music theory needed)"; the epic's wording rule is high/low, never sharp/flat
- **Problem:** The guide uses "high/low", but the results still say "Flat by 70 cents". The wording is inconsistent between the two screens (UR-24). This text was there before S10.
- **Change needed:** Optionally change the results reason to "A little low (70 cents)".

## Previous findings

Turn 1: none.

## Not verified

- Singing with a real microphone: the review script steps 1–3 and 7, and how readable the guide is at arm's length on an iPhone.
- The guide fading in and out during Practise, and the dot easing. I saw only still frames.
- Phone screenshots of Practise, Prove, Find one note and Today's practice (Pitch finding). Only the laptop was captured.
- Today's practice, Pitch finding, was not opened.
- The `prefers-reduced-motion` setting.

## Proposed requirement changes

None
