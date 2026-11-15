# E05 — Scoring engine and graded "You do" — Summary

**Approved:** 2026-11-15 · **Turns:** 3 · **Branch merged:** `epic/E05` into `main`

## What was accomplished

A scoring engine that compares what was sung with the exercise note by note, and a `/dev/attempt` page where you can practice without the melody playing.

- **Scoring core** (`src/core/scoring/`): `evaluateAttempt` compares recorded frames against a `ResolvedExercise` using one of four tolerance profiles (`t1`–`t4`). It reports each note as hit or miss with a reason (`silent`, `wrong-octave`, `wrong-note`, `wavered`, `early`, `late`) and computes an overall score and Pass/Fail verdict.
- **Tolerance profiles** (`tolerance.ts`): `t1`–`t4` with a guaranteed floor of 25 cents / 150 ms.
- **Frame recorder** (`src/audio/pitch/frameRecorder.ts`): records pitch frames during an exercise, rewriting timestamps so time 0 is the exercise start.
- **Synthetic singer** (`src/audio/pitch/simSinger.ts`): seven `?sim=` modes (`perfect`, `flat40`, `flat70`, `octaveDown`, `late300`, `wobble`, `silent`) that follow the current exercise, used for testing without a real microphone.
- **Live feedback hook** (`useLiveAttempt`): exposes the current note index, sung MIDI, and cents against the target for the piano keyboard and cents meter.
- **`/dev/attempt` page**: exercise and tolerance dropdowns, a "Start attempt" button, live piano showing target (blue) and sung (green when matching, orange when off) keys, a large "Target: X · Sung: Y" label, a cents meter, a sequence strip with colour-coded chips, and a result table (Note, Result, Reason, Median cents, Held %, Onset ms) with the overall score and Pass/Fail.

## Changes made during review

- **Turn 2:** Added large "Target: X · Sung: Y" note-name labels under the piano (UR-06) and scroll the result section into view when a run ends (UR-13). Documented the e2e flake cause and the unspecified onset-to-`wavered` fallback in `docs/epic-notes/E05.md`.

## How to test it

1. Start the dev server (`npm run dev`) and open `https://localhost:5173/#/dev/attempt`.
2. Select any exercise from the dropdown and a tolerance profile (`t1`–`t4`). Click "Start attempt". You hear a 4-click lead-in, then only metronome clicks. The piano shows target keys in blue.
3. Sing along. The currently active key lights green when your pitch matches (within tolerance) and orange when it does not. The cents meter moves. Large text shows "Target: X · Sung: Y".
4. After the exercise ends, the result table scrolls into view. Each row shows the note name, hit/miss, reason (e.g. "Right note, wrong octave", "Flat by 70 cents", "No sound detected"), median cents, held %, and onset offset. The overall score reads "X of Y notes (Z%)" with Pass or Fail.
5. Open `https://localhost:5173/#/dev/attempt?sim=perfect` — the simulated singer hits every note and the page shows "Pass".
6. Open `https://localhost:5173/#/dev/attempt?sim=octaveDown` — every row reports "Right note, wrong octave" and the page shows "Fail".
7. Test other sim modes: `?sim=flat70` (all `wrong-note`), `?sim=late300` (all `late` under `t4`, all hit under `t1`), `?sim=silent` (all `silent`, score 0).
8. Run the automated checks:
   - `npm run lint` — pass.
   - `npm test` — 64 of 64 pass (scoring, recorder, sim, tolerance-floor).
   - `npm run test:e2e` — 10 of 10 pass (including `sim=perfect` passes and `sim=octaveDown` fails).
   - `npm run build` — pass.

## Not verified by the agents

- Steps 1–6 and 8 of the Review script (singing with a real microphone, hearing the count-in, checking the piano colours and cents meter in real time).
- Testing on an iPhone with wired headphones (Review script step 8).
- Dark mode visual rendering (colours read clearly, spacing, alignment).
- Whether the full page (idle state with all elements) fits at 393 px without scrolling.
- Whether the result table (6 columns) fits at 393 px without horizontal scrolling.

## Known issues and deferred items

- **Cold-server e2e flake:** On the first e2e run after a cold dev server, `sim=perfect` once reported Fail instead of Pass (likely frame hitches while Vite compiled). It passed on every rerun, including 3× repeats. Documented in `docs/epic-notes/E05.md`.
- **Onset fallback to `wavered`:** If a note passes the median, octave and hold checks but no 80 ms on-note run exists in the onset search window, it is reported as `wavered`. This is an unspecified coder choice, documented in `docs/epic-notes/E05.md`.
- **Not checked on a real mic or an iPhone.**

## For the owner to decide

None. (No `FOR-OWNER.md` was created for this epic.)
