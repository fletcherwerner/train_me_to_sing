# E17 — Practice insights: activity, weekly goal and a performance dashboard

## Goal

Turn what the app hears into feedback that helps the student sing better and keeps them coming back.

Today a run's detail is thrown away when the results screen closes. Only the best score, best accuracy and mastery proofs per lesson are kept (`src/storage/schema.ts`). This epic keeps a compact log of every run, plus the time spent practising. From that log it builds:

- a weekly goal: a circle that fills at **4 active days** (Monday to Sunday), compared with last week, with a streak of weeks;
- practice time for today, this week and last week;
- **focus areas** after each run, and a **Today** card combining all of today's runs;
- a **summary review**: what the student consistently struggles with over the last 1–2 weeks, and what has **improved** compared with the two weeks before;
- the best-run views the app already has (best score and best accuracy per lesson), plus the personal bests set recently.

All of it is shown on a new **Progress** screen. A small weekly circle on Home opens it.

The focus areas use a fixed set of categories, chosen from what beginners most often get wrong (see "Why these categories").

## What you will review

- Home shows a small circle for this week: "2 of 4 days". It opens Progress.
- Progress shows, from top to bottom:
  - this week's circle and the days Monday to Sunday, with the active ones filled;
  - "Last week: 3 days";
  - "Goal met 2 weeks in a row", once the goal has been met;
  - time practised today, this week and last week;
  - a Today card;
  - Your patterns;
  - Improvements;
  - Best runs.
- After any scored run, the results screen shows "Focus next" with one or two areas from that run. For example: "Landing flat: 4 of 6 notes were flat, by about 25 cents. Before each note, hear it in your head, then aim a little higher."
- With two weeks of use, Your patterns names what keeps coming up, for example "Big leaps fall short (on 5 of 7 days)". With four weeks, Improvements says things like "You're landing flat much less: 38% of notes in early November, 21% now."
- Everything stays on the device and is saved in `progress.json` on the iPhone (E16). Export and Import carry it.

## Depends on

E16 (run order; the history goes into `progress.json`). It also builds on:
- E05 scoring: `NoteResult`, `evaluate.ts`, `tips.ts`;
- E14 match lessons: `matchScoring.ts`, `MatchRun.tsx`;
- E15 Today's practice: `Practice.tsx`, `today.ts`, `dates.ts`;
- S01 profiles: `profileFormat.ts`;
- S07 design tokens and `ResultsNav`;
- S08 accuracy and best accuracy;
- S09 `describeMatch`;
- E10 export and import.

## Owner decisions (2026-11-23)

- **Active day:** any finished run counts. This means a lesson run to its results, a Match lesson, a warm-up, or a part of Today's practice. Stopping a run early doesn't count.
- **Feedback:** after each run on its results screen, and a Today card on Progress that combines the day.
- **Weekly goal:** fixed at 4 active days, with a streak of weeks in a row.
- **Placement:** a new Progress screen, with a small ring on Home.

## Scope

**In:**
- the run log and practice time, with storage, retention, export/import and profiles;
- active days, the weekly goal and the streak;
- focus areas per run and per day;
- the 1–2 week patterns and the improvement comparison;
- the Progress screen and the Home ring;
- the per-note numbers that the categories need.

**Out:**
- any server, account or sharing;
- notifications or reminders;
- changing pass rules, tolerances, mastery or the lesson catalogue;
- recording audio. Only numbers are kept, never sound;
- an adjustable goal;
- the song-import idea.

## Why these categories

These sources inform the categories. The coder doesn't need to read them.

- **Flat is the most common miss.** In one coaching app's large dataset, about two-thirds of misses were flat, typically about half a semitone. Misses were flat 81% of the time when the melody moved up (singingcarrots.com, "why do singers go flat"). Sharp is the rarer profile.
- **Poor-pitch singers shrink intervals.** They also shift their whole pitch consistently, and they are more variable than accurate singers. Their hearing is usually fine, so the problem is turning the pitch into voice (Pfordresher & Brown 2007; Pfordresher & Mantell 2014).
- **Untrained singers drift.** Unaccompanied, they drift over a phrase, with a median of 11 cents and significant drift in 22% of recordings (Mauch, Frieler & Dixon 2014).
- **The app's existing miss reasons:** wavering, scooping, timing, the wrong octave and silence (E05, E14). These are the other common beginner problems.

## Specification

### A. The run log (`src/core/insights/types.ts`, `src/storage/schema.ts`, `store.ts`)

Add an optional `history` field to `StoredData`. It defaults to `{ runs: [], days: {} }` when absent. Older files parse unchanged, and the version stays 2, as S08 did for `bestAccuracy`.

