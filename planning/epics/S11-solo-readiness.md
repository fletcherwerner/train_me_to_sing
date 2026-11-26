# S11 — Spike: hear the whole pattern, earn the solo, and a faster guide

## Goal

The owner says: "The Sol–mi help is still insufficient. It is moving too fast to the 'do it solo'. It also only ever sounds 1 tone, when it's a 2 tone test. Sound both tones and provide best response speed to adjust tone."

Three causes are in the code:

1. **Too fast to solo.**
   - In `sessionMachine.ts`, one I do play unlocks We do, and We do unlocks You do whatever the result.
   - Opening a lesson at Practise or Prove goes straight to You do (`BEGIN`), skipping I do and We do.
   - One Learn pass unlocks Practise, and "Go to Practise" goes straight to You do (`ADVANCE`).
2. **Only one tone.** You do calls `playExercise` with `playStartNote: true` and `playMelody: false`. In Sol–mi the student hears sol only and must recall mi alone.
3. **Slow guide.** `NoteGuide.tsx` changes its visible text at most once a second (`TEXT_MIN_MS = 1000`). S10 meant that limit only for the screen-reader announcement. The dot also eases over 80 ms, and the live pitch is a 5-frame median. Together these make the guide feel sluggish when the student is trying to correct.

This spike:
- plays the whole pattern before each solo in Stage 1;
- makes the student earn You do and Practise with real sing-along success;
- makes the guide respond as fast as the pitch tracking allows.

## What you will review

- **Sol–mi, You do:** before the count-in, the piano plays **both** notes (sol, then mi). Then you sing them back alone. A "Hear it again" button replays both before you start.
- **Learn:** "Next: You do" becomes the highlighted button only after a sing-along where you hit both notes. Until then the highlighted button is "Sing along again". You can still skip ahead with the plain button.
- **Practise:** is unlocked after **two** Learn passes, not one. Each Practise visit starts with one sing-along before the solo.
- **The guide:**
  - the dot follows your voice with no visible lag;
  - the "go up / come down" text changes as soon as you cross over;
  - the cents number updates live.
- On the laptop, the guide is tall enough to show a small miss and a big miss differently.

## Depends on

S10 (run order, and the note guide). It also builds on:
- E04/E06 playback and the I do / We do / You do session (`exercisePlayer.ts`, `sessionMachine.ts`, `Lesson.tsx`);
- E14 feedback levels and Stage 1 (`stage1.ts`);
- S07 primary-button rule;
- E02 live pitch (`MicPitchSource.ts`, `smoothing.ts`).

## Decisions made for the owner (2026-11-25; change in `comms/S11/OWNER-NOTES.md` before the run if wanted)

- **"Play the whole pattern first" applies to Stage 1 You do at every level, Prove included.** The student hears the phrase, then sings it back. That is echo singing, and Prove still gives no live help while singing.
  - Stage 2 scales and Stage 3 songs keep the start-note-only cue, because they are longer and Prove there means from memory.
- **The guided gate applies to Stage 1 lessons with levels (Units B–D).** Stage 2–3 keep today's flow.
- **Unlocking Practise takes two Learn passes**, on any days, in Stage 1 only.
- **Unlocking Prove is unchanged:** one Practise pass.

## Scope

**In:**
- the You do cue in Stage 1;
- "Hear it again";
- the We do gate and the primary button;
- the Practise unlock count and where a Practise visit starts, for Stage 1;
- the guide's text and dot speed;
- the live-display smoothing;
- the guide's height on the laptop.

**Out:**
- scoring, tolerances and pass marks;
- the Match lessons (Unit A), which already play their note and run for 8 s;
- Stage 2–3 flow;
- Today's practice reviews, which still start at Prove. They do get the Stage 1 pattern cue, through the You do change;
- the pitch detector itself (window size, clarity thresholds).

## Specification

### A. Hear the whole pattern before a solo (`exercisePlayer.ts`, `Lesson.tsx`)

- Add a `playCall` option to `playExercise`.
  - When it is set, the piano plays the whole exercise once at the lesson's tempo before the lead-in. For Sol–mi this is sol for 2 beats, then mi for 2 beats.
  - Then there is one beat of silence, then the usual count-in, then the student's turn with the piano silent.
- `startSec` and scoring timing still refer to the student's beat 0, so evaluation is unchanged.
  - The call's notes must not be scored, or recorded as the student's frames.
  - Update `registerSimExercise` so simulated singers start at the student's beat 0, not during the call.
- **Bleed:** the call is the piano, so treat its span like I do's playback for the bleed gate (S06). Any frames during the call are discarded.
- **Stage 1 lessons with levels:**
  - You do uses `playCall: true` in place of `playStartNote`, at Learn, Practise and Prove.
  - The status line reads "Listen…" during the call, then "Your turn" at the count-in.
  - Prove's on-screen help stays as today: the start key shows only before the count-in.
- **Other lessons:** they keep `playStartNote`.
- **"Hear it again"** (`data-testid="hear-again"`):
  - It is a plain button on You do while idle, in Stage 1. It plays the call only (`playPreviewNote` or a call-only playback), never starts a scored run, and doesn't count as an attempt.
  - While it is playing, Start is disabled. It is not a primary button.

### B. Earn the solo (`sessionMachine.ts`, `Lesson.tsx`)

The rules below apply to Stage 1 lessons with levels.

- **We do gate:**
  - "Next: You do" is the **primary** only after a We do run with every note hit (`weDoResult` with all `hit`).
  - Until then, "Sing along again" is the primary and "Next: You do" is a plain button, so it is still reachable.
  - After a non-perfect We do, show one line: "Hit every note while singing along, then try it solo." (`data-testid="wedo-gate"`)
  - `NEXT` itself still works from We do, so nothing is locked.
