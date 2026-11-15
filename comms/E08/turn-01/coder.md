# E08 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Stage 2 (eight scale lessons) is registered and shows on Home with a "stricter" note. The lesson intro shows the tolerance in plain words. The `/settings/calibrate` screen measures and saves latency, and Settings has a 0–500 ms slider. Calibration has not been tried with a real microphone.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Content | `src/content/builtin/stage2.ts`, `registry.ts` | 8 lessons, `t2` then `t3`; no engine change needed |
| Onsets and calibration maths | `src/core/scoring/onsets.ts`, `calibration.ts` | `detectOnsets`, threshold, matching, median, round half up, clamp |
| Calibration screen | `src/ui/screens/Calibrate.tsx`, `routes.tsx` | 4 count-in + 8 clicks at 60 bpm; Save / Retry |
| Settings and store | `Settings.tsx`, `store.ts`, `schema.ts` | slider, calibrate link, `setLatencyOffset`, optional `calibratedAt` |
| Tolerance display | `describeTolerance.ts`, `Lesson.tsx`, `Home.tsx` | intro line, one-time calibrate hint on s2-01, Stage 2 note |
| Tests | `calibration.test.ts`, `audio/pitch/stage2Scoring.test.ts`, `content.test.ts`, `tests/e2e/stage2.spec.ts` | see epic notes |
| Notes | `docs/epic-notes/E08.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (157 of 157) |
| `npm run test:e2e` | pass (19 of 19) |
| `npm run build` | pass |

## Response to findings

None; this is turn 1.

## Not done

Nothing in scope is missing. Real-microphone calibration and the fairness review (script steps 2–7) need a person.

## Assumptions and deviations

- Added optional `settings.calibratedAt` to the zod schema to know whether the student has ever calibrated. The slider does not set it.
- `Lesson.tsx` already passes `latencyMs / 1000` to `recordFrames`; verified, and covered by a test.
- The recorder and short-note tests are in `src/audio/pitch/` so `core/` imports nothing outside `core`.
- Under `?sim=` the calibration screen gets constant rms, so it reports "Couldn't hear clear sounds". The maths is unit tested instead.
- Count-in threshold has a 0.005 floor so a silent count-in cannot give zero.
- The existing Stage 1 content test now filters on stage 1.

## How to see it

`npm run dev`, then Home → Stage 2, and Settings → Calibrate timing (`/#/settings/calibrate`).
