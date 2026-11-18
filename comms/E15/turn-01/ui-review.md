# E15 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

Today's practice is usable at both sizes: Home has the card, the part header and "Stop for today" stay visible, nothing scrolls sideways, and the wrap-up is clear. The main problem is the warm-up glides. They show only a pitch graph, with no piano and no note name, which breaks the "piano on every training screen" requirement.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home with Today's practice card | OK (not captured separately) | OK | `screenshots/phone-home.png` |
| Warm-up: idle, running, between glides | Issue | Issue | `screenshots/laptop-practice-0.png`, `laptop-practice-4.png`, `phone-practice-0.png`, `phone-practice-2.png` |
| Pitch finding: running | OK | OK | `screenshots/phone-p-pitch-run1500.png`, `laptop-p-pitch-run1500.png` |
| "Good session" note (`?minutes=21`) | OK | OK | `screenshots/phone-p-20min.png` |
| Wrap-up (all parts skipped) | OK | OK | `screenshots/phone-p-next1.png`, `laptop-p-next1.png` |

I did not see the new-pattern, review, results and "Passed once" states in a screenshot. I also did not see the scooped-miss results.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Partial: Pitch finding has the piano; warm-up has none | UI-E15-T1-01 |
| UR-02 | Partial: warm-up has no piano | UI-E15-T1-01 |
| UR-05 | Yes: low and high markers show on the piano in Pitch finding | — |
| UR-06 | Partial: Pitch finding shows "Target: A3 · Sung: A3" in large type; warm-up shows no note name | UI-E15-T1-01 |
| UR-07 | Yes: the part title and a one-line instruction are shown | — |
| UR-08 | Yes: "Again" and "Next glide" appear after each glide | — |
| UR-09 | Not verified for glides | UI-E15-T1-02 |
| UR-11 | Yes: "Stop" and "Stop for today" are always visible | — |
| UR-21 | Yes: no horizontal scroll at either size | — |
| UR-22 | Yes: nothing in the run needs page scrolling | — |
| UR-23 | Yes: buttons look 44 px or taller (measured by eye) | — |
| UR-26 | Yes: "Back to Home" on the wrap-up, "Home" in a lesson | — |
| UR-18 | Not verified: no screenshot of Home after a pass | — |
| UR-12, UR-13, UR-14 | Not verified for scooped results | — |

## Findings

### UI-E15-T1-01 — Warm-up glides have no piano and no note name

- **Severity:** Blocking
- **Status:** Open
- **Where:** `/practice`, Warm-up, idle, running and between glides, at both sizes; `screenshots/phone-practice-2.png`, `screenshots/laptop-practice-4.png`
- **Requirement:** `UR-01` "The piano keyboard is the main visualization on every training screen", `UR-02` and `UR-06`
- **Problem:** Each glide shows only a sloped line on a small pitch graph. There is no keyboard, so the student cannot see the sung note against the target on a piano. There is no note name either. The graph's left-hand labels (A2, C3, A3, with C4 clipped at the top) are tiny.
- **Change needed:** Show the piano under the graph in the warm-up, with the range markers and the sung key live, as in Pitch finding. If the owner wants a glide to be only a graph, ask the owner to relax UR-01 for unscored glides.

### UI-E15-T1-02 — Warm-up glide start has no visible lead-in

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Warm-up, after tapping "Start glide"; `screenshots/phone-practice-2.png`
- **Requirement:** `UR-09`
- **Problem:** I could not see a 4-click lead-in counted on screen before the line starts moving. It may exist and I may have missed it.
- **Change needed:** Confirm that the lead-in is shown and heard before each glide. If it is not, add it, or ask the owner to exempt glides.

### UI-E15-T1-03 — "Good session" note shifts the layout and repeats on every screen

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** All parts and the wrap-up once 20 minutes have passed; `screenshots/phone-p-pitch-run1500.png`
- **Problem:** The boxed note appears in the sticky bar and pushes the content down. During a run the piano and the Stop button move. On the wrap-up it stays even though the session is over.
- **Change needed:** Show the note without moving the piano, for example by reserving its space or placing it below the controls. Drop it from the wrap-up.

## Previous findings

Turn 1: none.

## Not verified

- The audio of the glides: a sliding tone, the "ng" instruction and the lead-in clicks.
- The real microphone, and the iPhone itself.
- The new-pattern part at Learn and Prove, and a review in a new key.
- Home showing "Passed once — come back tomorrow in a new key", "Review due" and Passed after two days.
- A scooped miss and its tip in a Unit C Prove run.
- Export and import of proofs and reviews.
- Dark mode.

## Proposed requirement changes

None
