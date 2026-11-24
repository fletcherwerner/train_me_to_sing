# S10 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

The note guide is built and replaces `CentsMeter` on the lesson screen. It shows at Learn, as a Practise rescue, and in the single-note and Pitch finding lessons; Prove shows nothing. Lint, unit tests and build pass. The e2e suite passed 146 of 146 on the final run. Earlier runs had load-related timeouts in different tests each time (details under Checks), so the reviewers may see a flaky test.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Guide maths | `src/core/feedback/noteGuide.ts` + test | `guideState(cents, tol, wasOn)`, `guideOffset`, `guideStateOffset`, `guideText` |
| Rescue rule | `src/core/feedback/rescue.ts` + test, `src/ui/hooks/useGuideRescue.ts` | 1.0 s, or 60% of the note if shorter, minimum 0.5 s |
| Component | `src/ui/components/NoteGuide.tsx/.css/.test.tsx` | testids as specified; `idle` state for the line-only strip |
| Melody lessons | `src/ui/screens/Lesson.tsx` | Guide at Learn, rescue at Practise You do, `CentsMeter` removed, `guide-helped` results line |
| Match lessons | `src/ui/screens/MatchRun.tsx` | Guide under status and countdown; line only while the piano plays |
| Run log | `core/insights/types.ts`, `record.ts`, `storage/schema.ts` | Optional `guideHelped` count |
| Test singer | `src/audio/pitch/simSinger.ts` | `sharp300`, `findLate` |
| E2E | `tests/e2e/noteGuide.spec.ts`, `hardening.spec.ts` | `hardening` now measures `note-guide` instead of `.cents-meter` |
| Notes | `docs/epic-notes/S10.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (615 of 615, 56 files) |
| `npm run test:e2e` | pass (146 of 146 on the final run; two earlier full or partial runs had load-related timeouts, see below) |
| `npm run build` | pass |

The final full run, after the last code change, passed 146 of 146. Before it, one full run had nine failures and a rerun of four files had five. The nine were `noteGuide` (2), `practice` (1), `stage1` (5) and `stage3` (1). All timed out waiting for a run to finish. I reran the affected files and a different set of 5 failed (`noteGuide`, `practice`, `stage1`, `stage3`), again by timeout. The same tests (`noteGuide`, `practice:43`, `stage3:5`), run with `--workers=1`, all passed (10 of 10). I treat this as flakiness from parallel load on the audio-clock runs, not a logic fault. I did not check the same specs on the unchanged code, so the reviewers should rerun the e2e suite. The full run before my last layout change failed only `hardening` (3) and `pitchGraph` (1). I fixed those afterwards, and `hardening` and `pitchGraph` then passed.

## Response to findings

Not applicable (turn 1).

## Not done

- `findLate` is added but no e2e test uses it.
- The Practise e2e does not assert that the guide "goes away at the next note".

## Assumptions and deviations

- **flat40 test.** The epic expects `sim=flat40` to give `near`. Lesson tolerance `t1` is 50 cents, so 40 cents low is "On it" by the epic's own maths. The e2e uses `flat70` for the near case.
- **Hysteresis.** It is applied through a `wasOn` argument, so `guideState` stays pure.
- **Rescue timing.** It adds up voiced off-tolerance time within a note. Silence and being on the note do not reset it.
- **Layout.** Existing specs require the graph at 110 px or more and no page scroll at 1280×800. So the guide height is `clamp(56px, 7vh, 120px)`, which is shorter than the spec's "about 120 px" on short windows. At 393 px wide, before the count-in, and in I do, it is a compact line-only strip with no text. The graph is unchanged.
- **Text updates.** The guide text changes only when the kind or direction changes, at most once a second. So the cents in the "near" text can lag the live value.
- **Idle guide.** The guide shows when idle at Learn and We do or You do, as the target strip. The dot and text appear once the run starts.
- **`CentsMeter`.** The component stays for Tuner and `AttemptDev`.

## How to see it

`npm run dev`, then `#/lesson/s1b-01?sim=sharp300` at Learn, or `#/lesson/s1a-01?sim=flat70`. See the epic's review script.
