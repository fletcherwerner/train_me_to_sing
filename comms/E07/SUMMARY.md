# E07 — Lesson catalog, tracker, Stage 1 lessons — Summary

**Approved:** 2026-11-15 · **Turns:** 1 · **Branch merged:** `epic/E07` into `main`

## What was accomplished

The single demo lesson is now a product with a catalog and saved progress.

- **Home (`/#/`)** shows the app name, your range and a settings icon. It has a "Continue" card for the first unpassed lesson that fits your range. Under "Stage 1 — Note matching" it lists the eight lessons with "N of M passed". Each row shows its state: not started (hollow circle), attempted ("Best 60%"), passed (check mark and best score), or doesn't fit (greyed out, with the reason, not tappable). Any fitting lesson can be opened in any order.
- **Eight Stage 1 lessons** (s1-01 to s1-08), all at 60 bpm with a pass score of 80%. `/lesson/:lessonId` opens them. An unknown id shows "Lesson not found" with a link home. The old demo lesson is gone.
- **Saved progress:** each "You do" result updates attempts, best score and passed status. Passing is permanent, and a later failed attempt does not undo it. Progress survives a reload.
- **Settings (`/#/settings`)** has your range with "Redo range test", "Reset progress" (with a confirmation that clears progress only), and links to the dev pages.

## Changes made during review

None. Both reviews approved in turn 1.

## How to test it

1. Run `npm run dev` and open `/#/`. Complete the range test if asked.
   - Expected: Home lists eight Stage 1 lessons, "0 of 8 passed", and a Continue card pointing at s1-01.
2. Open s1-01 and complete it. The simulated version is `/#/lesson/s1-01?sim=perfect`.
   - Expected: after the results, Home shows s1-01 as passed with its score (100% in the simulated run).
3. Open a later lesson without passing the earlier ones.
   - Expected: it opens.
4. Fail a lesson you already passed (use `?sim=silent`).
   - Expected: it stays passed. A silent run on a fresh lesson shows "Best 0%".
5. Reload the page.
   - Expected: progress is unchanged.
6. Go to Settings and choose "Reset progress", then confirm.
   - Expected: all lessons return to not started and your range is kept.
7. Open `/#/lesson/nope`.
   - Expected: "Lesson not found" with a link home.
8. Set a very small range (about 3 semitones) via "Redo range test".
   - Expected: s1-03 is greyed out with a "Needs N semitones; your range is 3" message and can't be tapped. s1-01 is still tappable.
9. Work through all eight lessons and note any that feel too hard, too easy or mis-scored.
10. Repeat steps 1–2 on the iPhone.
11. Automated checks: `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`. The coder and plan reviewer both reported all four passing (113 unit tests, 17 e2e tests).

## Not verified by the agents

- Singing the lessons with a real microphone: completing them, failing a passed one, and working through all eight.
- Whether any lesson feels too hard, too easy or mis-scored.
- Any run on a real iPhone.
- Dark mode (not captured).
- The lesson melodies have not been listened to by a person.
- The reviewers checked the passed, attempted and reset states with seeded storage and simulated runs only.

## Known issues and deferred items

- UI-E07-T1-01 (non-blocking, open): disabled rows use inconsistent layouts. Most put the reason under the title, but "Leaps up" puts it beside the title. See `comms/E07/turn-01/ui-review.md`.
- UI-E07-T1-02 (non-blocking, open): the four developer links on Settings are about 18 px tall on iPhone, which is a small tap target. They are developer-only. See `comms/E07/turn-01/ui-review.md`.
- The Lesson screen's own "Home" link drops the `?sim=` query. Home and Settings links keep it. See `docs/epic-notes/E07.md`.
- The Continue card is hidden once every fitting lesson is passed. See `comms/E07/turn-01/coder.md`.
- The goals for s1-02 to s1-08 are the coder's wording. See `docs/epic-notes/E07.md`.
- "Redo range test" moved from Home to Settings, as the epic says.
- Stage 2 and 3 content and export/import are out of scope for this epic.

## For the owner to decide

None. There is no `FOR-OWNER.md`, and the reviews propose no requirement changes.
