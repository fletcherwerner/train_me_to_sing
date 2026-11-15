# E06 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Built the reusable Lesson screen (intro, I do, We do, You do, results) driven by a pure session reducer, with a hard-coded demo lesson at `/lesson/demo`. Results show verdict, score, pass mark, tappable chips, missed-note reasons and one tip.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Session reducer | `src/core/session/sessionMachine.ts`, `.test.ts` | Replaced an untracked draft that wrongly stored the I do result as `weDoResult`. |
| Tips | `src/core/scoring/tips.ts`, `.test.ts` | `pickTip` by most common miss reason. |
| Content | `src/content/types.ts`, `demoLesson.ts` | `Lesson`, `LessonSource`, demo lesson. |
| Screen | `src/ui/screens/Lesson.tsx`, `Lesson.css`, `src/app/routes.tsx`, `Home.tsx` | Route `/lesson/:lessonId`; Home links to the demo. |
| Shared UI | `src/ui/describeReason.ts`, `SequenceStrip` (`onChipPress`, ✓/✗ text), `exercisePlayer.playPreviewNote`, `AttemptDev` | Reason wording moved to a shared module. |
| E2E | `tests/e2e/lesson.spec.ts` | perfect → Passed 5 of 5; octaveDown → Not yet + octave tip; no-range redirect. |
| Notes | `docs/epic-notes/E06.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass (0 errors) |
| `npm test` | pass (76 of 76) before the final commit; no code changed after |
| `npm run test:e2e` | pass (13 of 13) |
| `npm run build` | pass |

## Response to findings

None (turn 1).

## Not done

Nothing in scope. Not tested on a real mic or an iPhone; no manual browser look at layout (UR-21/22 unverified by me).

## Assumptions and deviations

- A new `RUN` clears that step's earlier result so stale chips don't show.
- `SHOW_RESULTS` is allowed from You do whenever not running and a result exists (used by the "See results" button after returning to You do).
- Mic is opened once on Start and reused for all runs; stopped on leaving the screen. Mic denial keeps the student on the intro with a plain message.
- Lesson e2e tests take about 30 s each (real clock); timeout set to 90 s.
- `SequenceStrip` chips show "✓ hit" / "✗ miss" text as well as colour.

## How to see it

`npm run dev`, open `https://localhost:5173/#/lesson/demo` (or `?sim=perfect` / `?sim=octaveDown` without a mic).