```ts
interface RunRecord {
  id: string;            // random, unique; used to merge on import
  lessonId: string;      // or 'warmup', 'practice:<part>' for unscored parts
  kind: 'melody' | 'match' | 'warmup';
  date: string;          // local YYYY-MM-DD (todayString(), so ?today= works in tests)
  endedAt: string;       // ISO
  durationSec: number;   // from the run's start to its results
  level?: 'learn' | 'practise' | 'prove';
  inPractice: boolean;   // run inside Today's practice
  tonicMidi?: number;
  range?: { lowMidi: number; highMidi: number }; // the student's range at the time
  score?: number;        // 0..1, scored runs only
  accuracy?: number;     // 0..1
  passed?: boolean;
  notes?: NoteRecord[];  // dropped after 8 weeks (see Retention)
}
interface NoteRecord {
  t: number;             // target MIDI
  c: number | null;      // median cents off (+ sharp, − flat); null when silent
  h: number;             // held fraction 0..1
  s?: number;            // spread: interquartile range of cents over the voiced frames
  o?: number | null;     // onset error ms (melody)
  r?: string;            // miss reason, when missed
  sc?: boolean;          // slid in (scooped / slid)
  f?: number | null;     // match only: found in seconds
  a?: number;            // accuracy 0..1
  oct?: boolean;         // wrong octave
}
```

- Every finished run appends one `RunRecord` through a new store action, `logRun`, in the same `commit` as `recordAttempt`. That way one save writes both, and the E16 file sync picks it up.
  - Melody runs record their run in `Lesson.tsx`.
  - Match runs record theirs in `MatchRun.tsx`.
  - A finished warm-up has no score or notes, and is recorded in `Warmup.tsx` or Practice.
  - Parts of Today's practice are logged by the same screens with `inPractice: true`.
  - A run stopped before its results isn't logged.
- **Spread:**
  - Add `spreadCents` to `NoteResult` (`src/core/scoring/types.ts`). It is computed in `evaluate.ts` as the interquartile range of the frame cents within the note.
  - Add it to match targets too, over the frames after the first voiced frame.
  - It doesn't change hit, miss or the score.
- **Practice time per day:** `history.days[date] = { seconds }`.
  - Count time while a lesson, Match, warm-up or Today's practice screen is open **and** the page is visible (`visibilitychange`, and on iOS also `appStateChange`).
  - Stop counting after 2 minutes with no run in progress and no input. This avoids counting a phone left on the results screen.
  - Add the time in chunks of at least 15 s. Update on leaving the screen, on hiding, and at each run end, so a crash loses at most a little.
- **Retention:**
  - Keep runs from the last 8 weeks in full.
  - For older runs, drop `notes` and keep the rest. Cap the log at 3,000 runs, removing the oldest.
  - Prune in `logRun`.
  - Note the size in the report. At about 1 KB per run with notes, 8 weeks of heavy use is about 0.5 MB, well within `localStorage`.
- **Export/import (`exportImport.ts`):**
  - Export includes `history`.
  - Import "replace" takes it as is.
  - Import "merge" unions runs by `id`, and takes the larger `seconds` per day.
- **Profiles (`profileFormat.ts`):** `ProfileData` gains `history`, so each profile keeps its own. `FRESH_DATA` has an empty history. Older profile files without it still load.
- **Reset progress** also clears the history. Its confirm text says so.

### B. Weeks, active days and streak (`src/core/insights/activity.ts`, pure)

- Weeks run Monday to Sunday, in local dates, using the helpers in `src/core/progress/dates.ts`.
- `activeDays(history, weekStart)` returns the dates in that week with at least one finished run.
- `weekSummary(history, today)` returns:
  - this week's active days, as a count and a set of 7 booleans;
  - last week's count;
  - `goalMet` (4 or more this week);
  - the streak: whole weeks in a row with 4 or more active days, counted back from last week, plus this week once it is met.
- If this week isn't met yet, the streak shown is the one up to last week, with "keep it going" wording. If last week was missed, the streak is 0.
- Practice time per week is the sum of `days[date].seconds`.

### C. Categories (`src/core/insights/categories.ts`, pure)

Each category has:
- a fixed id;
- a short name;
- a test applied to the notes and runs;
- a **rate**, which is a share;
- a minimum count, below which it isn't judged;
- one sentence of evidence;
- one concrete tip;
- a suggested lesson where one fits.

Silent notes and wrong-octave notes are left out of the pitch categories, unless a category says otherwise.

