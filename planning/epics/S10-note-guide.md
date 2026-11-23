# S10 — Spike: a note guide that shows whether you're above or below the note

## Goal

Finding the note in Sol–mi, and in the other early lessons, feels like trial and error. The owner put it this way: "there's no feedback … it's trial and error and that's frustrating."

The help the app gives today doesn't answer the one question a beginner has while singing: **am I too high or too low, and by how much?**

- **At Learn**, there is a live graph, the piano and a cents meter. The meter runs left to right and stops at ±100 cents. When the student is two or three notes off, the needle sits pinned at one edge and doesn't say which way to go in words. Three displays compete for attention.
- **At Practise**, nothing shows the student's voice while singing, so a student who is lost stays lost until the results.
- **In the single-note lessons (Unit A and Pitch finding)**, there is the graph and a "Sung: D4" label. A beginner has to compare two note names to work out the direction.

This spike adds one simple display, the **note guide**:

- the target note is drawn as a line with its name;
- the student's voice is a **dot above the line when they are higher and below it when they are lower**;
- one plain line of text says what to do, such as "Too low: go up".

## What you will review

- In Sol–mi at Learn, while you sing, a guide shows the note (for example "E4") as a line. Your dot sits above it when you're high and below it when you're low. When you're on it, the dot sits on the line, turns green, and the text says "On it".
- When you're far off, the dot moves near the edge, and the text says how far: "About 3 notes too low: go up".
- If you're singing the right note an octave off, it says so instead of sending you up or down a long way.
- At Practise, the guide stays hidden while you're on track. It fades in only if you've been off the note for a moment, to rescue you, and goes away at the next note.
- At Prove, nothing changes: there is still no live help.
- The single-note lessons (Find one note, Low/middle/high, Land right on it) and Pitch finding in Today's practice show the same guide while you sing.
- The old left-to-right cents meter is gone. The guide replaces it, so there is less to look at.

## Depends on

E17 (run order). It builds on:
- E05 live scoring and `CentsMeter`;
- E14 feedback levels and match lessons (`Lesson.tsx`, `MatchRun.tsx`);
- E15 Today's practice;
- S07 design tokens;
- S09 match countdown and "Found it — keep holding".

## Owner decisions (2026-11-23)

- **Levels:**
  - Learn shows the guide all the time while singing.
  - Practise shows it only as a rescue, after being off the note for a moment.
  - Prove shows nothing.
- **Lessons:** every melody lesson (Stage 1 Units B–D, Stage 2, Stage 3 songs), the single-note Unit A lessons, and Pitch finding in Today's practice.

## Scope

**In:**
- the guide component;
- its placement in `Lesson.tsx` and `MatchRun.tsx`;
- the Practise rescue rule;
- removing `CentsMeter` from the lesson screen;
- one new simulated singer for tests;
- a small results line at Practise.

**Out:**
- scoring, tolerances and pass rules;
- the pitch graph and piano, which stay as they are;
- warm-up glides;
- the Tuner dev screen, which may keep `CentsMeter`;
- any audio cue;
- Prove.

## Specification

### A. The guide's maths (`src/core/feedback/noteGuide.ts`, pure)

`guideState(cents: number | null, toleranceCents: number): GuideState`. Here `cents` is the sung pitch minus the target, in cents, from the same smoothed live value that feeds today's meter.

- **No voice** (`cents === null`): `{ kind: 'silent' }`. The text is "Sing to see your dot".
- **On it** (`|cents| ≤ toleranceCents`): `{ kind: 'on', cents }`. The text is "On it".
- **Octave off:**
  - This applies when the pitch is within the tolerance of the target ± 12 or ± 24 semitones, so `|cents| ≥ 1200 − tol` and the pitch class matches.
  - It returns `{ kind: 'octave', direction: 'up' | 'down' }`.
  - The text is "Right note, but an octave too low: try higher" (or "too high: try lower").
- **Close** (`tol < |cents| < 100`):
  - It returns `{ kind: 'near', direction, cents }`.
  - The text is "A little low: go up" or "A little high: come down", with the number "(−35 cents)".
- **Far** (`|cents| ≥ 100`, not an octave):
  - It returns `{ kind: 'far', direction, semitones }`, where `semitones = round(|cents| / 100)`.
  - The text is "About 3 notes too low: go up" or "About 2 notes too high: come down". One semitone reads "About 1 note too low: go up".
- **Words:** use "high/low" and "up/down", never "sharp/flat", which is jargon to a beginner. The cents number appears only in the near case.
- **Dot position:**
  - The guide returns `offset` in −1..1, where + means above. It is piecewise linear so that small errors are visible and large ones still fit:
    - |cents| from 0 to 100 maps to 0 to 0.45;
    - 100 to 700 cents maps to 0.45 to 0.95;
    - beyond 700 cents it is 0.95, at the edge, with an arrow.
  - For the octave case, the dot is drawn at the edge on the octave's side, with the octave text.
- **Hysteresis:** to stop flicker at the tolerance edge, the state enters "on" at `|cents| ≤ tol` and leaves it only at `|cents| > tol + 5`.

### B. The component (`src/ui/components/NoteGuide.tsx` + `.css`)

- It is a short box, about 120 px tall at 393 px wide.
  - A horizontal line across the middle represents the target, with the note name at the left ("E4").
  - A soft band around the line shows the tolerance.
  - One dot moves up and down, centred horizontally.
  - A text line sits under the box.
- It uses `data-testid="note-guide"`, with `data-state` set to the guide state's kind and `data-direction` set where one applies.
  - The dot is `note-guide-dot`, the text is `note-guide-text`, and the note name is `note-guide-note`.
