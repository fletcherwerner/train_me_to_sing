# S08 — Spike: accuracy percentage and best score per lesson

## Goal

Today a lesson's score is "notes hit ÷ notes" (`AttemptResult.score`). It moves in big steps (a 2-note lesson can only score 0, 50 or 100%) and says nothing about *how close* the sung notes were: a note 45 cents flat and a note dead on both count as a hit. That score and its best (`bestScore`) show only on Home.

Add an **accuracy** percentage, 0–100%, that measures how closely the sung pitch followed the target through each note. Keep the best accuracy for each lesson, show it before the student starts, and after the attempt show the new accuracy and update the best when it is beaten.

The pass rule does not change: pass/fail still uses notes hit against the pass mark.

## What you will review

- Before you start a lesson, the lesson screen shows "Best accuracy: 82%" (or "No best yet" on a lesson you haven't sung).
- After You do, results show "Accuracy: 87%" with "New best! (was 82%)" when you beat it, or "Best: 91%" when you didn't. The best shown before the next attempt is the new one.
- Singing a little sharp or flat lowers accuracy even when the note still counts as hit; singing dead on gets close to 100%.
- Home shows the best accuracy in each lesson's status (for example "Passed · 91%").
- Export/import and profiles carry the best accuracy across.

## Depends on

S07 (run order; S07 changes the results screen and lesson header this builds on). E05 scoring (`src/core/scoring/evaluate.ts`), E14 match lessons (`matchScoring.ts`), E15 storage version 2 (`src/storage/schema.ts`, `store.ts`, `exportImport.ts`, profiles).

## Scope

In: the accuracy calculation; storing and merging the best; showing it on the lesson screen, results and Home.
Out: the pass rule and tolerances; mastery, proofs and reviews; We do practice runs, Echo yourself and warm-up glides (none of them are scored); history or charts of past attempts.

## Specification

### A. Accuracy (`src/core/scoring/accuracy.ts`, pure)

Per note, over that note's window (the same window `evaluateAttempt` uses, skipping the same scoop allowance at the start):

- Each frame gets a closeness value from its distance to the target in cents, `d = |midi − target| × 100`:
  - `d ≤ 10` → 1 (too small to hear);
  - `10 < d < 100` → falls linearly from 1 to 0 (`(100 − d) / 90`);
  - `d ≥ 100` (a semitone or more, including the wrong octave) → 0;
  - no pitch (silence, or gated out by S06) → 0.
- The note's accuracy is the mean over its frames. A late start or an early stop counts against it, because those frames are silent.

The attempt's accuracy is the mean of its notes' accuracies (each note counts equally, whatever its length), from 0 to 1, shown rounded to a whole percent.

- `accuracyOf(ex, frames, opts)` returns `{ overall: number; perNote: number[] }`. `evaluateAttempt` adds `accuracy` to `AttemptResult` and `accuracy` to each `NoteResult` by calling it, so every caller gets it without extra work.
- **Match lessons (Unit A):** for each target, use the frames from the moment the voice starts until the target is matched or its time runs out; same per-frame rule. Overall = mean over targets. Add `accuracy` to `MatchScore`.
- Constants (`10`, `100`) live at the top of the file with a one-line note; they are the same at every stage and level, so scores compare across lessons.

### B. Storage (`src/storage/schema.ts`, `store.ts`, `exportImport.ts`)

- Add an optional `bestAccuracy?: number` (0..1) to a lesson's progress. Absent on older data means "no best yet" (do not copy `bestScore` into it). No version bump: the field is optional, as `level` was.
- Recording an attempt: `bestAccuracy = max(old ?? 0, result.accuracy)` for any scored attempt (You do at any level, match lessons, imported songs, and the same parts run from Today's practice). Only a completed run counts; a run stopped early or lost to "sound stopped" is not saved, as today.
- Export/import merge and profile load take the higher `bestAccuracy`, as they do for `bestScore`.

### C. Lesson screen (`Lesson.tsx`, `MatchRun.tsx`)

- **Before:** under the lesson goal (intro) and in the header block on every step, a line `data-testid="best-accuracy"`: "Best accuracy: 82%", or "No best yet" when absent. It reads the stored value when the screen opens and after each saved attempt.
- **After (results):** next to the existing "2 of 2 notes (100%)" line, add `data-testid="results-accuracy"`:
  - beaten (or first attempt): "Accuracy: 87% — New best!" plus "(was 82%)" when there was an old best;
  - not beaten: "Accuracy: 74% · Best: 82%".
  The "New best" line uses the success colour with a ✓ (meaning not by colour alone).
- To avoid two different percentages side by side, the notes line drops its own percentage: "2 of 2 notes hit · pass mark 80%" ("Pass mark" stays visible).
- Each note chip in the results gets its accuracy as a small second line under hit/miss, for example "✓ hit · 94%" (`data-testid="note-accuracy-<i>"`). Same for match targets.
- Inside Today's practice the same lines show; the best updates exactly as from Home.

### D. Home (`Home.tsx`)

- A lesson's status shows best accuracy where it showed `bestScore` today: "Passed · 91%", "Best 74%". If there's no `bestAccuracy` yet (older data), show the status without a percentage instead of falling back to `bestScore`.
- `bestScore` stays in storage (export files and the pass logic use it); it is no longer shown.

## Tests

- `accuracy.test.ts`: on target → 1; 10 cents → 1; 55 cents → 0.5; 100 cents and an octave → 0; a silent half-note → 0.5; notes weigh equally regardless of length; scoop allowance skipped; match-lesson version stops at the match.
- `scoring.test.ts`: `evaluateAttempt` returns `accuracy` and per-note accuracy, and pass/fail is unchanged on the existing cases.
- Store/storage: first attempt sets the best; a lower one keeps it; a higher one replaces it; old data without the field loads; export/import and profile merge take the max.
- Playwright (1280 and 393 px):
  - `sim=perfect`: before shows "No best yet"; results show "Accuracy: 100% — New best!"; reopening shows "Best accuracy: 100%"; Home shows 100%.
  - `sim=flat40` after `sim=perfect`: results show a lower accuracy (below 80%) with "Best: 100%", and the notes still count as hit at a tolerance that allows 40 cents.
  - A match lesson with `sim=perfect` shows a results accuracy and updates the best.
- All other specs pass (update any that read the old "(100%)" notes text).

## Review script

1. Reset progress. Open a lesson: "No best yet".
2. Sing You do: results show your accuracy and "New best!". Go back to the lesson: "Best accuracy" shows that number.
3. Sing it again a bit carelessly: results show a lower accuracy and your best; the best on the lesson screen doesn't change.
4. Sing it well: "New best! (was …)", and the lesson screen and Home show the new number.
5. Export, import on another browser: the best accuracy comes across.
