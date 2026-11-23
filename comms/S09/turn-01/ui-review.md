# S09 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The owner can use this. A Unit A target now runs for its full 8 s with a countdown bar, shows "✓ Found it — keep holding" without ending, then writes a per-note line. The results list shows the same lines, "matched X of N", the pass mark and accuracy. Nothing scrolls sideways, and everything fits on screen at both sizes. Two readability and consistency points are non-blocking.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Find one note (s1a-02), intro | OK | OK | `screenshots/perfect-laptop-intro.png`, `screenshots/perfect-phone-intro.png` |
| Singing, matched early, countdown bar | OK | OK | `screenshots/perfect-laptop-singing.png`, `screenshots/perfect-phone-singing.png` |
| After a note, line under "Listen…" | OK | OK | `screenshots/perfect-laptop-afternote.png`, `screenshots/perfect-phone-afternote.png` |
| Results, sim=perfect | OK | OK | `screenshots/perfect-laptop-results.png`, `screenshots/perfect-phone-results.png` |
| Results, sim=flat40 | Issue (UI-S09-T1-01) | Issue (UI-S09-T1-01) | `screenshots/flat40-laptop-results.png`, `screenshots/flat40-phone-results.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-02 | Yes: target and sung key are both shown, in different colours | — |
| UR-03 | Yes: the green key means a match, and the flat/sharp cents are in the line | — |
| UR-06 | Yes: "Target: B2 · Sung: B2" is large | — |
| UR-07 | Yes: "Now sing it and hold the note." | — |
| UR-10 | Yes: "Note 1 of 6" plus the countdown bar | — |
| UR-11 | Yes: Stop is visible throughout | — |
| UR-12 | Yes: per-note ✓/✗ lines with a plain-words reason | UI-S09-T1-02 |
| UR-13 | Yes: score, pass mark and verdict are visible without scrolling | UI-S09-T1-01 |
| UR-21 | Yes: no horizontal overflow at either size | — |
| UR-22 | Yes: page height equals viewport height; nothing needs scrolling | — |
| UR-24 | Yes: the match is marked by a ✓ and text as well as green | — |

## Findings

### UI-S09-T1-01 — "On the note 100%" next to "accuracy 67%" looks contradictory

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Results, sim=flat40, both sizes; `screenshots/flat40-laptop-results.png`
- **Requirement:** UR-12 and UR-24 (same wording for the same meaning)
- **Problem:** One line says "on the note 100% after that · flat (−40 cents)" and ends "accuracy 67%". The two measures use different rules, and nothing explains why.
- **Change needed:** Either use one measure per line, or label the accuracy with how it differs, for example "accuracy (right on the note) 67%".

### UI-S09-T1-02 — Results list is a dense block of text

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Results, iPhone; `screenshots/perfect-phone-results.png`
- **Requirement:** UR-12 (readable at a glance)
- **Problem:** Each line wraps to 2–3 rows with no spacing between notes, so it is hard to tell where one note ends and the next begins.
- **Change needed:** Add a gap between entries, or put the note name and ✓ on their own line.

## Previous findings

Turn 1: none.

## Not verified

- Real microphone singing: the feel of staying on the note, and the cents text on real singing (steps 1–3 of the Review script).
- The countdown against real audio, and the piano playback.
- A real iPhone.
- Today's practice Pitch finding was not captured. It uses the same MatchRun component.
- Dark mode was not captured.

## Proposed requirement changes

None.