- **Colours:** use the S07 tokens.
  - On it is the success token. Near is the accent, and far and octave are the warning token.
  - Colour is never the only signal: the text and the ▲/▼ markers next to the dot carry the meaning too.
  - It must work in dark mode.
- **Motion:** the dot eases between positions in about 80 ms (CSS transform). Respect `prefers-reduced-motion`.
- **When the target changes** (a new note), the line relabels at once, and the dot jumps without easing.
- **Silence:** when silent for more than 250 ms, hide the dot and show "Sing to see your dot". Don't keep the last position.
- **Accessibility:** the text is `aria-live="polite"`, updated at most once a second, and only when the kind or direction changes. The box has `role="img"` with an `aria-label` that matches the text.
- The note guide's own unit tests are `NoteGuide.test.tsx`.

### C. Where it shows

**Melody lessons (`Lesson.tsx`):**
- **Learn level:** during We do and You do, the guide shows the current target and the live cents. It sits between the status text and the graph.
  - It replaces `CentsMeter` on this screen. Remove the `CentsMeter` render here; the component can stay for the Tuner.
  - The "Target / Sung" note-name line stays.
  - During I do, it shows the target line and its name only, with no dot. This prepares the eye for the student's turn.
- **Practise level, You do only:**
  - The guide is hidden while the student is on track.
  - **Rescue:** it fades in (about 150 ms) when, within the current note, the student has been voiced and outside the tolerance for 1.0 s, or for 60% of that note's length if that is shorter (minimum 0.5 s).
  - Once shown, it stays for the rest of that note, then hides again at the next note.
  - Silence doesn't trigger it, because that is a mic or confidence problem, not a direction problem.
  - We do at Practise behaves as it does today: `helpLevel` is `learn` there, so the guide shows in full.
- **Prove:** the guide is never shown.
- **Results at Practise:** when the rescue appeared on any note, add one quiet line to the results: "The guide helped on 2 of 6 notes." (`data-testid="guide-helped"`).
  - This doesn't affect passing or the score.
  - It is logged as `guideHelped` (a count) on the E17 `RunRecord`, so later insights can use it. It is optional and absent on older runs.

**Single-note lessons and Pitch finding (`MatchRun.tsx`):**
- These have no levels, so the guide is shown in full while singing each target. It sits under the S09 status and countdown.
- When the student has found the note, the guide shows "On it" alongside S09's "✓ Found it — keep holding".
- While the piano plays, it shows the target line only.

**Layout:**
- The guide must fit at 393 px without pushing the Stop or Next button below the fold on a typical phone height (about 750 px).
- If space is tight at 393 px, shrink the pitch graph's height there, rather than the guide.

### D. Test singer (`src/audio/pitch/simSinger.ts`)

- Add `sharp300`: it sings every target 3 semitones high.
- Add `findLate`: it starts 2 semitones low and glides to the target over 1.5 s. It is for the Practise rescue test, and for "near" texts on the way in.
- Neither changes any existing mode.

## Tests

**Unit (`noteGuide.test.ts`):**
- silent;
- on it at 0 and at ±tol;
- the hysteresis at tol + 3 staying "on" after being on;
- near, low and high, with cents;
- far at 100, 300 and 700 cents, with the right semitone count and wording, including "1 note";
- the octave below and above at exactly ±1200, and at ±1200 ± tol;
- an "octave" for ±1150 when tol is 50;
- 1300 counts as far, not octave;
- the offset mapping at 0, 50, 100, 400, 700 and 1500, with sign kept.

**Component:** `NoteGuide.test.tsx` covers:
- the dot above, below and on;
- hidden when silent;
- the text matches;
- `aria-live` updates only on kind or direction change.

**Playwright (1280 and 393 px):**
- **Sol–mi at Learn:**
  - `sim=perfect` gives `note-guide` with `data-state="on"`, and the note name matches the target;
  - `sim=flat40` gives `near` with direction `up` and text containing "go up";
  - `sim=sharp300` gives `far`, direction `down`, and "About 3 notes too high";
  - `sim=octaveDown` gives `octave` and "an octave too low".
  - `cents-meter` is no longer on the lesson screen.
- **Sol–mi at Practise:**
  - `sim=perfect`: `note-guide` is never visible during You do;
  - `sim=flat70`: it appears during a note, the results show `guide-helped`, and the pass or fail is unchanged from today for the same singer;
  - `sim=silent`: it never appears.
- **Sol–mi at Prove:** no `note-guide` with any singer.
- **Find one note:** with `sim=sharp300`, the guide shows during singing with "too high". With `sim=perfect`, "On it" appears with "Found it".
- **Today's practice, Pitch finding:** the guide shows.
- **Phone width (393 × 750):** the guide and the Stop button are both in view during You do on Sol–mi at Learn.
- Update any spec that looked for `cents-meter` on lesson screens. All other specs pass.

## Review script

1. Open Sol–mi at Learn. Press "Next: We do" and sing a bit low on purpose: the dot sits under the line and the text says "go up". Slide up until it turns green and says "On it".
2. Sing much too high: the dot goes near the top and the text says about how many notes too high.
3. Sing the note an octave lower: it tells you it's the right note in the wrong octave.
4. Move to Practise. Sing well: no guide. Sing one note clearly off and hold it: after about a second, the guide fades in and shows which way to go, then hides at the next note. The results say "The guide helped on 1 of 2 notes".
5. At Prove: no guide.
6. Open "Find one note" and Pitch finding in Today's practice: the same guide, next to "Found it — keep holding".
7. On the phone: the guide is easy to read at arm's length, and the Stop button stays on screen.
