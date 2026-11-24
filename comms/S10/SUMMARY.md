# S10 — Spike: a note guide that shows whether you're above or below the note — Summary

**Approved:** 2026-11-23 · **Turns:** 2 · **Branch merged:** `epic/S10` into `main`

## What was accomplished

- A new **note guide** shows while you sing. The target note is a line with its name (for example "E4"). Your voice is a dot above the line when you are high and below it when you are low. A plain sentence says what to do.
- It turns green and says "On it" when you are on the note. It says "A little low: go up" (with cents) when close. It says "About 3 notes too high: come down" when far. It says "Right note, but an octave too low: try higher" when you are an octave off. When you are silent it says "Sing to see your dot".
- **Learn:** the guide is always shown while you sing. During "I do" it shows the line and name only.
- **Practise:** the guide is hidden while you're on track. It fades in only if you're off the note for about a second, and hides at the next note. The results add "The guide helped on N of M notes."
- **Prove:** nothing is shown.
- The single-note lessons (Unit A) and Pitch finding in Today's practice show the guide in full while you sing. They also show "On it" next to "Found it — keep holding".
- The old left-to-right cents meter is gone from the lesson screen. It stays on the Tuner dev screen.
- New simulated singers for tests: `sharp300` and `findLate`. `RunRecord` gains an optional `guideHelped` count.

## Changes made during review

- The octave-off dot and its ▲ marker were half cut off at the bottom of the guide on the phone. The dot's travel is now limited so it stays inside the box.
- Practise results said "Flat by 70 cents". They now say "A little low (70 cents)", matching the guide.
- Two test gaps were closed: a unit test for `findLate`, and one for the Practise rescue (it shows after the threshold, resets at the next note, and ignores silence).

## How to test it

1. Run `npm run dev` and open the app.
2. Open `/#/lesson/s1b-01?sim=perfect` (Sol–mi) at Learn and press "Next: We do". The guide shows "E4" or the target note, with the dot on the line, green, and "On it". No cents meter is on the screen.
3. Repeat with `sim=flat40`. The dot is below the line and the text says "go up".
4. Repeat with `sim=sharp300`. The text says "About 3 notes too high: come down". The dot is near the top.
5. Repeat with `sim=octaveDown`. The text says "Right note, but an octave too low: try higher". The dot is fully visible. Check this at 393 px width too.
6. At Practise, use `sim=perfect`. The guide never appears during You do. With `sim=flat70` it fades in during a note, and the results show "The guide helped on…" and "A little low (70 cents)". With `sim=silent` it never appears.
7. At Prove, no guide appears with any singer.
8. Open `/#/lesson/s1a-01?sim=sharp300` (Find one note). The guide says "too high". With `sim=perfect` it says "On it" next to "Found it".
9. Open `/#/?sim=perfect` and start Today's practice. Pitch finding shows the same guide.
10. At 393×750, the guide and the Stop button are both on screen during You do at Learn.
11. Automated checks: `npm run lint`, `npm test` (618 pass), `npm run test:e2e` (146 pass), `npm run build`.

## Not verified by the agents

- Singing into a real microphone (review script steps 1–3 and 7), and how readable the guide is at arm's length on an iPhone.
- The Practise fade-in and the dot easing in motion. Reviewers saw still frames only.
- Today's practice, Pitch finding, was not opened by the UI reviewer. Only the e2e specs cover it.
- `prefers-reduced-motion`.
- The turn 2 plan review did not rerun the e2e suite. It relied on the coder's 146 of 146.

## Known issues and deferred items

- On the laptop (1280×800) the guide is only about 45–60 px tall, not the 120 px in the epic. The coder did this on purpose to keep the pitch graph at 110 px or more. A 70-cent miss and a 300-cent miss therefore look alike apart from the text (UI-S10-T2-01, non-blocking; `comms/S10/turn-02/ui-review.md`).
- The guide's text updates only when the state or direction changes. The cents in the "near" text can lag the live value (`docs/epic-notes/S10.md`).
- The guide also shows "Sing to see your dot" when idle on a graded Learn step (`docs/epic-notes/S10.md`).
- The e2e suite had load-related timeouts on the first full run. They passed alone and on rerun (`comms/S10/turn-02/coder.md`).

## For the owner to decide

- Accept the short guide on the laptop, or ask for a taller one at the cost of a smaller pitch graph.
