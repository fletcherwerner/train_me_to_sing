# S11 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The work meets the epic. The Stage 1 You do call, the We do gate, the two-pass Practise unlock, the guided Practise start, the faster guide text, the 3-frame display median and the laptop guide height are all present and match the spec. All four checks pass and match the coder report.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 637 of 637 pass | Yes |
| `npm run test:e2e` | 165 passed, 1 skipped | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| A. `playCall` in `playExercise` and the timeline: call, one beat of silence, then the count-in. `startSec` is still beat 0 | Yes | — |
| A. Frames during the call are dropped (`recordFrames` `notBeforeSec`), and sim singers start at beat 0 | Yes | — |
| A. Stage 1 You do uses the call at every level. "Listen…" then "Your turn". Other lessons keep `playStartNote` | Yes | — |
| A. `hear-again` is a plain button that plays the call only, never counts as an attempt, and disables Start while playing | Yes | — |
| B. We do gate (primary, `wedo-gate`), `NEXT` still works | Yes | — |
| B. `learnPasses`: two Learn passes in Stage 1, older entries keep their level, "1 of 2" text | Yes | — |
| B. Guided `BEGIN` and `ADVANCE` land on We do; the reducer stays pure (`guided` option) | Yes | — |
| C. Text hold of 35 ms, cents rounded to 5, separate hidden `aria-live` at most once a second | Yes | — |
| C. Dot easing of 30 ms; transform comes from the live value | Partial | PLAN-S11-T1-01 |
| C. `SMOOTH_WINDOW_DISPLAY = 3`, `midiFast` on the frame, scoring keeps 5 frames | Yes | — |
| C. Laptop guide at least 90 px, graph at least 100 px | Yes | — |
| D. `weDoMiss` and `step300` singers | Yes | — |
| Unit tests (session, progress, timeline, NoteGuide, smoothing) | Yes | — |
| Playwright tests, including response time, gate, unlock, height and Stage 2 | Yes | — |

## Findings

### PLAN-S11-T1-01 — Dot still goes through React render

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/components/NoteGuide.tsx` (the `note-guide__track` style)
- **Requirement:** `planning/epics/S11-solo-readiness.md`, section C: "Prefer setting the transform directly from the live value."
- **Problem:** The transform is still set through React props on each render. It follows the live value, and the e2e response-time test passes, so the requirement is met in effect.
- **Change needed:** None required. Optionally set the transform through a ref if lag shows up in practice.

## Previous findings

None (turn 1).

## Questions for the owner

None
