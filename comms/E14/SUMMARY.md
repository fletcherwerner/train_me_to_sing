# E14 — Beginner path: new Stage 1, feedback levels, echo yourself — Summary

**Approved:** 2026-11-17 · **Turns:** 2 · **Branch merged:** `epic/E14` into `main`

## What was accomplished

- Stage 1 is replaced by 19 new lessons in four units (ids `s1a-01` to `s1d-03`). Home groups them by unit and shows "n of m passed" for each unit.
- **Unit A, find one note:** a match screen. You hear a target, slide in and hold it. Each target reports whether it matched and how long that took. A target that you slide into is reported as "slid". Targets move across your low, middle and high range.
- **Unit B onward, feedback levels:** each lesson now has three levels.
  - Learn is I do / We do / You do with the full graph.
  - Practise has no red line or cents meter while you sing. The graph appears afterwards.
  - Prove hides the graph, target labels and note strip. Only the starting note is lit before the count-in.
  - Passing You do unlocks the next level. Only a Prove pass marks the lesson Passed. You can step back down to "Practise with help".
  - Practise and Prove start on a new key each attempt.
- **Echo yourself:** after a clean run, you can hear your own best take in place of the piano and sing along. The attempt is scored but never saved.
- Old Stage 1 progress (`s1-01` to `s1-08`) is dropped on load, import and profile load. Home shows a one-time "Stage 1 has been rebuilt" notice. Stage 2 and 3 progress is kept.
- Home rows show the level reached. The Continue card picks the first unpassed lesson in the new order.

## Changes made during review

- UI-E14-T1-01: the Prove run said "follow the lit key" when no key was lit. It now says "Your turn. Start on the lit note, then sing from memory." before the run and "Sing it from memory." during it.
- Also in turn 2: the generic match pass tip is now "Every note matched. Move on to the next lesson, or try again to match faster."

## How to test it

1. Run `npm run dev` and open the app. Reset progress in settings. Home should show Stage 1 in four units with nothing passed. If you had old progress, the rebuilt notice should show.
2. Open `/#/lesson/s1a-02`. Hear each target, slide in and hold. Each target should say whether it matched and how long it took.
3. Check that targets in the low, middle and high lessons sit in different parts of your range.
4. Slide into a note on purpose and the result should say you slid. Start right on the note and it should match.
5. Open `/#/lesson/s1b-04`. Pass You do at Learn and the lesson should move to Practise.
6. In Practise, check that there is no red line while you sing and that a full graph shows afterwards. Pass.
7. In Prove, check that there is no graph and no lit key during the run. Pass. Home should show the lesson as Passed.
8. In Practise or Prove, check that the starting note changes between attempts.
9. After a clean Unit B run, tap Echo yourself. You should hear your own voice, then sing along and get a score.
10. Open a Stage 2 or 3 lesson and an imported song. They should behave as before.
11. Without a microphone, use `?sim=perfect` (for example `/#/lesson/s1a-02?sim=perfect`, 6 of 6) or `?sim=silent` (0 of 6, about a minute). Add `&key=random` to get random keys.
12. Automated checks: `npm run lint`, `npm test` (379 pass), `npm run test:e2e` (70 pass, about 9 minutes), `npm run build`.

## Not verified by the agents

- Echo yourself with a real microphone recording and playback. Only the synthetic take was tested. Check it on iPhone Safari (`audio/mp4`).
- Hearing the 1.5 s target tone and the count-in clicks.
- Sliding in on purpose and the "you slid" message, which need a real voice.
- Whether the starting note changes between attempts (not captured in screenshots).
- Stage 2 and 3 lessons and imported songs (not reviewed by the UI agent).
- Dark mode on the run and results screens.
- Everything on a real iPhone.

## Known issues and deferred items

- UI-E14-T1-02: on phones, the lesson title sits against the Home button on the match screens when the title is long (`comms/E14/turn-02/ui-review.md`).
- UI-E14-T1-03: match results are plain lines, not the hit and missed tiles used by lesson results.
- UI-E14-T1-04: dark mode running and results screens were not reviewed.
- PLAN-E14-T1-01: the Stage 1 e2e spec takes about 7.6 minutes.
- Going Back to We do at Practise or Prove draws the graph against that visit's key, which can differ from the earlier run's key (`docs/epic-notes/E14.md`).
- Recorder start latency (tens of ms) is not compensated when trimming a take.
- Echo for Unit A uses only the matched hold (about 1 s).

## For the owner to decide

- Should the Stage 1 e2e spec be shortened, or is its run time acceptable? Shortening the three-level runs would reduce coverage.