| id | Name | A note or run counts when | Rate over | Flag when | Min |
|---|---|---|---|---|---|
| `flat` | Landing flat | `c ≤ −25` | voiced notes | rate ≥ 30% and flat ≥ 2 × sharp | 8 voiced notes |
| `sharp` | Landing sharp | `c ≥ +25` | voiced notes | rate ≥ 30% and sharp ≥ 2 × flat | 8 |
| `unsteady` | Holding steady | `h < 0.6`, or `r = 'wavered'`, or `s > 40` | voiced notes | rate ≥ 30% | 8 |
| `sliding` | Sliding into notes | `sc` | voiced notes | rate ≥ 25% | 8 |
| `high` | High notes | flat or unsteady among notes in the top quarter of `range` | voiced high notes | its rate is ≥ 20 points worse than the other notes' rate | 5 high notes |
| `leaps` | Big leaps fall short | a step of ≥ 3 semitones between two voiced neighbours whose sung step is ≥ 30 cents smaller than the target step | such leaps | rate ≥ 35% | 5 leaps |
| `drift` | Drifting off over a phrase | a melody run of ≥ 6 voiced notes whose last-third median cents differ from its first-third median by ≥ 20 cents (direction kept) | melody runs | rate ≥ 30% | 3 runs |
| `timing` | Starting on time | `r = 'early'` or `'late'`, or `\|o\|` above that lesson's timing tolerance | notes with an onset | rate ≥ 25% | 8 |
| `finding` | Finding the note | match targets not found, found after 3 s, or wrong octave | match targets | rate ≥ 35% | 4 targets |

- `quiet` (silent notes or targets of 30% or more, with at least 8) isn't a singing struggle. It shows as a separate notice: "We often couldn't hear you. Check the mic (Settings › Mic check) and sing out a little more." It never counts as a pattern or an improvement.
- Each category's tip is plain and kind, with one action. Examples:
  - flat: "Before each note, hear it in your head, then aim a little higher than feels natural."
  - leaps: "On big jumps, think of the top note before you leave the bottom one, and aim past it."
  - drift: "Breathe before each phrase and check the first note again when the piano plays."
  - unsteady: "Take a full breath and keep the air steady until the next chip lights."
- The coder maps each category to an existing lesson where one fits, such as Unit A single notes for `finding` or a sustained-note lesson for `unsteady`. The coder lists the mapping in the report. A suggestion opens that lesson.
- The thresholds are constants in one file with a comment, so they can be tuned later.

### D. Focus after a run (`src/core/insights/runFocus.ts`, results screens)

- `runFocus(run)` applies the categories to that one run, with the minimums scaled to the run. A pitch category needs at least 4 voiced notes in the run, and `drift` needs the run itself to qualify.
- It returns at most **2** flagged areas, ordered by how far over the threshold each is. The order of the table breaks ties.
- If nothing is flagged, it returns the best thing about the run instead, for example "Right on pitch: 5 of 6 notes within 10 cents" or "Steady: every note held". It never returns an empty box.
- Results screens:
  - melody runs: `Lesson.tsx` results;
  - Match runs: `MatchRun.tsx` results;
  - the same embedded inside Today's practice.
- These screens show a "Focus next" section (`data-testid="run-focus"`). Each item has its name, its evidence, its tip, and the suggested lesson as a link, where there is one.
- On melody results the focus section **replaces** the single `pickTip` line, so the same advice isn't given twice. `pickTip` stays for anywhere else it is used.
- At Learn level the section is limited to one area, to keep things light for beginners.

### E. Today, patterns and improvements (`src/core/insights/summary.ts`, pure)

**Today card:** today's runs, time practised, lessons played, any new bests (score or accuracy), and the top 2 flagged areas over all of today's runs. The full minimums apply; below them, only the run-level areas from the last run are shown.

**Your patterns (consistent struggles):**
- **Window:** the last 14 days (today and the 13 before it) when they hold at least 60 voiced notes over at least 3 active days. Otherwise use the last 7 days, when they hold at least 30 voiced notes over 2 active days. Otherwise show "Sing on a few more days to see your patterns", with how many more active days are needed.
- A category is a pattern when it is flagged over the window **and** flagged on at least half of the window's active days that had enough data for it. That stops one bad day from becoming a "pattern".
- Show up to 3 patterns, worst first. Each shows its name, then "on 5 of 7 days" and the window's rate, then the tip, then the suggested lesson.
- The heading says which window was used: "Last 2 weeks" or "Last week".

**Improvements (recognition):**
- **Recent** is days 1–14 back from today, and **before** is days 15–28.
- Both need at least 40 voiced notes over 2 active days. Otherwise this section explains: "Keep going: after about four weeks, this shows what you've improved."
- A category has improved when its rate fell by at least 10 percentage points **and** by at least a third of its earlier rate. Show up to 3, biggest drop first. For example: "Landing flat: 38% of notes → 21%".
- Also recognise:
  - mean accuracy up by at least 5 points: "Your accuracy went from 62% to 71%";
  - lessons mastered in the recent window;
  - more active days than in the window before.
- Lessons get harder as the student moves on, so the comparison only uses rates, and the wording stays modest: "less often", not "fixed".
- If nothing improved, show the student's consistency instead: "You practised 9 days in the last two weeks." Never show an empty or discouraging box.

