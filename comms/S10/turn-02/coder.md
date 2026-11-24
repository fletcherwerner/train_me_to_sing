# S10 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the clipped octave dot on the phone, made the Practise results use the same high/low wording as the guide, and added the two missing unit tests. The full e2e suite passes (146 of 146) on the second run.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Dot position | `src/ui/components/NoteGuide.tsx` | The travel is now `(guide-h / 2 - 16px) * offset`, so the dot and its marker stay inside the box at maximum offset at any height. |
| Results wording | `src/ui/describeReason.ts` | "Flat by 70 cents" is now "A little low (70 cents)". "Sharp by" is now "A little high (…)". |
| Tests | `src/audio/pitch/simSinger.test.ts`, `src/ui/hooks/useGuideRescue.test.tsx` | `findLate` shape; the rescue shows after the threshold, hides at the next note, and ignores silence. |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (618 of 618) |
| `npm run test:e2e` | pass (146 of 146, second full run). The first full run had 5 timeout failures (accuracy:81, hardening:245, journey:150, noteGuide:53 sharp300 laptop, offline:16). They passed alone and in this second full run, so they look like load flakes. |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| UI-S10-T1-01 | Fixed | The dot travel is clamped to half the box minus 16 px, so the dot (11 px radius) and its marker stay inside. I did not add an e2e pixel check. |
| UI-S10-T1-02 | Deferred | The short guide on the laptop is a deliberate trade-off that keeps the graph at 110 px or more. The owner should accept it or ask for a taller guide. |
| UI-S10-T1-03 | Fixed | The results reason now reads "A little low/high (n cents)". |
| PLAN-S10-T1-01 | Fixed | Added `simSinger.test.ts` for `findLate`. |
| PLAN-S10-T1-02 | Fixed | Added `useGuideRescue.test.tsx`, which checks the reset on `noteIndex` change. |

## Not done

Nothing.

## Assumptions and deviations

The 16 px inset is 11 px of dot radius plus 5 px for the border and the marker.

## How to see it

`/#/lesson/s1b-01?sim=octaveDown` at 393 px, in We do.
