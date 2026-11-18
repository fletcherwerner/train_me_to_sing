# S06 — Ignore the piano leaking into the microphone — Summary

**Approved:** 2026-11-17 · **Turns:** 2 · **Branch merged:** `epic/S06` into `main`

## What was accomplished

- Without headphones, the app's own piano no longer counts as the student's singing in We do.
- In I do the app measures how loud the piano is at the microphone. This level is kept only for the current lesson visit. Replaying I do measures it again.
- In We do, input that is no louder than that level while the piano plays is ignored. This applies to the live graph, the live "Sung" readout, the piano keys, the cents meter, the results graph and the score. A silent student gets 0 notes and no red line following the piano.
- When the piano is loud at the microphone, We do shows a notice: "The microphone can hear the piano. Use headphones, or sing louder than the piano."
- You do is not gated. With headphones, or when We do runs before any I do play, behaviour is as before.
- Test simulators `sim=bleed` (piano only) and `sim=bleedSing` (piano plus a perfect singer) were added.

## Changes made during review

- UI-S06-T1-01 (blocking): the live keys and cents meter in We do still showed the piano as the student's voice. The live display now uses the same gate, so "Sung" shows "—" while only the piano plays.

## How to test it

1. Run `npm run dev` and open `/#/lesson/s1-05?sim=bleed`.
2. Play I do. Then open We do. The headphones notice shows.
3. Run We do (Sing along). The "Sung" readout stays "—", no sung key lights, and no red line follows the piano. The practice line reports 0 notes.
4. Open `/#/lesson/s1-05?sim=bleedSing`, play I do, then We do. The notice may show, the sung note is tracked, and the practice line reports every note.
5. Open `/#/lesson/s1-05?sim=perfect`, play I do, then We do. There is no notice, and results are as before.
6. Automated: `npm test` (292 pass), `npm run test:e2e` (53 pass), `npm run lint`, `npm run build`. All passed per the coder's turn 2 report. The plan reviewer saw lint and unit tests pass, but e2e and build had not finished when the review was written.

## Not verified by the agents

Only the simulator was used. Needs a real microphone and speakers:
1. With laptop speakers, play I do silently, then stay silent in We do. Expect 0 notes, no red line following the piano, and the notice.
2. Run We do again and sing along at normal volume. Check that your notes count, including quiet singing.
3. Check that the gate level suits your laptop's real leak.
4. With headphones, reload the lesson and play I do and We do. Expect no notice and scoring as before.

## Known issues and deferred items

- UI-S06-T1-02 (non-blocking): the notice appears after I do and shifts the layout. It uses the red `tuner-error` style, the same as misses (UR-24). Deferred as a design choice. Recorded in `comms/S06/turn-02/ui-review.md`.
- UI-S06-T1-03 (non-blocking): on iPhone, with the notice showing, the practice graph looked cut off by the button bar in a full-page capture. This may be a capture artefact and was not checked on a phone.
- The new e2e check of the live readout samples once, 3 s into the run, so it is a weak check (`comms/S06/turn-02/coder.md`).
- `core/scoring/bleed.ts` defines `MIN_RMS = 0.01` itself, because `core` cannot import `PITCH_CONFIG` (`docs/epic-notes/S06.md`).
- In I do the non-bleed sims report rms 0, so `sim=perfect` shows no notice.

## For the owner to decide

- Whether to restyle the notice with a neutral or warning style, or to reserve space for it (UI-S06-T1-02).
- No requirement changes were proposed.
