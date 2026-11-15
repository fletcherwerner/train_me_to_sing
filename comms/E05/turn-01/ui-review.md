# E05 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

I could only capture the idle `/dev/attempt` page. My Playwright script for the mid-run and results states needed an approval that this session could not give, so I did not see the live target and sung keys, the coloured strip chips or the result table. I cannot approve screens I have not seen. The idle page is clean at phone size: no horizontal scroll, and the range markers show on the piano (UR-05).

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| /dev/attempt idle, range 45–64 | OK (file captured; I did not open it) | OK | `screenshots/dev-attempt-laptop.png`, `screenshots/dev-attempt-phone.png` |
| Count-in, running, results (perfect / octaveDown / flat70) | Not seen | Not seen | none. The script is `ui-scripts/attempt.mjs`. |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes (idle) | — |
| UR-02 | Not verified | UI-E05-T1-01 |
| UR-03 | Not verified | UI-E05-T1-01 |
| UR-04 | Not verified | UI-E05-T1-01 |
| UR-05 | Yes: low and high markers are visible under the piano | — |
| UR-06 | Partial: there is no large note name or sung-note label on the page | UI-E05-T1-02 |
| UR-09 | Not verified; the beat dots are present | UI-E05-T1-01 |
| UR-10 | Not verified | UI-E05-T1-01 |
| UR-11 | Partial: the Stop button exists, but I did not see it while running | UI-E05-T1-01 |
| UR-12 | Not verified | UI-E05-T1-01 |
| UR-13 | Not verified; the result appears below the buttons, so it is likely off-screen on the phone | UI-E05-T1-03 |
| UR-21 | Partial: the idle page has no overflow; the six-column result table at 393 px is not seen | UI-E05-T1-01 |
| UR-23 | Partial: the buttons and selects are about 48 px high; the Home link is shorter | UI-E05-T1-03 |
| UR-24 | Not verified | UI-E05-T1-01 |

## Findings

### UI-E05-T1-01 — Running and result states not verified

- **Severity:** Blocking
- **Status:** Open
- **Where:** `/dev/attempt` during the count-in, while singing and after the run, at both sizes. No screenshot exists.
- **Requirement:** E05 "What you will review": the piano shows the target and your key during the run, and you get a result for every note afterwards. Also UR-02, UR-03, UR-04, UR-12 and UR-21.
- **Problem:** I could not confirm that the target key is blue, that the sung key is green or orange and visibly an octave away for `octaveDown`, that the strip chips are coloured, or that the six-column table fits at 393 px.
- **Change needed:** None to the code yet. On turn 2, the coder should state which states they checked visually. I will re-run `ui-scripts/attempt.mjs`, which needs approval to run. If the driver cannot approve it, the owner should look at these states directly.

### UI-E05-T1-02 — No large note name or sung-note label

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `/dev/attempt` idle at both sizes; `screenshots/dev-attempt-phone.png`
- **Requirement:** UR-06, UR-24
- **Problem:** The target and sung notes are shown only as key colours and in the strip. There is no large note name or text label for the sung note, and so far colour is the only cue. On this dev page the strip chips are small.
- **Change needed:** Show the current target name and the sung note name in large text near the piano. E06 may cover this; confirm it there.

### UI-E05-T1-03 — Results likely off-screen on the phone; small Home link

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `/dev/attempt` results at 393×852; the Home link at the top
- **Requirement:** UR-13, UR-23
- **Problem:** The score and Pass/Fail sit below the piano, meter, strip and buttons, so they probably need scrolling. The Home link is a plain underlined text link under 44 px high.
- **Change needed:** Put the score and Pass/Fail above the table, and scroll them into view when the run ends. Make the Home link at least 44 px high. This is a dev page, so the final session screen (E06) matters more.

## Previous findings

None; this is turn 1.

## Not verified

- All review-script steps that need a microphone or speakers (1–6, 8).
- The simulated runs (step 7): the mid-run and result states were not captured. See UI-E05-T1-01.
- Dark mode.

## Proposed requirement changes

None.
