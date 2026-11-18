# E14 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 3

## Summary

The new Stage 1 is usable at both sizes: Home groups lessons by unit with levels, the match lesson and the Learn, Practise and Prove screens all fit without scrolling or sideways overflow. The main problem is that the Prove run tells the student to "follow the lit key" when no key is lit.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home (units, levels, notice) | OK | OK | `screenshots/home-laptop.png`, `home-phone.png`, `home-phone-dark.png` |
| Match intro / run / results (s1a-02) | OK | Issue | `match-intro-*.png`, `match-run-*.png`, `match-results-*.png` |
| Match, silent results (s1a-03) | OK | OK | `match3-silent-results-*.png` |
| Learn I do / We do / You do / results | OK | OK | `b04-ido-*`, `b04-wedo-*`, `b04-youdo-learn-*`, `b04-learn-results-*` |
| Practise start / run / results | OK | OK | `b04-practise-*` |
| Prove start / run / results | Issue | Issue | `b04-prove-start-*`, `b04-prove-run-*`, `b04-prove-results-*` |

I checked sideways scroll with a script for Home, match run, match results, Learn results, Practise run and Prove run at both sizes. None scrolled.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes | — |
| UR-02 | Yes (match and Learn) | — |
| UR-03 | Partial | UI-E14-T1-03 |
| UR-05 | Yes (low/high markers shown) | — |
| UR-06 | Yes | — |
| UR-07 | Partial | UI-E14-T1-01 |
| UR-08 | Yes | — |
| UR-09 | Yes (count-in is shown) | — |
| UR-10 | Yes | — |
| UR-11 | Yes (Stop visible in every run) | — |
| UR-12 | Yes | — |
| UR-13 | Yes | — |
| UR-14 | Partial | UI-E14-T1-03 |
| UR-18 | Yes | — |
| UR-21 | Yes | UI-E14-T1-02 (phone header) |
| UR-22 | Yes | — |
| UR-24 | Yes | — |
| UR-26 | Yes | — |
| UR-27 | Partial | Only Home and match intro checked in dark mode |

## Findings

### UI-E14-T1-01 — Prove run says "follow the lit key" when nothing is lit

- **Severity:** Blocking
- **Status:** Open
- **Where:** Prove, You do, during the run, phone; `screenshots/b04-prove-run-phone.png` and `b04-prove-start-phone.png`
- **Requirement:** UR-07 "in one short line, what the student should do right now"
- **Problem:** The line "Your turn. The piano is silent; follow the lit key." stays in Prove. Before the count-in only the starting note is lit. During the run no key is lit, as the epic requires. The instruction is then wrong, and a beginner will look for a key that is not there. The same text appears in Practise, where it is mostly right.
- **Change needed:** In Prove, use a line that matches the screen. Before the count-in: "Your turn. Start on the lit note, then sing from memory." During the run: "Sing it from memory."

### UI-E14-T1-02 — Phone header: Home button touches the lesson title on match screens

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Match run and match results, phone; `screenshots/match-run-phone.png`, `match-results-phone.png`
- **Requirement:** UR-21 "nothing ... overlapping"
- **Problem:** "Low, middle and high" starts against the Home button's right edge. On `match3-silent-results-phone.png` the shorter title leaves a gap.
- **Change needed:** Wrap the title below the Home button, or add a gap, when the title is long.

### UI-E14-T1-03 — Match results are plain and the pass tip is generic

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Match results, phone; `screenshots/match-results-phone.png`
- **Requirement:** UR-12, UR-14
- **Problem:** The per-note results are plain unstyled lines. Lesson results use green "hit" tiles, so the two result screens look different. After a perfect run the tip reads "Try again with a slightly different note", which is not a concrete tip. In an earlier check "matched in 0.0 s" with the simulated singer was believable, but a real run may look odd.
- **Change needed:** Show match results as hit and missed tiles in the same style and colours as lesson results, each with a plain-word reason. Give a tip specific to the result.

### UI-E14-T1-04 — Dark mode not checked on running states

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `screenshots/home-phone-dark.png` and `match-intro-phone-dark.png` only
- **Requirement:** UR-27
- **Problem:** I did not review the dark runs and results screens.
- **Change needed:** None required now. I will check them next turn if time allows.

## Previous findings

None (turn 1).

## Not verified

- Echo yourself with a real recording and playback (steps 7 of the review script). Only the button's presence was seen, after the Learn and Prove runs.
- Hearing the 1.5 s target tone and the count-in clicks.
- Sliding in on purpose and the "you slid" message on s1a-03 (needs a real voice).
- Whether the starting note changes between Practise and Prove attempts (needs `&key=random`; not captured).
- Stage 2 and 3 lessons and imported songs.
- Everything on a real iPhone.

## Proposed requirement changes

None.
