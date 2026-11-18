# S05 — Spike: open on Home, not the range test — Summary

**Approved:** 2026-11-17 · **Turns:** 1 · **Branch merged:** `epic/S05` into `main`

## What was accomplished

- The app now always opens on Home (`/`). It no longer forces the range test when no range is saved.
- With no range, Home shows "Your range: not set yet" and a "Get started" card. The card has a primary "Find my range" button (to `/range`) and an "Already have a profile? Load it in Settings" link (to `/settings`).
- Every lesson row, built-in and My songs, is shown but locked, with the status "Find your range first".
- Opening a lesson link with no range sends you to Home and keeps the query (for example `?sim=`).
- Saving the range test still returns to Home.

The work was built outside the loop. The coder checked it against the epic and found no gaps.

## Changes made during review

None. Both reviews approved in turn 1.

## How to test it

1. Run `npm run dev`. In Settings, reset (or use a private window), then reload `/`. Home opens with the Get started card, "not set yet" and locked lessons.
2. Tap "Load it in Settings", load a saved profile, then go Home. Your range and progress show, and lessons open.
3. Reset again, tap "Find my range" and finish the test. Home shows your range and the Continue card.
4. With no range, open a lesson link such as `/lesson/<id>` directly. You land on Home with the setup card.
5. Automated checks: `npm run lint`, `npm test` (285 pass), `npm run test:e2e` (50 pass), `npm run build`.

## Not verified by the agents

- Loading a saved profile in Settings, then Home with range and progress (step 2).
- Finishing the range test, which needs a microphone (step 3).
- The Settings reset button. The reviewer only checked a fresh load.
- Real iPhone rendering. The UI review used a 393×852 emulation.
- Button height of at least 44 px on the phone. It was judged by eye, not measured.

## Known issues and deferred items

None.

## For the owner to decide

None.