- **Practise unlock:**
  - A Learn pass in a Stage 1 lesson counts toward unlocking Practise. Two Learn passes, on any days, are needed.
  - Store this as an optional `learnPasses` count on the progress entry. It is absent on older data. For migration, an entry whose `level` is already `practise` or `prove` keeps it.
  - After the first Learn pass, the results say "Passed at Learn: 1 of 2. One more pass unlocks Practise." The primary is then "Try again" (You do), not "Go to Practise".
  - After the second, they say "Practise is unlocked", as today.
- **Where a Practise visit starts:**
  - `BEGIN` at Practise in Stage 1 starts at We do, not You do. The student gets one sing-along, then "Next: You do", with the We do gate applied.
  - `ADVANCE` from Learn to Practise also lands on We do.
  - Prove still starts at You do, which now has the call (A).
- **Stage 2–3:** `BEGIN`, `ADVANCE` and the unlock stay as today.
- Keep the reducer pure. Pass the Stage 1 flag in `createSession` as an option, such as `guided: true`.

### C. A faster guide (`NoteGuide.tsx`, `.css`, live pitch)

- **Visible text:**
  - It updates on every state change, after the change has held for **2 consecutive frames** (about 35 ms). This stops flicker at the edges.
  - Remove the 1-second limit from the visible text.
  - The near-case cents number updates live, rounded to the nearest 5 cents.
- **Screen readers:** move the `aria-live` announcement to a separate visually hidden element. That element keeps the at-most-once-a-second rule, and changes only on kind or direction.
- **Dot:**
  - The transition is at most **30 ms**, or none if motion is reduced.
  - It updates from the same live value every frame, with no extra React state delay. Prefer setting the transform directly from the live value.
- **Live display smoothing:**
  - The value that drives the guide, the "Sung" label and the piano's sung key becomes a 3-frame median instead of 5. Add `SMOOTH_WINDOW_DISPLAY = 3` in `PITCH_CONFIG`.
  - Scoring and the recorded frames keep the 5-frame value, so results don't change.
  - If the two-path split is awkward in `MicPitchSource`, emit both on the frame (`midi` and `midiFast`).
- **Silence hold:** stays at 250 ms.
- **Height:**
  - At 1280 × 800, the guide is at least **90 px** tall (UI-S10-T2-01). Take the space from the pitch graph's height on this screen, not below 100 px.
  - At 393 px it stays as S10 left it.
- **Response-time check:** add a test that measures the time from a step change in the synthetic pitch to a change in `note-guide` `data-state`, using the synthetic source in the browser. It must be at most 120 ms.

### D. Test singers

- `perfect`, `flat70` and the rest begin at the student's beat 0 after the call.
- Add `weDoMiss` for the gate test. It hits every note except the last during We do, and sings perfectly in You do.

## Tests

**Unit:**
- `sessionMachine.test.ts`:
  - guided `BEGIN` at Practise goes to We do;
  - guided `ADVANCE` lands on We do;
  - unguided is unchanged;
  - `NEXT` from We do works without a perfect run.
- Store and progress:
  - `learnPasses` counts Learn passes in Stage 1 only;
  - two unlock Practise and one doesn't;
  - an older entry already at `practise` keeps it;
  - Stage 2 unlocks after one, as today.
- `exercisePlayer`: with `playCall`, the call notes precede the lead-in, and `startSec` is the student's beat 0.
- `NoteGuide.test.tsx`:
  - the text changes after 2 frames, not after 1 s;
  - the hidden live region still announces at most once a second;
  - the cents round to 5.
- `smoothing.test.ts`: the 3-frame display median.

**Playwright (1280 and 393 px):**
- **Sol–mi You do at Learn (`sim=perfect`):** during the call, the status shows "Listen…" and two piano chips light in turn before the count-in. The result is unchanged from today: 2 of 2.
- **Prove:** the same call plays. With `sim=perfect` the lesson passes; with `sim=silent` it scores 0. The call isn't scored.
- **"Hear it again":** plays the call, and no attempt is recorded (the attempts count is unchanged).
- **The gate:**
  - with `sim=weDoMiss`, after We do the primary is "Sing along again" and `wedo-gate` shows;
  - after a perfect We do, the primary is "Next: You do".
- **Unlock:**
  - one Learn pass shows "1 of 2" and no "Go to Practise";
  - a second pass shows "Practise is unlocked";
  - opening at Practise starts at We do.
- **Guide speed:** with the synthetic source stepping from on the note to 300 cents high, `data-state` changes from `on` to `far` within 120 ms, and the text says "too high" within 150 ms.
- **Guide height:** at 1280 × 800 the guide box is at least 90 px tall.
- Stage 2 lesson: You do still plays only the start note, and one pass unlocks Practise.
- Update the specs that assumed one-pass unlocks in Stage 1, or that Practise starts at You do. All other specs pass.

## Review script

1. Open Sol–mi at Learn. Play I do, then We do, and miss a note on purpose. The highlighted button is "Sing along again", with a line saying to hit every note first.
2. Sing along well: "Next: You do" is highlighted.
3. In You do, the piano plays sol and then mi, then counts you in. Sing them back. "Hear it again" replays both without starting.
4. Pass once: the results say one more Learn pass unlocks Practise. Pass again: Practise unlocks.
5. Open Practise: it starts with a sing-along, then You do with both notes played first.
6. Watch the guide while sliding your voice: the dot keeps up, and the text flips between "go up" and "come down" as you cross the note, with no pause.
7. On the laptop, a small miss and a big miss sit visibly at different heights.
