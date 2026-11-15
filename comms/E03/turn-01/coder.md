# E03 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Continued from the earlier timed-out work on this branch. The wizard, storage and range analysis existed but had real bugs, which I fixed. The most serious: frames were collected during the countdown instead of the 3 s window. All four checks pass.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Wizard | `src/ui/screens/RangeSetup.tsx` | Rewritten as find / record / result / fail / confirm, shared by lowest and highest. Countdown (3-2-1 with scheduled clicks) and the 3 s window run on the audio clock. Only frames inside the window go to `findHeldNote`. The found note plays back. Keyboard shows C2–C6 while finding. The confirm keyboard is padded to whole octaves. The high-limit −/+ buttons were inverted and are fixed. Nudges play the note and enforce a minimum of 5 semitones. A warning shows below 7. |
| Store | `src/storage/store.ts` | `setRange` now reads current state. It used a stale snapshot before. |
| Routing | `src/app/routes.tsx` | The redirect to `/range` keeps the query string. |
| Sim | `src/audio/pitch/index.ts` | Added `sim=silent`. `sim=range:<low>,<high>` was already there. |
| Tests | `tests/e2e/range.spec.ts` | Redirect, full wizard, nudge, save, reload persistence, and silent retry message. |
| Notes | `docs/epic-notes/E03.md` | Updated. |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass (0 errors) |
| `npm test` | pass (34 of 34) |
| `npm run test:e2e` | pass (6 of 6) |
| `npm run build` | pass |

## Response to findings

Turn 1: no earlier findings.

## Not done

Nothing in scope is missing. I checked only the synthetic source. Real-microphone and iPhone behaviour is not checked.

## Assumptions and deviations

- The epic says "A2 – E4 (20 semitones)", but 64−45 = 19, so the test expects 19.
- After the highest result, "Use this" goes to confirm. The spec only names "Use this" and "Try again" for both notes.
- If the sung high note is under 5 semitones above the low one, the confirm step widens it to 5.

## How to see it

`npm run dev`, then open `/#/range?sim=range:45,64`. Or clear site data and open `/`, which redirects to `/range`.
