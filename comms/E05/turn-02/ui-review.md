# E05 — Turn 2 — UI Review

**Verdict:** BLOCKED - NEEDS OWNER

**Blocking open:** 2 · **Non-blocking open:** 0

## Summary

I saw the idle `/dev/attempt` page at both sizes. It now shows a large "Target: — · Sung: —" line, and it fits at 393 px with no overflow. I again could not see the count-in, running or result states. This session cannot approve the Playwright script (`ui-scripts/attempt.mjs`), the same limit as turn 1. The coder disputed UI-E05-T1-01 because they also only checked those states through e2e assertions. The finding has now been open for two turns and I cannot clear it, so the owner needs to look. The two blocking counts are the same gap: UI-E05-T1-01 and its carry-over UI-E05-T2-01.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| /dev/attempt idle, range 45–64 | OK (file captured; I did not open it) | OK | `screenshots/dev-attempt-laptop.png`, `screenshots/dev-attempt-phone.png` |
| Count-in, running, results (perfect / octaveDown / flat70) | Not seen | Not seen | none |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes (idle) | — |
| UR-02 | Not verified | UI-E05-T2-01 |
| UR-03 | Not verified | UI-E05-T2-01 |
| UR-04 | Not verified | UI-E05-T2-01 |
| UR-05 | Yes: the low and high markers show under the piano | — |
| UR-06 | Improved: the large Target/Sung label is present; I did not see it filled in | UI-E05-T2-01 |
| UR-12 | Not verified | UI-E05-T2-01 |
| UR-13 | Not verified; the coder added scroll-into-view | UI-E05-T2-01 |
| UR-21 | Idle: yes. Result table: not seen | UI-E05-T2-01 |
| UR-23 | Partial: the Home link looks about 48 px high in the screenshot, as the coder says | — |
| UR-24 | Not verified | UI-E05-T2-01 |

## Findings

### UI-E05-T2-01 — Running and result states still not visually verified

- **Severity:** Blocking
- **Status:** Open
- **Where:** `/dev/attempt` during the count-in, while singing and after the run, at both sizes. No screenshot exists.
- **Requirement:** E05 "What you will review", and UR-02, UR-03, UR-04, UR-12 and UR-21.
- **Problem:** No agent has seen these states. I could not run `ui-scripts/attempt.mjs`, and the coder did not check them visually.
- **Change needed:** The owner opens `/?sim=octaveDown#/dev/attempt` and `/?sim=perfect#/dev/attempt`, or approves running `node comms/E05/turn-02/ui-scripts/attempt.mjs` for me. Things to check:
  - the target key is blue, and the sung key is a different colour and an octave away for `octaveDown`;
  - the strip chips are coloured and also labelled;
  - the result table fits at 393 px;
  - the score and Pass/Fail are visible.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E05-T1-01 | Open (carried as UI-E05-T2-01) | Disputed by the coder and kept open for a second turn, so it needs the owner. |
| UI-E05-T1-02 | Fixed | The large Target/Sung label is visible in `screenshots/dev-attempt-phone.png`. |
| UI-E05-T1-03 | Fixed (not verified) | The Home link is about 48 px high in the screenshot. Scroll-into-view of the result is in the code, but I did not see it run. |

## Not verified

- Review-script steps 1–6 and 8, which need a microphone or speakers.
- The count-in, running and result states for all sims (step 7).
- Dark mode.

## Proposed requirement changes

None.
