# S07 — Spike: clearer next step and a lighter look — Summary

**Approved:** 2026-11-18 · **Turns:** 3 · **Branch merged:** `epic/S07` into `main`

## What was accomplished

- **The highlighted button now points forward.** In a lesson, after you listen in I do, "Next: We do" is highlighted and "Play again" sits beside it. After We do, "Next: You do" is highlighted and "Sing along again" sits beside it. "Repeat" is gone.
- **Results say where to go.** After a pass at the final level, "Next lesson: <title>" is highlighted. "Back to lessons" is on every results screen. If you did not pass, "Try again" is highlighted. If it is the last lesson, "Back to lessons" is the primary.
- **First Prove pass:** a line under the verdict reads "Come back tomorrow to finish this one."
- **Today's practice** is unchanged in flow: only "Next part" is highlighted. The lesson's own Next lesson and Back to lessons buttons are hidden there.
- **Header and progress:** "‹ Lessons" replaces "Home" in the lesson header, Settings, Mic check, Import, Calibrate and the range test. A three-part bar (I do, We do, You do) shows the current step, ticks finished steps and mutes later ones. Level, help and start note sit in one small block under it.
- **Lighter look:** shared light and dark colour tokens, soft cards instead of black outlines, status pills with a word and icon, progress bars under stage and unit headings, and a "Next" tag with a left border on the recommended lesson on Home.
- Home's "Next" tag and the results "Next lesson" use the same function, so they agree.

## Changes made during review

- Plan review, turn 1: there was no dark-mode screenshot of the results screen. Results screenshots in light and dark at both widths, with a no-horizontal-scroll check, were added in turn 2.
- UI review, turn 1 (re-raised in turn 2): on the phone, the "‹ Lessons" button overlapped the lesson title. Turn 2's fix lost to an existing style rule. Turn 3 raised the rule's specificity and made the header a two-column row. A test now checks at 393 px that the link does not overlap the title.

## How to test it

1. Run `npm run dev` and open the app at 1280 px wide. Try it in light mode, then switch the OS to dark. Home shows soft cards, status pills with words, and a "Next" tag on one lesson.
2. Open the lesson marked "Next". Add `?sim=perfect` to the URL to skip the microphone. Press Play in I do. "Next: We do" should be highlighted, with "Play again" beside it.
3. Go on to We do and sing. "Next: You do" should be highlighted. The step bar ticks finished steps.
4. Pass You do at the final level. Results highlight "Next lesson: …" and also show "Back to lessons". Tapping Next lesson opens that lesson. For a lesson without levels, try `/#/lesson/s2-03?sim=perfect`.
5. Repeat with `?sim=silent`. "Try again" is highlighted, and "Back to lessons" returns Home.
6. Start Today's practice and finish a lesson part. Only "Next part" is highlighted.
7. Narrow the window to 393 px, or use phone emulation. Nothing scrolls sideways, "‹ Lessons" does not overlap the title, and buttons are easy to tap.
8. Automated checks: `npm run lint`, `npm test` (449 pass), `npm run test:e2e` (90 pass, about 10 minutes), `npm run build`. The new coverage is in `tests/e2e/journey.spec.ts` and `practice.spec.ts`.

## Not verified by the agents

- A real microphone, piano sound and headphones.
- iPhone Safari rendering and tap comfort.
- The UI review did not re-capture the results screens in light and dark in turn 3. The plan review accepted the turn 2 screenshots.
- The coder did not re-measure the header at 360 px.

## Known issues and deferred items

- UI-S07-T2-02 (non-blocking): missed-note tiles are saturated red. The ✗ and the word carry the meaning. Optional softer colour was deferred (`comms/S07/turn-03/coder.md`).
- UI-S07-T2-03 (non-blocking): the pitch graph stays white in dark mode. Graph drawing is outside this epic.
- PLAN-S07-T1-02 (non-blocking): there is no unit test of the primary-button rule. Only Playwright covers it, because `Lesson` needs audio and has no component test. The epic allows this.
- `dev-page` was not renamed to `page`, because many selectors depend on it (`docs/epic-notes/S07.md`).
- Added `--border-strong`, which the spec did not list, so controls reach 3:1 contrast. `--success` is a darker green than the hit-note fill so text reaches 4.5:1.
- The Next lesson and Back to lessons logic also applies to Unit A match results.

## For the owner to decide

None. There are no requirement changes proposed and no open questions. Optionally, decide whether to schedule the softer miss colour and the dark pitch graph.
