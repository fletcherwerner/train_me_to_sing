# E17 — Practice insights: activity, weekly goal and a performance dashboard — Summary

**Approved:** 2026-11-23 · **Turns:** 1 · **Branch merged:** `epic/E17` into `main`

## What was accomplished

- The app now keeps a compact log of every finished run (numbers only, never sound) and the time you spend practising. It is saved with your progress, so it is in `progress.json` on the iPhone, in Export/Import, and in each profile.
- **Progress screen** (`#/progress`), in this order: this week's ring (fills a quarter per active day, "Goal met" at 4) with Monday–Sunday dots, last week's count and the streak of weeks; time practised today, this week and last week; a Today card; Your patterns; Improvements; a weekly trend chart; Best runs, with "New this week" marks.
- **Home** has a small ring ("1 of 4 days this week") that opens Progress, plus a "Progress" button in the header.
- **"Focus next"** on melody and Match results, and inside Today's practice. It shows one or two areas from that run (one at Learn level) with evidence, a tip and a lesson link. A clean run gets a positive line instead. It replaces the old single tip line, except when a note was in the wrong octave.
- Nine categories are tracked: flat, sharp, unsteady, sliding, high notes, leaps, drift, timing and finding the note. A separate "we couldn't hear you" notice covers silence.
- Any finished run counts as an active day: a lesson, Match, a finished warm-up or a scored part of Today's practice. A run stopped early does not.
- Reset progress now also clears the history, and its confirm text says so.

## Changes made during review

None. Approved in turn 1.

## How to test it

1. Setup: `npm install`, then `npm run dev`. Use a fresh profile. `?today=YYYY-MM-DD` sets the date. `?sim=perfect` and `?sim=flat40` simulate a singer.
2. Open Home. The ring says "0 of 4 days this week". Open Progress (`#/progress`). You should see "Sing your first lesson to start your week."
3. Finish one lesson (for example with `?sim=perfect`). Results show "Focus next" with a positive line. Home now says "1 of 4 days". Progress shows today's dot filled, time above 0, the Today card and a Best runs entry.
4. Run a melody lesson with `?sim=flat40`. Results show "Landing flat" with how many notes and by about how many cents, plus a tip.
5. On a new day (`?today=` with a later date), start a lesson and stop it halfway. That day should not become active.
6. Use `?today=` across four days in one week. The ring fills and says "Goal met". On the next week's dates you should see "Last week: 4 days" and the streak.
7. After two weeks of use, Your patterns names what keeps coming up, for example "on 5 of 7 days". After four weeks, Improvements names what got better. With only about 5 days of data, patterns use the "Last week" heading and Improvements says "Keep going…".
8. In Settings, Export, then Import into another profile. The history and the week should come across.
9. Automated checks: `npm run lint`, `npm test` (53 files, 600 tests), `npm run test:e2e` (120 specs, including `tests/e2e/insights.spec.ts` at 1280 and 393 px), `npm run build`.

## Not verified by the agents

- A real microphone and speakers.
- The review script's steps 5 and 6 over real days of use. They were checked only with seeded histories and `?today=`.
- Export then Import between real profiles (step 7).
- `progress.json` on the iPhone, and Progress at phone width on a device (step 8). `npm run ios:sync` was not run (it needs Node 22).

## Known issues and deferred items

- The wrap-up part of Today's practice is not logged as a run. A day with only a wrap-up does not count as active (non-blocking PLAN-E17-T1-01, `comms/E17/turn-01/plan-review.md`).
- UI-E17-T1-01: the empty patterns card repeats its heading as a grey sub-line.
- UI-E17-T1-02: the empty-state card on Progress is thin and has no padding.
- UI-E17-T1-03: on the phone, Home's header buttons (Settings, Mic check, Progress) stack in a column and push content down by about 100 px. These three are in `comms/E17/turn-01/ui-review.md`.
- Time on a results screen counts for up to 2 minutes after the last touch.
- Lessons with only 2 or 3 notes get the positive line only, because the minimum is 4 voiced notes.
- Patterns' per-day check uses the scaled run-level minimums, and drift is counted per direction (`docs/epic-notes/E17.md`).
- The seeded e2e test uses "goal met this week, 3 days last week". The epic's "met last week with 3 days" can't happen at a 4-day goal.

## For the owner to decide

None. Neither review proposed requirement changes. You may want to say whether skipping the wrap-up as a run is intended, or whether it should count as an active day.
