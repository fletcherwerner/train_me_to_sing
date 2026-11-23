# S09 — Full-length match targets, with a report — Summary

**Approved:** 2026-11-22 · **Turns:** 1 · **Branch merged:** `epic/S09` into `main`

## What was accomplished

- In single-note lessons (Unit A, e.g. "Find one note", and the Pitch finding part of Today's practice), every target now runs for the full 8 seconds. Finding the note early no longer ends it. You can stay on it and settle. Stop still ends it at once.
- A thin countdown bar under the status empties over the sing time. The status reads "Now sing it and hold the note." and adds "✓ Found it — keep holding" once you match.
- After each note, a line says how it went. A match reads like "✓ Found in 1.2 s · on the note 85% after that · a little flat (−15 cents)". A miss reads like "✗ Not found · mostly a semitone sharp", or the existing silent, wrong-octave or slid wording.
- The results list shows the same line per note, plus "matched X of N", the pass mark and overall accuracy. Today's practice shows the same lines.
- Passing and "matched" are unchanged. Accuracy for match lessons now runs from the first voiced moment to the end of the sing time, and silence after you start singing counts against it.
- Lessons can set their own sing time with an optional `singSec`. None do yet.

## Changes made during review

None. Approved in turn 1. The first coder attempt was interrupted by a network failure and the second finished from its work.

## How to test it

1. Run `npm run dev` and open `/#/lesson/s1a-02?sim=perfect` ("Find one note"). The simulated singer matches at once. The countdown bar appears and the status adds "✓ Found it — keep holding". The next "Listen…" does not start before about 7.5 s.
2. After each note, a line such as "✓ Found in … s · on the note …% after that · right on" appears under it.
3. At the end, the results list every note with the same line. They show "matched 6 of 6", the pass mark and accuracy.
4. Open `/#/lesson/s1a-02?sim=flat40`. The lines say "flat (−40 cents)". Matched or not follows the lesson's tolerance, as before.
5. Open `/#/lesson/s1a-02?sim=silent`. Every note says "Not found", with 0 matched.
6. Open `/#/?sim=perfect&today=2026-11-22` and start Today's practice. Pitch finding runs 4 full-length targets with the same lines.
7. Repeat step 1 in a 393 px wide window. Nothing scrolls sideways.
8. Automated checks: `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e`. The e2e suite takes about 15 minutes because each target now lasts 8 s.

## Not verified by the agents

- Singing into a real microphone. That covers the feel of staying on the note, and whether the flat/sharp cents text matches how you actually sang. Review script steps 1–3 need this.
- The countdown against real audio and the piano playback.
- A real iPhone.
- Today's practice Pitch finding was not captured in screenshots. It uses the same `MatchRun` component.
- Dark mode was not captured.
- The plan reviewer did not finish its own e2e run. The coder reported 95 of 95 passing (15.4 min). The UI reviewer's screenshots covered the Unit A screens at both sizes.

## Known issues and deferred items

- The match e2e specs are slow, at 8 s per target (`docs/epic-notes/S09.md`).
- PLAN-S09-T1-01 (non-blocking): the plan reviewer's e2e run was not confirmed independently.
- UI-S09-T1-01 (non-blocking): the flat40 results show "on the note 100% after that" next to "accuracy 67%". The two use different rules and nothing explains the gap.
- UI-S09-T1-02 (non-blocking): on a phone, the results lines wrap to 2–3 rows with no spacing between notes, so the text is dense.

## For the owner to decide

No `FOR-OWNER.md` was written, and the reviews propose no requirement changes. One open question is whether to fix the two non-blocking UI findings above. One fix is to label the accuracy figure, for example "accuracy (right on the note)". The other is to space out the results lines.
