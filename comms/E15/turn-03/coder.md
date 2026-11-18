# E15 — Turn 3 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the blocking laptop finding by capping the warm-up piano at 150 px tall (`.warmup-piano .piano { max-height: 150px }`), as the other training screens cap theirs. I did not measure the page height before and after, because the sandbox refused my measuring script. The UI reviewer should confirm that Start/Stop and the Target/Sung line now fit in 800 px.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Warm-up piano height | `src/ui/screens/Warmup.tsx`, `src/ui/screens/Practice.css` | Piano wrapped in `.warmup-piano`; its height is capped |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (440 of 440) |
| `npm run test:e2e` | pass (80 of 80 on the second full run). The first full run had one timing flake, `stage1.spec.ts` "echo yourself … (phone)". It passed on a rerun of that file and in the second full run. |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| UI-E15-T2-01 | Fixed (unmeasured) | Piano capped at 150 px so the page should fit in 800 px. Not measured by me. |
| UI-E15-T2-02 | Deferred | Audio check is for the owner. Nothing to change on screen. |
| PLAN-E15-T1-01 | Deferred | Needs an owner decision on Unit A scoop tips. |
| PLAN-E15-T1-02 | Deferred | A separate seeded test covers it. |

## Not done

Nothing new. No measurement of laptop page height.

## Assumptions and deviations

None.

## How to see it

`/#/practice` at 1280×800: Warm-up, then "Start glide".
