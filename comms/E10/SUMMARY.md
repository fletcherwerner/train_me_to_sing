# E10 — PWA install, hosting, export/import — Summary

**Approved:** 2026-11-15 · **Turns:** 1 · **Branch merged:** `epic/E10` into `main`

## What was accomplished

- The app can now be installed as a PWA. It has a manifest ("Train Me To Sing" / "Sing", standalone, portrait), icons (192, 512 and maskable 512) and an iOS home-screen icon and meta tags. A service worker precaches the whole build so the app loads offline after the first visit.
- When a new version is available, a small "Update ready — reload" banner appears.
- A GitHub Actions workflow deploys to GitHub Pages on each push to `main`. It runs install, lint, unit tests, build, then deploy. Hosting under a sub-path works through the relative `base` and `HashRouter`.
- Settings has a new section, "Move progress between devices":
  - **Export progress** saves `train-me-to-sing-YYYY-MM-DD.json`. It uses the share sheet when the device offers one, and a download otherwise.
  - **Import progress** validates the file and shows a summary, then asks Replace, Merge or Cancel. A bad file gives a plain error and changes nothing.
  - Merge keeps `passed` if either side passed, the higher best score, summed attempts and the later last attempt. It also keeps lessons the device does not know about. The phone's timing calibration is never imported.
- iPhone polish: safe-area insets, no double-tap zoom or text selection on controls, a screen wake lock during a run, and a "Paused — tap to restart" message if the app is backgrounded mid-run.
- A bug found while building: the service worker never registered because registration waited for a `load` event that had already fired. This is fixed.

## Changes made during review

None. Both reviews approved in turn 1.

## How to test it

1. Setup: `npm install`, then `npm run build`.
2. Run the automated checks:
   - `npm run lint` passes.
   - `npm test` passes (207 tests at review).
   - `npm run test:e2e` passes (26 tests at review). It includes loading the built app, going offline and reloading, and export and import.
   - `npm run build` passes and `dist/` contains `manifest.webmanifest` and `sw.js`.
3. Local check: run `npm run preview` and open `http://localhost:4173`. Home works as in dev.
4. Open `/#/settings`. You should see "Move progress between devices" with Export progress and Import progress.
5. Click Export progress. A file named `train-me-to-sing-<date>.json` downloads and "Export downloaded." shows.
6. Import a text file that is not an export. You should see a red error saying nothing was changed.
7. Import the exported file in a fresh browser profile. A summary such as "Range …, N lessons passed" shows with Replace, Merge and Cancel. Choose Merge and "Merged" shows. Home shows the passed lessons.
8. Hosted check (needs the repo on GitHub with Pages enabled, source set to GitHub Actions): push to `main` and wait for the workflow. Open the Pages URL on the laptop. It should behave like dev.
9. iPhone: open the URL in Safari, then Share → Add to Home Screen. Launch from the icon. It should open full-screen with no browser bars.
10. Turn on Airplane Mode and relaunch. The app should load, and a lesson should work.
11. On the laptop, export. AirDrop the file to the phone. On the phone, import it and choose Merge. Home shows the laptop's passed lessons, and the phone's calibration value is unchanged.
12. Lock the phone mid-lesson and unlock. You should see "Paused — tap to restart", and a restart should work cleanly.
13. During a song, the screen should not dim or lock.

## Not verified by the agents

- Steps 8–10: the hosted HTTPS URL, Add to Home Screen, full-screen launch and icon, and offline launch in Airplane Mode on a real phone.
- Step 11: the AirDrop or share sheet (only the download path was exercised), and importing on the phone while checking that calibration is unchanged.
- Steps 12–13: the paused message after locking, and the wake lock. These are covered by code only, not by e2e.
- The "Update ready — reload" banner never appeared during review.
- Safe-area insets on a notched phone.
- Dark mode on Settings.
- Microphone permission in standalone mode. On iOS the prompt may reappear on each launch of the home-screen app. Please record what happens; the epic asks for this in the notes.
- The GitHub Pages workflow has never run: the coder had no push access.

## Known issues and deferred items

- PLAN-E10-T1-01 (non-blocking): sub-path hosting (`/<repo-name>/`) is not tested. The offline test serves from the root. Confirm it on the first Pages deploy.
- UI-E10-T1-01 (non-blocking): Replace is the first of three similar grey buttons and has no confirmation, so a mis-tap could overwrite the device's progress.
- UI-E10-T1-02 (non-blocking): the import summary is plain text with no box. It is not scrolled into view on the phone, and it does not say how many lessons were attempted.
- The offline e2e test serves over plain `http://localhost:4173`, because a self-signed certificate blocks service worker registration in Chromium. The dev server still uses basic-ssl.
- Coder's notes: `docs/epic-notes/E10.md`. Reviews: `comms/E10/turn-01/`.

## For the owner to decide

- Confirm the static host. The default is GitHub Pages, and the repo must be pushed to GitHub with Pages enabled.
- Whether to fix UI-E10-T1-01 (the Replace button) before relying on the phone import.
- No proposed requirement changes came from the reviews, and there is no `FOR-OWNER.md`.
