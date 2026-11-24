# S10 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The note guide maths, component, Practise rescue, placement in `Lesson.tsx` and `MatchRun.tsx`, `guideHelped` logging and the new simulated singers are all present and match the epic. Lint, unit tests, build and the full e2e suite pass when I run them. Two small test gaps remain and are non-blocking.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 615 of 615 pass | Yes |
| `npm run test:e2e` | 146 of 146 pass (16.6 min) | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| A. `guideState`, offset, text, hysteresis, octave, near and far wording | Yes | — |
| B. Component, testids, aria, silence 250 ms, text at most once a second | Yes | — |
| C. Learn, Practise rescue, Prove none, results line, `guideHelped` | Yes | — |
| C. MatchRun placement with S09 status | Yes | — |
| C. Layout at 393 px | Yes (guide height is clamped, and the e2e checks the Stop button is in view) | — |
| D. `sharp300`, `findLate` | Yes (`findLate` is not exercised by any test) | PLAN-S10-T1-01 |
| Unit tests listed | Yes | — |
| Component tests listed | Yes | — |
| Playwright at 1280 and 393 | Yes. The spec uses `flat70` where the epic says `flat40`; that is justified, because 40 cents is inside the 50-cent tolerance and counts as "on". | — |
| Rescue "goes away at the next note" | Implemented (the hook resets per note) but not asserted | PLAN-S10-T1-02 |
| `cents-meter` removed from lessons, other specs updated | Yes | — |

## Findings

### PLAN-S10-T1-01 — `findLate` has no test

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/audio/pitch/simSinger.ts`
- **Requirement:** `planning/epics/S10-note-guide.md`, section D: "`findLate`: it starts 2 semitones low and glides to the target over 1.5 s."
- **Problem:** The singer exists but no unit or e2e test uses it, so its shape is unverified.
- **Change needed:** Add a small unit test of its output, or use it in a "near" e2e check.

### PLAN-S10-T1-02 — Rescue hides at the next note is untested

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `tests/e2e/noteGuide.spec.ts:96`
- **Requirement:** `planning/epics/S10-note-guide.md`, section C: "it stays for the rest of that note, then hides again at the next note."
- **Problem:** The behaviour is in `useGuideRescue.ts`, but there is no test that covers it.
- **Change needed:** Add a hook unit test for the reset on `noteIndex` change.

## Previous findings

None (turn 1).

## Questions for the owner

None
