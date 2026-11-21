# S09 — Spike: let pitch-finding notes run their full length, then report

## Goal

In the single-note (match) lessons — Unit A, and the "Pitch finding" part of Today's practice — each target ends the moment the student has held the note for `holdSec` (1 s). The owner finds that abrupt: "it cuts the notes short if I am hitting it." A student who has just found the note wants to stay on it and settle.

Change it so every target runs for its full, fixed sing time whether or not the note is matched, with a visible countdown, and afterwards report how well the student matched it, not only whether they did.

The warm-up glides already run their full length and are not part of this spike.

## What you will review

- In a Unit A lesson or Pitch finding, after the piano plays, you sing for the full 8 seconds per note, as long as today's maximum. A bar shows the time left. Finding the note early doesn't end it; keep holding.
- After each note, a short line says how it went, for example "✓ Found in 1.2 s · on the note 85% of the rest · a little flat (−15 cents)" or "✗ Not found · mostly a semitone sharp".
- The results list shows the same per note, plus the overall "matched 5 of 6" and accuracy (S08).
- Passing and "matched" mean the same as before: the note was held for `holdSec` within the time, and (where landing counts) you started right on it.

## Depends on

S08 (run order, and its accuracy for match lessons). E14 match lessons (`src/ui/screens/MatchRun.tsx`, `src/core/scoring/matchScoring.ts`, `src/content/builtin/stage1.ts`), E15 Today's practice (Pitch finding part).

## Scope

In: the length of each target's sing time; the countdown; the per-target and results reports; the match accuracy definition from S08.
Out: the match/pass rule itself (`matchTarget`, `holdSec`, `landWithinSec`, pass marks); melody lessons; warm-up glides; Echo yourself's take (it still keeps the held stretch, as today).

## Specification

### A. Fixed sing time (`MatchRun.tsx`, `matchScoring.ts`)

- The sing time stays 8 s (`MATCH_WINDOW_SEC`, renamed `MATCH_SING_SEC`): long enough to find the note and then settle on it, which suits a warm-up. Each target now listens for exactly this long, then moves on. `runTarget` no longer breaks out of its loop when `matchTarget` reports matched or slid; it waits for the full time (Stop still ends it at once).
- `matchTarget` is called once at the end with `windowSec = MATCH_SING_SEC`; its result is the same as today's for the same singing. Lessons can override the time with an optional `singSec` on the lesson (none do yet).
- A thin countdown bar under the status (`data-testid="match-countdown"`, `role="progressbar"`) empties over the sing time. Status text: "Now sing it and hold the note." for the whole time; when matched, it may add "✓ Found it — keep holding" without ending the target.
- Simulated singers (`sim=perfect`, `silent`, …) behave the same; tests that waited for a quick end now wait the full time per target (8 s × targets). Use fewer targets in tests where the spec allows (Pitch finding uses 4).

### B. What "how well" means (`matchScoring.ts`, pure)

`describeMatch(frames, targetMidi, tol, outcome, singSec)` returns:

- `foundInSec`: `timeToMatchSec` when matched, else null.
- `onAfterFound`: share of the frames from `foundInSec` to the end that are within the tolerance (0..1); null when not found.
- `typicalCents`: the median cents off across all voiced frames from the first voiced frame to the end (sign: + sharp, − flat); null when silent. Wrong octave is folded to the nearest octave for this number only, and flagged.
- `accuracy`: S08's per-frame rule over the frames from the first voiced frame to the end of the sing time (replacing S08's "until matched" for match lessons). Silent before the first voice doesn't count against it; silence after does.

### C. Report text (`MatchRun.tsx`, `src/ui/describeReason.ts`)

- After each target (in the run list) and in the results list, one line per target:
  - matched: "✓ Found in 1.2 s · on the note 85% after that · a little flat (−15 cents)";
  - not matched: "✗ Not found · mostly a semitone sharp" (or the existing miss text: silent, wrong octave, slid).
- Cents wording: within ±10 "right on"; 10–30 "a little flat/sharp"; 30–60 "flat/sharp"; above 60 "far flat/sharp" or "about a semitone flat/sharp" near 100. Always with the number.
- Results keep "matched X of N" and the pass mark; add the overall accuracy from S08 next to it.
- Same lines inside Today's practice.

## Tests

- `matchScoring.test.ts`: `describeMatch` for dead on, slightly flat, found late, never found, silent, wrong octave (folded and flagged), slid; `matchTarget` outcomes are unchanged for the existing cases.
- Playwright (1280 and 393 px):
  - `sim=perfect` on a Unit A lesson: each target lasts about 8 s even though it matches early (the next "Listen…" doesn't appear before 7.5 s); the countdown shows; results show "Found in" lines and accuracy.
  - `sim=flat40`: lines say flat with the cents; matched or not per the lesson's tolerance, unchanged from today.
  - `sim=silent`: "Not found", 0 matched.
  - Today's practice Pitch finding runs 4 full-length targets.
- Update specs that relied on targets ending early. All other specs pass.

## Review script

1. Open "Find one note". Sing the first note right away and keep holding: it doesn't stop until the bar runs out.
2. The line under it says how fast you found it, how much of the rest you held, and whether you were flat or sharp.
3. Sing one note a bit flat on purpose: the line says "a little flat (−20 cents)" or similar.
4. Results list every note the same way, with "matched X of N" and your accuracy.
5. In Today's practice, Pitch finding behaves the same way.
