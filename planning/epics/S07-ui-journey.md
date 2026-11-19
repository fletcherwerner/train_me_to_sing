# S07 — Spike: clearer next step and a lighter look

## Goal

The app works, but the screens still look like developer pages, and at two points the highlighted button is the wrong one:

1. **After I do**, the highlighted button is "Repeat". The student has just listened; the usual next move is We do, so that should be the highlighted button. The same happens after We do.
2. **When a lesson is finished**, nothing on the results screen says "you're done, here's where to go". The only way out is a small "Home" button in the corner.

Fix both with one rule: **on every screen, the highlighted (primary) button is the most likely next step, and its label says where it goes.** Then give the screens a lighter, calmer look through small, shared style changes. Prefer simple, subtle changes over new features or new layouts.

## What you will review

- In a lesson, after you listen in I do, the highlighted button is "Next: We do", and "Play again" sits beside it. After We do, the highlighted button is "Next: You do".
- After you pass a lesson, the highlighted button takes you to the next lesson by name, and "Back to lessons" is always there. If you didn't pass, "Try again" is highlighted and "Back to lessons" is still there.
- The lesson header shows "‹ Lessons" in place of "Home", and a three-step progress bar (I do, We do, You do) shows where you are.
- Home and the lesson screens look softer and tidier: cards with a light background instead of heavy black outlines, status shown as small coloured labels with a word and an icon, and the next lesson clearly marked.
- Light and dark mode both look right. Nothing moves or disappears that you rely on today.

## Depends on

