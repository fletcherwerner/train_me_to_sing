# S02 — Spike: scrolling pitch graph

## Goal

Show singing as a picture over time. Above the piano, a graph has pitch on the vertical axis and time on the horizontal. Target notes stream in from the right as black horizontal lines, each at its note's height and as long as the note lasts. They move left past a fixed "now" line. As the student sings, their actual pitch is drawn in red. What has passed scrolls off to the left, showing black and red together. The results screen shows the whole attempt as one graph, so accuracy can be seen at a glance.

This replaces assumption 1 in `README.md` section 4 ("It is not a scrolling piano roll") for the lesson screen. The note chips, beat indicator and piano stay.

## What you will review

A lesson where you can see the upcoming notes coming, see your voice as a red line against the black target as you sing, and on the results screen see the whole attempt as black and red lines.

## Depends on

S01 (run order only), E06 lesson screen, E05 scoring and frame recording, E09 songs. Uses `ResolvedExercise` (`src/core/exercise/types.ts`), `recordFrames` (`src/audio/pitch/frameRecorder.ts`) and `useLiveAttempt` / `usePlaybackPosition` (`src/ui/hooks/`).

## Scope

In: a live pitch graph on the lesson screen in I do, We do and You do; a full-attempt graph on the results screen.
Out: changing scoring, the piano, the chips, the cents meter or the beat indicator; zoom or pinch; storing the frames in saved progress; graphs for past attempts on Home.

## Specification

### Geometry (pure, `src/core/exercise/pitchGraph.ts`)

All drawing maths lives here with no DOM, so it can be unit tested. Suggested functions:

- `graphPitchBounds(range, notes, margin = 2)`: the lowest and highest MIDI shown. It is the student's saved range, widened to include every target note, plus `margin` semitones above and below.
- `timeToX(tSec, nowSec, widthPx)` and `midiToY(midi, bounds, heightPx)`: `midiToY` is linear in MIDI, so fractional pitch (sharp or flat) sits between rows.
- `targetSegments(notes)`: one segment per `ResolvedNote`, from `startSec` to `startSec + durationSec` at `midi`.
- `sungSegments(frames, maxGapSec = 0.1)`: splits the sung frames into polylines. It breaks the line where `midi` is `null` (no voice) or where two frames are more than `maxGapSec` apart, so silence shows as a gap rather than a line drawn across it.

### Live graph (`src/ui/components/PitchGraph.tsx`)

- Drawn as SVG. The target lines and the sung line sit in a group that is moved with a `transform` each animation frame, so the frame loop does not rebuild the lines.
- **Time window:** 8 seconds wide. The "now" line is fixed at 30% from the left, so about 2.4 s of the past and 5.6 s of what's coming are visible.
- **Time base:** exercise time, where 0 is the first note. During the count-in, the first notes are already visible approaching from the right. The clock is the same one the playback uses, so the graph never drifts from the sound.
- **Pitch axis:** from `graphPitchBounds`. There is a faint line for every semitone, and rows for black keys are lightly shaded like a piano roll. Note names are labelled at each C and at the student's range low and high (for example `C3`, `A2`, `E4`).
- **Target:** black lines, 6 px thick, with square ends.
- **Sung:** red (`#d32f2f`) lines, 3 px thick, drawn on top of the black. Use the latency-corrected frames from `recordFrames`, so a perfect singer's red line lies on the black. Frames come at animation-frame rate; drawing every frame is fine.
- **Out-of-range singing (live):** pitch outside the axis is drawn pinned to the top or bottom edge, with a small ▲ or ▼ marker at the now line, so it never disappears.
- **Which steps show red:** I do shows only black, since the student is listening. We do and You do show black and red.
- **Phrases:** when a phrase is being practised (I do / We do), the graph shows only that phrase's notes.
- The graph has its own light background, so black and red read the same in dark mode.
- **Size:** full content width. Height is 160 px on a phone (393 px wide) and 220 px on a laptop. It sits directly above the piano. The page must not scroll sideways at 393 px. On the phone the lesson screen may now scroll vertically, but the Start/Stop button must stay visible while a run is in progress.
- Respect `prefers-reduced-motion`: keep the graph, but update it 10 times a second instead of every frame.

### Results graph

- The results screen shows the You do attempt as one static graph above the per-note list. The whole attempt is fitted to the width, with the same colours and axis labels. There is no "now" line and no scrolling.
- **Pitch axis on results:** widened to include all sung pitch (capped at C2–C6), so an octave error is visible as a red line an octave away rather than pinned to the edge.
- **Long songs:** if the attempt is longer than 30 s, the graph scrolls horizontally inside its own box, starting at the beginning. The page itself never scrolls sideways.
- **Keeping the frames:** keep the You do frames with the session's `youDoResult` (in memory only, not saved), so Results can draw them. Try again replaces them.

### Accessibility

- The graph is decorative for screen readers (`aria-hidden="true"`). The chips and per-note list already carry the information.
- Do not rely on colour alone: the target is thick and the sung line is thin, so the two can be told apart in greyscale.

## Tests

- `pitchGraph.ts`: the bounds include range and notes plus the margin; x and y mapping at the edges and the middle; fractional MIDI maps between rows; `sungSegments` splits on `null` frames and on time gaps; an empty frame list gives no segments.
- Component (Testing Library):
  - I do renders black target lines and no red line.
  - You do with frames renders a red path.
  - The number of black lines equals the number of notes in the shown phrase or exercise.
- Results: with frames from `sim=perfect`, every red point within a note's time lies within 50 cents of that note. With `sim=octaveDown`, the red line is 12 semitones below and inside the results axis (not pinned).
- Playwright, at 1280 and 393 px:
  - During You do with `sim=perfect`, the graph is visible above the piano and both black and red lines are present.
  - Results show the graph.
  - There is no horizontal page scroll.
  - The Stop button stays visible during a run on the phone.

## Review script

1. Open a Stage 1 lesson. In I do, press Play. Black lines slide in from the right during the count-in and pass the "now" line as each note plays. No red line appears.
2. In We do, sing along. A red line follows your voice; when you are on the note it sits on the black line. Go sharp or flat on purpose and watch the red line move off the black.
3. Stop singing for a moment. The red line has a gap rather than a straight line across the silence.
4. In You do, sing the exercise. On the results screen the whole attempt appears as black and red lines, matching the per-note results below.
5. Sing one note an octave low. On the results graph the red line is an octave below the black for that note.
6. Open a Stage 3 song (longer than 30 s). On the results screen the graph scrolls sideways inside its box; the page does not.
7. On the phone, run You do. The graph sits above the piano, nothing runs off the side, and Stop is visible.
