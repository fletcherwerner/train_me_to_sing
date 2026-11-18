# E15 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

E15 is built: storage version 2 with proofs and reviews, the two-days-two-keys mastery rule, the 1/3/7/14-day review schedule, the `/practice` screen (warm-up glides, pitch finding, new pattern, review, wrap-up), and scoop detection with `?sim=scoop`. Home's Continue card is now "Today's practice". Five older e2e specs changed because one pass is now "Passed once", not Passed (see Assumptions).

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Storage v2 and migration | `src/storage/schema.ts`, `profileFormat.ts`, `exportImport.ts`, `profiles.ts`, `store.ts`, `today.ts` | v1 data is migrated on storage load, file import and profile load. `?today=` overrides the date. |
| Mastery and review (pure) | `src/core/progress/{types,dates,mastery,review}.ts`, `src/content/mastery.ts` | `isMastered`, `dueReviews`, `afterReview`, `usesMastery`. |
| Practice plan (pure) | `src/core/session/practicePlan.ts` | `planToday`, `describePlan`, `goodSessionNote`. |
| Practice screen | `src/ui/screens/Practice.tsx`, `Practice.css`, `Warmup.tsx`, `src/app/routes.tsx` | Route `/practice`; Stop for today is in a sticky bar. |
| Glides | `core/exercise/{types,fit,glides,pitchGraph}.ts`, `audio/tonePlayer.ts`, `exercisePlayer.ts`, `PitchGraph.tsx` | `glideToOffset`, sloped target lines, sliding tone. |
| Scoop coaching | `core/scoring/{onsets,evaluate,tips,types}.ts`, `ui/describeReason.ts`, `audio/pitch/simSinger.ts` | `'scooped'` reason, tip, `sim=scoop`. |
| Lesson and Home | `ui/screens/Lesson.tsx`, `Home.tsx` | Key choice avoids proof keys; "Passed once" and "Review due" text; Today's practice card. |
| Tests | `core/progress/*.test.ts`, `core/session/practicePlan.test.ts`, `core/scoring/scoop.test.ts`, `core/exercise/glides.test.ts`, `storage/practiceProgress.test.ts`, `tests/e2e/practice.spec.ts` | Plus fixture updates in existing storage tests. |
| Notes | `docs/epic-notes/E15.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (440 of 440) |
| `npm run test:e2e` | pass (80 of 80) |
| `npm run build` | pass |

## Response to findings

Turn 1: no earlier findings.

## Not done

- No e2e test waits 20 real minutes. The "good session" note is covered by a unit test and by an e2e that opens `/#/practice?minutes=20`. `?minutes=N` is a small test hook I added.
- Scoop detection is not applied to Unit A match lessons (they have their own scoring), as the epic lists Units A–B only as a tip on the melody path.
- No test passes a second proof in a second key through Today's practice itself. The two-day flow is run through the lesson screen (e2e `mastery over two days`) and the review through a seeded lesson; the practice run itself covers warm-up, pitch finding and a new pattern.

## Assumptions and deviations

- The storage key stays `tmts.v1`; the document's `version` is 2.
- A v1 passed Stage 2–3 lesson becomes `passed: false` with one `-1` proof (needs one more day), as the epic says. A v1 passed Unit B–D lesson keeps `passed: true` with `proofs: []`, since the epic gives those no proof.
- In `?sim=` runs the key stays centred until the lesson has a proof, then is chosen deterministically avoiding proof keys, so e2e can pass in two keys. Stage 2–3 stay centred until they have a proof.
- A voice counts as sliding only if it starts from silence (null frame, or 100 ms gap) within 100 ms before the note or inside it; a legato leap is not a scoop. The 70-cent threshold is measured on the first frame of the voice.
- Reviews move on for any Prove attempt (or any attempt, Stages 2–3) made while the review is due, from Today's practice or the lesson list.
- Existing specs `home`, `stage1`, `stage2`, `stage3`, `profiles` expected one pass to count as Passed; they now expect "Passed once" and `0 of N passed`. The two Home tests that looked for the Continue card still pass because the card keeps the testid and shows "Pitch finding: Find one note".
- The `pitch` part runs one round of the Unit A lesson cut to 4 targets and saves it as that lesson's attempt, as "saved as if opened from Home".
- `Lesson.tsx` now exports `LessonRun` (new optional `forceLevel` prop) for Practice to reuse.
- No runtime dependencies added.

## How to see it

`npm run dev`, then Home → "Start today's practice" (`/#/practice`). Add `?sim=perfect` for a simulated singer, `&today=2026-11-21` to change the day, `&minutes=20` for the 20-minute note. `?sim=scoop` with a Unit C lesson at Prove shows the scooped misses.