E15 (run order, and Today's practice embeds the lesson screen), E06 lesson session (`src/ui/screens/Lesson.tsx`), E07 Home (`src/ui/screens/Home.tsx`), E13 run-screen layout.

## Scope

In:
- Which button is primary, and the button labels, on the lesson steps and the results screen.
- The lesson header's back link.
- The step indicator.
- Shared style tokens and the card, row, status and button styles in `src/index.css`, `Home.css` and `Lesson.css`.

Out:
- New screens or routes.
- Scoring, levels, mastery and Today's practice logic.
- The piano, pitch graph and cents meter drawing, apart from picking up the shared colour tokens.
- Collapsing or hiding lessons on Home (UR-18 requires every status at a glance).
- `planning/ui-requirements.md` (owner only).

## Specification

### A. One primary button per state, pointing forward (`Lesson.tsx`)

| Step / state | Primary | Others, in this order |
|---|---|---|
| I do, not yet played | Play | Next: We do (disabled until one play, as today) |
| I do, played at least once | **Next: We do** | Play again |
| We do, not yet sung | Sing along | Next: You do · Back to I do |
| We do, sung at least once | **Next: You do** | Sing along again · Back to I do · Echo yourself (if on) |
| You do, not yet sung | Start | Back · step-down button (as today) |
| Running | Stop | — |
| Sound failed / mic lost | Try again / Reconnect microphone (as today) | as today |

- "Repeat" is renamed "Play again" (I do) and "Sing along again" (We do), and is never the primary after the first run.
- The step tabs/labels and `data-testid="run-button"` stay on the play/sing/start button whatever its style, so existing tests keep finding it.

### B. Results screen: where to go next (`Lesson.tsx`)

The actions row always ends with **Back to lessons** (a link to Home, keeping the query string, `data-testid="back-to-lessons"`). The primary depends on the outcome:

| Outcome | Primary | Others |
|---|---|---|
| Level passed, a higher level is unlocked | Go to Practise / Go to Prove (as today) | Try again · Hear it again · Echo yourself · Back to lessons |
| Lesson passed at its final level (or no levels), and another lesson follows | **Next lesson: _title_** (`data-testid="next-lesson"`) | Try again · Hear it again · Back to lessons |
| Lesson passed, it is the last lesson in the catalog | **Back to lessons** | Try again · Hear it again |
| Not passed | Try again | Hear it again · step-down button · Echo yourself · Back to lessons |

- "Next lesson" comes from a new pure function `nextLessonAfter(lessons, progress, currentId, range)` in `src/core/progress/next.ts`: the first lesson after the current one in catalog order that is not mastered and fits the range, wrapping round to earlier unmastered lessons, or `null` when there are none. Home's "Next" tag (D) uses the same module (`nextLesson(lessons, progress, range)`, the first unmastered lesson that fits), so both screens agree (UR-20). With `null`, Back to lessons is the primary.
- When the student passes with "Passed once — come back tomorrow in a new key", the primary is still Next lesson. Add one short line under the verdict: "Come back tomorrow to finish this one."
- **Inside Today's practice** (`LessonRun` embedded in `Practice.tsx`): the practice screen's "Next part" stays the only primary. The lesson's own Next lesson and Back to lessons buttons are hidden there; Try again and Hear it again stay as secondary buttons. Add a prop such as `embedded` if one doesn't exist already.

### C. Header and step indicator

- `LessonHeader`: the link reads "‹ Lessons" (accessible name "Back to lessons"), still goes to `/` with the query string, and still stops sound and the microphone (UR-26). Use the same link on Mic check, Settings, Import and the range test wherever they show "Home" today, so the wording matches across screens (UR-24).
- The I do · We do · You do line becomes a three-part progress bar: the current step filled with the theme colour and labelled, finished steps with a ✓, later steps muted. The label text stays the same, so UR-07 still holds and meaning isn't carried by colour alone.
- Group the level, its help text and "Starting on _note_" into one compact block under the progress bar (smaller text, muted colour), so the one-line instruction ("Listen and watch.") is the most prominent text on the screen.

### D. A lighter look (`src/index.css`, `Home.css`, `Lesson.css`)

Add a small set of tokens on `:root` with dark-mode values, and use them instead of hard-coded colours and `currentColor` borders:

- `--bg`, `--surface` (cards and rows, a faint tint of the page), `--border` (light grey, not black), `--text`, `--muted`, `--theme` (keep the current navy and its dark value), `--success` (the green already used for hit notes), `--warn`, `--radius: 12px`, `--shadow` (a very soft one, light mode only).
- `body` gets an explicit background (`--bg`) and text colour.

Then:

- **Cards** (`home__continue`, setup card, dialogs): `--surface` background, `--border` 1px, `--radius`, soft shadow. No 2px black outlines.
- **Lesson rows on Home:** same card style; hover/press state slightly darker. The recommended next lesson's row gets a 3px left border in `--theme` and a small "Next" tag.
- **Status as pills:** Passed (✓, `--success`), In progress / best score (◐, `--theme`), Passed once (◐ with "Come back tomorrow"), Not started (○, `--muted`), Locked (🔒 or "Find your range first", `--muted`). Each keeps its word, so colour is never the only signal.
- **Stage and unit headings:** a thin progress bar under each heading next to "3 of 7 passed".
- **Header on Home:** Settings and Mic check sit side by side as small secondary links on wide screens; on phones they may stack, as today.
- **Buttons:** secondary buttons use `--border` instead of `currentColor`; primary keeps the theme fill. Slightly more space between the primary and the rest. Keep 48px minimum touch targets.
- **Results verdict:** "Passed" / "Level passed" in `--success` with a ✓; "Not yet" in the normal text colour (not red: it's encouragement, not an error).
- Rename the `dev-page` class to `page` (it no longer is a dev page), updating the `dev/` screens too, or leave it and add `page` alongside. Don't break the selectors other CSS files use.

### Keep

- All `data-testid`s, routes and the order of content on each screen.
- Touch targets (48px), no horizontal scroll at 393px, safe-area padding.
- Contrast of at least 4.5:1 for text and 3:1 for borders and pills in both modes.

## Tests

- `next.test.ts`: skips mastered and non-fitting lessons, wraps round, returns `null` when everything is mastered; imported songs are skipped (they aren't part of the path).
- Unit (`Lesson` / component tests where they exist): the primary button is "Next: We do" after one I do play and "Next: You do" after one We do run; results show `next-lesson` after a pass at the final level and `back-to-lessons` in every outcome; embedded results show neither.
- Playwright (1280 and 393 px), `sim=perfect`:
  - A full lesson at Prove (or a lesson without levels): after each step the primary button reads the next step; results show "Next lesson: …", and tapping it opens that lesson.
  - `sim=silent`: results primary is Try again; Back to lessons returns Home.
  - Today's practice: the only primary on an embedded result is Next part.
  - The header link reads "Lessons" and returns Home; Home shows a "Next" tag on the recommended row.
  - Light and dark (`colorScheme: 'dark'`): screenshots of Home, a lesson step and results; no horizontal scroll.
- Update existing specs that click "Repeat" or the old "Home" text, or use test ids instead. All other specs pass.

## Review script

1. Open Home in light mode, then dark mode. Cards and rows look soft and tidy; statuses are readable labels; the next lesson is marked.
2. Open the marked lesson. Play I do: "Next: We do" is highlighted. Go on: after We do, "Next: You do" is highlighted.
3. Sing You do and pass at the final level: the results screen highlights "Next lesson: …" and also shows "Back to lessons". Tap Next lesson: the next lesson opens.
4. Fail a run on purpose: "Try again" is highlighted; "Back to lessons" is still there.
5. Start Today's practice and finish a lesson part: only "Next part" is highlighted.
6. At phone width, nothing scrolls sideways and every button is easy to tap.
