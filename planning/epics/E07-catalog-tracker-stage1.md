# E07 — Lesson catalog, tracker, Stage 1 lessons

## Goal

Turn the single demo lesson into a product: a home screen listing lessons, the eight Stage 1 note-matching lessons, and saved progress.

## What you will review

The home screen with Stage 1 lessons. Open any lesson, complete it, and see it marked as passed with your best score, including after a reload.

## Depends on

E06 (lesson screen), E03 (storage).

## Scope

In: lesson registry, Stage 1 content, progress saving, `Home` and `Settings` screens.
Out: Stage 2 and 3 content, export/import.

## Specification

### Content

- `src/content/builtin/stage1.ts`: the eight lessons from `02-lesson-catalog.md`, built with a helper:

```ts
makeLesson({ id, stage, order, title, goal, tempoBpm, beatsPerBar?, notation, lyrics?, toleranceId }): Lesson
```

  `makeLesson` calls `parseNotation`, sets `passScore: 0.8` and `source: 'builtin'`.
- Write a one-sentence `goal` for each, e.g. s1-01: "Find one note and hit it three times in a row."
- `src/content/registry.ts`:

```ts
registerSource(source: LessonSource): void
getAllLessons(): Lesson[]            // sorted by stage, then order
getLesson(id: string): Lesson | undefined
```

  The built-in source is registered at start-up. Remove `demoLesson`; `/lesson/:lessonId` now uses `getLesson`. Unknown id → "Lesson not found" with a link home.

### Progress

- Store action `recordAttempt(lessonId, result: AttemptResult)`:
  - `attempts += 1`, `bestScore = max(old, result.score)`, `passed = old.passed || result.passed`, `lastAttemptAt = now`.
- The `Lesson` screen calls it from `onAttemptComplete` for You do results only.
- Passing is permanent; a later failed attempt does not un-pass a lesson.

### `Home` screen (`/`)

- Header: app name; the student range ("E2 – C4"); a settings icon.
- "Continue" card: the first lesson in order that is not passed and fits the range.
- Stage sections ("Stage 1 — Note matching"), each with "N of M passed". Stages with no lessons yet are not shown.
- Lesson rows: title, note count, status:
  - Not started — hollow circle
  - Attempted — "Best 60%"
  - Passed — check mark and best score
  - Doesn't fit — greyed out, "Needs 12 semitones; your range is 9", not tappable
- All fitting lessons are tappable regardless of order (open progression).

### `Settings` screen (`/settings`)

- Range, with "Redo range test".
- "Reset progress" with a confirmation dialog. Clears `progress` only.
- Links to the dev pages (`/dev/tuner`, `/dev/piano`, `/dev/exercise`, `/dev/attempt`).

## Tests

- Every built-in lesson: parses; ids unique; `toleranceId` exists; lyric count matches note count when lyrics are present; fits a 12-semitone range if its span ≤ 12.
- `recordAttempt`: best score and passed are monotonic.
- Playwright: seeded range, `?sim=perfect` — open s1-01 from home, complete it, return home, row shows passed 100%; reload, still passed. With `?sim=silent` the row shows "Best 0%".
- Playwright: seeded 3-semitone range — s1-03 is disabled with the reason; s1-01 is enabled.

## Review script

1. Home lists eight Stage 1 lessons, "0 of 8 passed", and a Continue card pointing at the first.
2. Do lesson s1-01. After results, go Home: it shows passed (or your best score).
3. Open a later lesson directly, without passing the earlier ones — allowed.
4. Fail a lesson you have already passed — it stays passed.
5. Reload — progress persists.
6. Settings → Reset progress — all lessons return to not started; the range is kept.
7. Work through all eight lessons. Note in feedback any lesson that feels too hard, too easy, or mis-scored.
8. Repeat steps 1–2 on the iPhone.