**Trend chart:**
- One small inline-SVG chart of mean accuracy per week, for the last 8 weeks.
- It has a bar for practice minutes per week behind it, on a separate light axis, or uses two small charts if that reads more clearly.
- It has no chart library, follows the S07 tokens, and has a text summary for screen readers.

### F. Progress screen (`src/ui/screens/Progress.tsx`, route `#/progress`)

- Use the S07 look: the header with "‹ Lessons", cards and the tokens. It is laid out for 1280 and 393 px.
- **This week** (`data-testid="week-goal"`):
  - a ring that fills a quarter per active day and is full and marked "Goal met" at 4;
  - "2 of 4 days";
  - seven labelled day dots, M T W T F S S, with today outlined;
  - "Last week: 3 days", with "1 more than last week" or similar;
  - the streak, or a "keep it going" line such as "2 more days to keep your 3-week streak".
- **Time** (`practice-time`): today, this week and last week, in minutes.
- **Today** (`today-card`): from E.
- **Your patterns** (`patterns`), **Improvements** (`improvements`) and the trend chart, from E.
- **Best runs** (`best-runs`):
  - the lessons with a best score or best accuracy, best accuracy first, linking to each lesson;
  - personal bests set in the last 7 days are marked "New this week".
  - The existing per-lesson "Best accuracy" lines stay where they are (S08).
- An empty state for a new student: "Sing your first lesson to start your week."
- **Home:**
  - a compact ring with "2 of 4 days this week" (`home-week-ring`), linking to Progress;
  - Home's layout otherwise stays as it is;
  - a "Progress" link also goes in the header or nav, wherever Lessons and Settings are reached.

## Tests

**Unit, all pure with fixed dates:**
- `activity.test.ts`:
  - Monday–Sunday weeks across a month and a year boundary;
  - active days from runs;
  - stopped runs don't count;
  - the streak when this week is met, when it isn't, and when last week was missed;
  - time per week.
- `categories.test.ts`:
  - each category flags and doesn't flag at its threshold;
  - each respects its minimum;
  - silent and wrong-octave notes are excluded;
  - `leaps` uses neighbouring voiced notes only;
  - `drift` keeps its direction;
  - `high` uses the stored range.
- `runFocus.test.ts`:
  - at most 2 areas, ordered;
  - Learn level gives 1;
  - a clean run gives a positive line.
- `summary.test.ts`:
  - choosing the 14- or 7-day window, or none;
  - a one-day spike isn't a pattern;
  - improvements need both the 10-point and the one-third drop;
  - too little earlier data gives the "keep going" text;
  - the "nothing improved" text is still positive.
- Storage:
  - old data with no `history` loads;
  - `logRun` prunes notes after 8 weeks and caps at 3,000;
  - export, import replace and import merge (union by id, larger seconds per day);
  - profiles keep their own history;
  - Reset clears it.
- `evaluate`: `spreadCents` is right for a steady note and a wobbling one, and hit or miss is unchanged.

**Playwright, at 1280 and 393 px:**
- `sim=perfect`: finish a lesson.
  - Results show `run-focus` with a positive line.
  - Home's ring reads "1 of 4 days".
  - Progress shows 1 active day, today's dot filled, time above 0, and a Best runs entry.
- `sim=flat40`: results show "Landing flat" with the cents.
- A seeded history with `?today=`, four active days this week, three last week, and a goal met last week:
  - the ring shows "Goal met";
  - "Last week: 3 days";
  - "2 weeks in a row" (or the right number).
- A seeded 4-week history where flat falls from about 40% to 20%:
  - Your patterns lists the categories seeded as consistent;
  - Improvements lists "Landing flat".
- A seeded 5-day history: the 7-day window heading, and the "keep going" improvements text.
- Stopping a run early doesn't add an active day.
- All existing specs pass. Update any spec that checked the single tip line on melody results.

`npm run lint`, `npm test`, `npm run build` and `npm run ios:sync` (with Node 22) succeed.

## Review script

1. On a fresh profile, open Home: the ring says "0 of 4 days this week". Open Progress: the empty state.
2. Sing one lesson. Results show "Focus next" with one or two areas and a tip. Home's ring now says "1 of 4 days", and Progress shows today's dot, the minutes and the Today card.
3. Sing a few notes flat on purpose in a melody lesson. "Landing flat" appears with how many notes and by how much.
4. Stop a lesson halfway on a new day (`?today=` in the browser, or the next real day). That day doesn't become active.
5. Use the app on four days in one week: the circle fills and says "Goal met". The next week, "Last week: 4 days" and the streak show.
6. After two weeks, Your patterns names what keeps coming up and on how many days. After four weeks, Improvements names what got better.
7. Export, then Import into another profile: the history and the week come across.
8. On the iPhone (E16), `progress.json` holds `history`, and the Progress screen looks right at phone width.
