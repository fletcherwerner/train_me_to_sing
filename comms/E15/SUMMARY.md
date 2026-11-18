# E15 — Daily practice: session, spaced mastery, review, onset coaching — Summary

**Approved:** 2026-11-18 · **Turns:** 3 · **Branch merged:** `epic/E15` into `main`

## What was accomplished

- **Today's practice** (`/#/practice`): a 12–15 minute session. It runs in order: a warm-up of three glides (never scored), Pitch finding (4 single notes), a New pattern (your next unmastered melody lesson), a Review, then a wrap-up. You can skip any part. "Stop for today" is always visible. After 20 minutes a "That's a good session" note appears.
- **Home**: the Continue card is now "Today's practice" with a summary line. Lesson rows show "Passed once · NN% — come back tomorrow in a new key" and "Review due".
- **Mastery over two days**: melody lessons and Stages 2–3 count as passed only after Prove passes on two different days in two different keys. A lesson shows "Passed once — come back tomorrow in a new key" until then. If only one key fits your range, one key is enough.
- **Spaced review**: a mastered lesson comes back after 1, 3 and 7 days, then every 14 days. A pass moves it to the next step. A fail sets it back to tomorrow and shows "Review due".
- **Warm-up glides**: the piano plays a sliding tone, and the graph shows a sloped target line. Each glide shows the piano, range markers and a Target/Sung line.
- **Scoop coaching**: if you slide into a note, the result says "You slid into this note. Try to start right on it." This is a tip only, except in Units C–D at Prove, where a scooped note counts as a miss.
- **Storage version 2**: progress now stores proofs and reviews. Version-1 data migrates on load, import and profile load. Passed Stage 2–3 lessons need one more passing day.

## Changes made during review

- Turn 1 UI blocker (UI-E15-T1-01): the warm-up glides had no piano and no note name. Turn 2 added the piano, range markers and a Target/Sung line.
- Turn 2 UI blocker (UI-E15-T2-01): the laptop warm-up page was 933 px tall, so Start and Stop were below the fold. Turn 3 capped the warm-up piano at 150 px. The UI reviewer measured the page at 800 px on laptop and 852 px on phone, so neither scrolls.

## How to test it

1. Run `npm run dev` and open the app. Reset progress. Test URLs can take `?today=YYYY-MM-DD`, `?sim=perfect`, `?sim=scoop` and `?minutes=N`. Add them to the hash route, for example `/#/practice?today=2026-11-20`.
2. Tap **Today's practice** on Home. In the warm-up, each of the three glides shows a countdown, a sloped line and the piano. No score appears.
3. In Pitch finding, you get four single notes around your range. In New pattern, work Sol–mi through Learn to Prove. After the Prove pass, Home says "Passed once — come back tomorrow in a new key".
4. Open `/#/practice?today=<next day>`. Sol–mi comes back at Prove in a new key. After you pass it, Home shows Passed.
5. Open `?today=<the day after that>`. A Sol–mi review appears in Today's practice.
6. In a Unit C lesson at Prove, add `?sim=scoop` to the URL. The notes count as misses with the "slid into this note" tip. In Unit B the tip appears but the notes still count.
7. Open `/#/practice?minutes=21`. The "good session" note appears. "Stop for today" works at any point.
8. Export your data, then import it in another browser. Proofs and reviews come across. A version-1 export also imports.
9. Check there is no horizontal scroll at 1280 px and 393 px.
10. Automated checks: `npm run lint`, `npm test` (440 pass), `npm run test:e2e` (80 pass), `npm run build`.

## Not verified by the agents

- Audio of the glides: the sliding tone, the "ng" instruction and the lead-in clicks (UI-E15-T3-01).
- A real microphone, including a real voice scooping into notes. The agents used simulated voices only.
- The iPhone itself.
- The New pattern, review and results screens, and Home's "Passed once" and "Review due" states, were not seen in screenshots. Only e2e tests cover them.
- Export and import of proofs and reviews, checked visually.
- Dark mode.

## Known issues and deferred items

- Unit A match lessons show no scoop tip. They use their own scoring (PLAN-E15-T1-01; plan-review, turn 3).
- The Today's practice e2e run has no due review. A separate seeded test covers the review part (PLAN-E15-T1-02).
- Pitch finding saves its 4-target round as the Unit A lesson's attempt, so a Unit A lesson can be passed with 4 targets instead of 5–6 (`docs/epic-notes/E15.md`).
- Stage 1 Unit B–D lessons that were already passed in version 1 stay passed with no proofs. They have no review until they are passed again (`docs/epic-notes/E15.md`).
- The warm-up uses the microphone only to draw your line. If the mic is denied, the glide still plays (`docs/epic-notes/E15.md`).
- Scoop detection needs the voice to start from silence. A voice carried on from the previous note counts as a leap, not a slide (`docs/epic-notes/E15.md`).
- One `stage1.spec.ts` e2e test flaked once in turn 3 and then passed (`comms/E15/turn-03/coder.md`).

## For the owner to decide

- Is it acceptable that Unit A match lessons show no scoop tip (PLAN-E15-T1-01)? The spec said "tip only" for Units A–B.
- Please check by ear that the glide lead-in clicks play before each glide (UR-09).
