# S11 — Spike: hear the whole pattern, earn the solo, and a faster guide — Summary

**Approved:** 2026-11-26 · **Turns:** 1 · **Branch merged:** `epic/S11` into `main`

## What was accomplished

- **Both tones before a solo.** In Stage 1 lessons with levels (Units B–D), You do now plays the whole pattern on the piano first. For Sol–mi that is sol, then mi. Then there is one beat of silence, the count-in, and your turn. This holds at Learn, Practise and Prove. The status line reads "Listen…" and then "Your turn". The call is never scored, and any sound picked up during it is discarded.
- **"Hear it again".** A plain button next to Start on You do. It replays the call only. It starts no run and counts as no attempt. Start is disabled while it plays.
- **Earn You do.** After a We do run, "Next: You do" is highlighted only if you hit every note. Otherwise "Sing along again" is highlighted, and a line says "Hit every note while singing along, then try it solo." "Next: You do" still works as a plain button.
- **Earn Practise.** Practise needs two Learn passes, on any days. After the first, the results say "Passed at Learn: 1 of 2. One more pass unlocks Practise." and the highlighted button is "Try again". Existing progress already at Practise or Prove keeps its level.
- **Practise starts with a sing-along.** Opening a lesson at Practise, or advancing to it from Learn, lands on We do. Prove still starts at You do.
- **Faster guide.** The "go up / come down" text now changes after about 35 ms instead of up to a second. The cents number is live, rounded to 5. The dot eases over 30 ms. A separate hidden screen-reader line keeps the once-a-second rule. The live display uses a 3-frame median. Scoring still uses the 5-frame value, so results are unchanged.
- **Taller guide on the laptop.** At 900 px wide or more, the guide is 90–130 px tall and the pitch graph 100–160 px. The phone is unchanged.
- **New test singers:** `weDoMiss` and `step300`.
- Stage 2–3 lessons keep the start-note cue and the old flow.

## Changes made during review

None. Approved in turn 1.

## How to test it

1. Setup: `npm install`, then `npm run dev`. Open the printed URL. Clear site data first (or use a private window) for a clean progress state.
2. Open `#/lesson/s1b-01` (Sol–mi) at Learn with a real microphone. Play I do, then We do, and miss a note on purpose. You should see the highlighted "Sing along again" and the gate line. "Next: You do" is a plain button.
3. Sing along well. "Next: You do" is now highlighted.
4. Go to You do. The status shows "Listen…" while the piano plays sol then mi. After a beat of silence and the count-in it shows "Your turn". Sing both notes back.
5. Press "Hear it again" while idle. Both notes replay and no run starts.
6. Pass once. The results say "Passed at Learn: 1 of 2" and offer "Try again", not "Go to Practise". Pass a second time, and the results say Practise is unlocked.
7. Open Practise. It starts at We do, then goes to You do with the call.
8. Slide your voice across the target note. The dot should follow with no visible lag. The text should flip between "go up" and "come down" without a pause. On the laptop, a small miss and a big miss should sit at visibly different heights.
9. Without a microphone, use the synthetic singers. Add `?sim=perfect`, `?sim=silent`, `?sim=weDoMiss` or `?sim=step300` to the lesson URL, for example `#/lesson/s1b-01?sim=weDoMiss`.
10. Check a Stage 2 lesson (`#/lesson/s2-01?sim=perfect`). You do still plays only the start note, with no call and no "Hear it again".
11. Automated checks: `npm run lint`, `npm test` (637 pass), `npm run test:e2e` (165 pass, 1 skipped; `tests/e2e/soloReadiness.spec.ts` runs at 1280 and 393 px) and `npm run build`.

## Not verified by the agents

- Sound: the piano playing sol then mi, the beat of silence, and the audible count-in.
- Sliding a real voice: the dot keeping up, "go up / come down" flipping with no pause, and a small miss and a big miss at different heights in the laptop guide.
- "Hear it again" replaying without starting a run (the UI reviewer saw the button but did not press it; the e2e tests cover it).
- The second Learn pass showing "Practise is unlocked", and a Practise visit starting at We do. The UI reviewer did not run these by hand; the e2e tests cover them.
- A clean screenshot of the "Your turn" status.
- Dark mode and an actual iPhone.

## Known issues and deferred items

- UI-S11-T1-01 (non-blocking, `comms/S11/turn-01/ui-review.md`): on the laptop at 800 px high, after a We do run, "Sing along again" and "Next: You do" sit below the fold. The result graph is shown twice. Suggested fix: drop the duplicate graph or move the buttons up.
- PLAN-S11-T1-01 (non-blocking, `comms/S11/turn-01/plan-review.md`): the dot's transform is still set through React props, not a ref. It meets the response-time test. Change it only if lag shows up.
- The response-time test depends on the synthetic source's frame timing, not a real microphone (`docs/epic-notes/S11.md`).
- The 2-frame hold is a 35 ms timer, not a frame count.
- Stage 2–3 built-in lessons have no Practise level, so "one pass unlocks Practise" cannot apply to them. The store keeps that rule for any non-Stage-1 lesson with levels.
- "Hear it again" also shows at Prove and in Today's practice reviews. At Prove the piano shows no target keys during the call.
- Today's practice's Sol–mi step now ends its first Learn run with "Passed" (1 of 2), not "Level passed".

## For the owner to decide

None.
