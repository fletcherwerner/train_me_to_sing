# E06 — Full lesson session: I do / We do / You do

## Goal

One reusable lesson screen that takes any `Lesson` and runs it through I do, We do, You do and a results screen.

## What you will review

A complete lesson, from pressing Start to seeing your result, using one hard-coded lesson.

## Depends on

E04 (playback), E05 (scoring, live feedback).

## Scope

In: session state machine, `Lesson` screen, results view, `Lesson` type, tolerance lookup.
Out: lesson list, progress saving (E07).

## Specification

### `src/core/session/sessionMachine.ts` (pure reducer)

```ts
type Step = 'intro' | 'iDo' | 'weDo' | 'youDo' | 'results';
type Activity = 'idle' | 'running' | 'finished';   // within a step
interface SessionState {
  step: Step;
  activity: Activity;
  iDoPlays: number;
  weDoResult: AttemptResult | null;     // latest, not saved
  youDoResult: AttemptResult | null;
}
type SessionEvent =
  | { type: 'BEGIN' }                    // intro -> iDo, idle
  | { type: 'RUN' }                      // idle|finished -> running (also used for Repeat)
  | { type: 'RUN_ENDED'; result?: AttemptResult }   // running -> finished
  | { type: 'STOP' }                     // running -> idle
  | { type: 'NEXT' }                     // iDo -> weDo -> youDo; only when not running
  | { type: 'BACK_TO'; step: 'iDo' | 'weDo' | 'youDo' }   // from any step when not running
  | { type: 'SHOW_RESULTS' };            // youDo finished -> results
reduce(state, event): SessionState
```

Rules:
- `NEXT` from `iDo` requires `iDoPlays ≥ 1`. `NEXT` from `weDo` is always allowed once not running (the student may skip singing along, but must have reached the step).
- `RUN_ENDED` in `iDo` increments `iDoPlays`; in `weDo` stores `weDoResult`; in `youDo` stores `youDoResult`.
- Invalid events return the state unchanged.

### Step behaviour

| Step | Melody | Metronome | Start note | Mic | Graded | Controls when not running |
|------|--------|-----------|------------|-----|--------|---------------------------|
| I do | on | on | no | off | no | Play / Repeat, Next |
| We do | on | on | no | on | shown, not saved | Sing along / Repeat, Next, Back to I do |
| You do | off | on | yes | on | yes | Start / Try again, See results, Back |

Every run in every step, including repeats, begins with the same 4-click lead-in at the lesson tempo (`LEAD_IN_CLICKS` from E04), and the exercise starts on the next beat. In You do the start note sounds first, then the 4 clicks. A Stop button is shown while running.

### `Lesson` screen (`/lesson/:lessonId`)

- Loads the lesson (for this epic from a single hard-coded `demoLesson`: `0 2 4 2 0`, 60 bpm, `t1`, pass 0.8; route `/lesson/demo`).
- Fits the exercise to the stored range. If there is no range → redirect to `/range`. If the fit fails → message with needed and available semitones and a link home.
- Layout top to bottom (single column, works at 360 px wide):
  1. Lesson title and a three-part step header ("I do · We do · You do") with the current step emphasised.
  2. One instruction line for the step: "Listen and watch." / "Sing along with the piano." / "Your turn. The piano is silent; follow the lit key."
  3. `BeatIndicator`.
  4. `PianoKeyboard` (display range, range markers, target, sung).
  5. `CentsMeter` (hidden in I do).
  6. `SequenceStrip` (chips coloured after We do / You do runs).
  7. Controls for the step.
- Intro: lesson goal text, a headphones reminder, "Start" (unlocks audio; requests the mic now so the permission prompt does not interrupt later).
- After a We do run: one line, e.g. "Practice run: 3 of 5 notes." Not saved.
- After a You do run: automatically go to results.
- Leaving the screen stops playback and the mic.

### Results view (step `results`)

- Headline: "Passed" or "Not yet", with "4 of 5 notes (80%)". Pass mark shown.
- `SequenceStrip` coloured by result. Tapping a chip plays that note.
- List of missed notes with the reason wording from E05.
- One tip chosen from the most common miss reason:
  - `wrong-octave`: "You're singing the right note in a different octave. Listen to the first note again and match how high it is."
  - `wrong-note` mostly flat / sharp: "You tend to land flat/sharp. Watch the meter and nudge up/down."
  - `wavered`: "Hold each note steady until the next chip lights."
  - `early` / `late`: "Start each note on the click."
  - `silent`: "We couldn't hear you. Check the mic and sing a little louder."
- Buttons: "Try again" (`BACK_TO youDo`), "Hear it again" (`BACK_TO iDo`), "Home".
- Expose an `onAttemptComplete(result)` callback prop (no-op in this epic; E07 uses it to save progress).

## Tests

- Reducer: full happy path; `NEXT` from `iDo` before any play is ignored; `STOP` returns to idle without a result; `BACK_TO` during running is ignored; We do result never sets `youDoResult`.
- Playwright `/lesson/demo?sim=perfect` with a seeded range: Start → Play → Next → Sing along → Next → Start → results show "Passed" and "5 of 5".
- Playwright `?sim=octaveDown`: results show "Not yet" and the octave tip.

## Review script

1. Open `/#/lesson/demo`. Read the intro, press Start, allow the mic.
2. **I do:** Next is disabled until you have played it once. Play, then Repeat.
3. **We do:** sing along. You hear the piano, see the blue target key and your own key. A practice score line appears. Repeat once.
4. **You do:** you hear the first note and a count-in, then clicks only. Sing. The results appear on their own.
5. Results: the score matches your impression; tap a chip to hear the note; the tip is relevant.
6. "Try again" returns to You do; "Hear it again" returns to I do.
7. Navigate away mid-run — sound stops and the browser's mic indicator turns off.
8. Repeat on the iPhone.
