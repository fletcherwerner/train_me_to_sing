# S08 — Spike: accuracy percentage and best score per lesson — Summary

**Approved:** 2026-11-22 · **Turns:** 1 · **Branch merged:** `epic/S08` into `main`

## What was accomplished

- Every scored attempt now gets an **accuracy** percentage. It measures how close your pitch stayed to each note. Within 10 cents counts as full marks. It falls to zero at a semitone off. Silence counts as zero. Every note weighs the same.
- The lesson screen shows "Best accuracy: n%", or "No best yet". On step screens the line sits under the title.
- Results show "Accuracy: n% — New best!" (with "was n%" when there was an old best), or "Accuracy: n% · Best: m%". Each note chip shows "✓ hit · 94%". Match lessons show the same.
- The notes line now reads "2 of 2 notes hit · pass mark 80%". Pass and fail are unchanged.
- Home shows "Passed · 91%" or "Best 74%". Older data with no best accuracy shows "Passed" or "Started".
- The best accuracy is stored per lesson. It carries through export/import and profiles, and the higher value wins on a merge.

## Changes made during review

None. Both reviews approved in turn 1. The plan review had to be re-run first because the network was down.

## How to test it

1. Run `npm run dev`. Clear the app's saved progress, or use a fresh browser profile.
2. Open `/#/lesson/s1b-04?sim=perfect`. The lesson shows "No best yet".
3. Run You do. Results show "Accuracy: 98–100% — New best!" and per-note "✓ hit · n%".
4. Reopen the lesson. It shows "Best accuracy:" with that number. Home shows "Passed · n%".
5. Open `/#/lesson/s1b-04?sim=flat40`, which sings 40 cents flat, and run it. Accuracy is below 80% and the notes still count as hit. Results show "Best: n%" with the earlier number, and the lesson screen is unchanged.
6. Open a match lesson, for example `/#/lesson/s1a-02?sim=perfect`. Results show an accuracy and the best updates.
7. Export your data, import it in another browser or profile, and check that the best accuracy is still there.
8. Automated: `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`. The plan review reported 466 of 466 unit tests and 94 of 94 e2e tests passing, and lint and build clean.

## Not verified by the agents

- Real singing with a microphone. Only the simulated singer was used.
- Dark mode.
- Export and import on another browser (review script step 5).
- Today's practice was not captured on screen.
- Long exercises on an iPhone. The chips grow wider with the percentage.

## Known issues and deferred items

- PLAN-S08-T1-01: `accuracyOf` has no `opts` parameter. The scoop-allowance constant is duplicated from `evaluate.ts`, so the two could drift (`comms/S08/turn-01/plan-review.md`).
- PLAN-S08-T1-02: the simulated "perfect" singer scores 98–100%, not exactly 100%, because it reads one frame early. The e2e test accepts that range (plan review).
- UI-S08-T1-01: the best-accuracy line is about 11 px and sits close to the title on step and results screens (`comms/S08/turn-01/ui-review.md`).
- "New best" compares whole percents, so equal-looking numbers read "Accuracy: 87% · Best: 87%" (`docs/epic-notes/S08.md`).

## For the owner to decide

None.
