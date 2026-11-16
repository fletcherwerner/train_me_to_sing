# S02 — Spike: scrolling pitch graph — Summary

**Approved:** 2026-11-15 · **Turns:** 1 · **Branch merged:** `epic/S02` into `main`

## What was accomplished

- The lesson screen now has a scrolling pitch graph directly above the piano in I do, We do and You do. Pitch is vertical and time is horizontal, over an 8 second window with a fixed "now" line at 30% from the left.
- Target notes stream in from the right as thick black lines. They are already visible during the count-in.
- In We do and You do your voice is drawn as a thin red line on top. Silence leaves a gap, not a line across it. I do shows black only.
- When practising a phrase, only that phrase's notes are shown.
- Singing outside the graph's range is pinned to the top or bottom edge with a ▲ or ▼ marker at the now line.
- The graph has a light background, so it reads the same in dark mode. It is hidden from screen readers.
- With reduced motion on, the graph updates 10 times a second.
- The results screen shows the whole You do attempt as a static black and red graph above the per-note list. Its pitch axis is widened (capped at C2–C6), so an octave error shows as a red line an octave away. Attempts over 30 s scroll sideways inside the graph box only.
- On phones (under 700 px wide) the controls row sticks to the bottom, so Start/Stop stays visible during a run.

## Changes made during review

None. Both reviews approved in turn 1.

## How to test it

1. Run `npm run dev` and open a Stage 1 lesson. To try it without a microphone, add `?sim=perfect` after the `#/…` route. The app uses hash routing, so the query goes inside the hash. Other options are `sim=octaveDown` and `sim=const:60`.
2. In I do, press Play. Black lines slide in from the right during the count-in and pass the "now" line as each note plays. No red line appears.
3. In We do, sing along (or use `sim=perfect`). A red line follows your voice and sits on the black line when you are on the note. Go sharp or flat and it moves off the black.
4. Stop singing briefly. The red line has a gap.
5. In You do, sing the exercise. The results screen shows the whole attempt as black and red lines, matching the per-note results below.
6. Try `sim=octaveDown`. A ▼ marker shows at the now line while running. On the results the red line sits an octave below the black.
7. Open a Stage 3 song (longer than 30 s) and finish You do. The results graph scrolls sideways inside its box, and the page does not.
8. On a 393 px wide screen, run You do. The graph sits above the piano, nothing runs off the side, and Stop stays visible.
9. Automated checks: `npm run lint`, `npm test` (244 pass), `npm run test:e2e` (29 pass, including `pitchGraph.spec.ts` at 1280 and 393 px), `npm run build`.

## Not verified by the agents

- Steps 3, 4 and 6 with a real voice: going sharp or flat on purpose, the gap when you pause, and one note sung low. Only `sim=perfect` and `sim=octaveDown` were used.
- Step 7: the Stage 3 song results scrolling was not exercised.
- Reduced-motion behaviour.
- Dark mode appearance of the graph and its labels.
- A real iPhone, a real microphone and speakers. Whether the graph feels in sync with the sound can only be judged by ear.

## Known issues and deferred items

- PLAN-S02-T1-01 (non-blocking): the You do frames are kept in `Lesson` component state, not with the session's `youDoResult`. Behaviour is the same (in memory, replaced on retry), but they would not survive the Lesson screen being remounted. See `comms/S02/turn-01/plan-review.md` and `docs/epic-notes/S02.md`.
- UI-S02-T1-01 (non-blocking): the graph has no legend saying black is the target and red is you. See `comms/S02/turn-01/ui-review.md`.
- UI-S02-T1-02 (non-blocking): dark mode was not captured. See `comms/S02/turn-01/ui-review.md`.
- ▲/▼ markers show only when the latest frame (under 0.15 s old) is outside the axis. Results axis labels sit in a fixed column left of the scrolling box (`docs/epic-notes/S02.md`).

## For the owner to decide

- Reword UR-01, which says "There is no scrolling piano roll". This epic deliberately adds a scrolling pitch graph above the piano. The reviewer suggests: "The piano is the main key visualization; a pitch graph above it shows the notes over time." Or retire the "no scrolling" clause. Only the owner edits `planning/ui-requirements.md`.
