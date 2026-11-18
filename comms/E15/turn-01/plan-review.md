# E15 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

E15 meets the epic. Storage v2 with migration, the mastery rule, the review schedule, the practice plan and screen, glides and scoop detection are all present and covered by tests. The four checks pass as the coder reported. Two small gaps are non-blocking.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 440 of 440 pass | Yes |
| `npm run test:e2e` | 80 of 80 pass | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| A. Storage v2 and migration (load, import, profile) | Yes | — |
| B. Mastery rule, single-key exception, avoid proof tonics | Yes | — |
| C. Review schedule 1/3/7/14, fail resets, dueReviews | Yes | — |
| D. planToday, Practice screen, Stop, 20-minute note, Home card | Yes | — |
| E. Glides (sloped line, sliding tone, never scored) | Yes | — |
| F. Scoop detection, tip vs miss by unit and level | Partial | PLAN-E15-T1-01 |
| Tests: unit and migration | Yes | — |
| Tests: Playwright (two days, scoop, warm-up, no scroll, Stop) | Yes | PLAN-E15-T1-02 |

## Findings

### PLAN-E15-T1-01 — Scoop tip not applied in Unit A

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/core/scoring/evaluate.ts:100`
- **Requirement:** E15 spec F, "In Units A–B: a tip only (the note still counts)."
- **Problem:** The coder report says Unit A match lessons have their own scoring and get no scoop tip.
- **Change needed:** Add the tip to Unit A match lessons, or ask the owner to confirm that skipping them is acceptable.

### PLAN-E15-T1-02 — Today's practice e2e does not cover a review part

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `tests/e2e/practice.spec.ts:114`
- **Requirement:** E15 Tests, "Today's practice runs every part with sim=perfect".
- **Problem:** The run covers warm-up, pitch finding, new pattern and wrap-up. The review part is only covered by a separate seeded lesson test.
- **Change needed:** Seed a due review in the practice run and assert the review part runs.

## Previous findings

Turn 1: none.

## Questions for the owner

None
