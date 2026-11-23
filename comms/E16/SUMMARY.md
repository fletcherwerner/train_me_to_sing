# E16 — iPhone app with progress saved as a file — Summary

**Approved:** 2026-11-22 · **Turns:** 1 · **Branch merged:** `epic/E16` into `main`

## What was accomplished

- In the iOS app, all progress is now also written to `progress.json` in the app's Documents folder. Files shows it under On My iPhone › Train Me To Sing.
- Each save goes to a temporary file and is then renamed over `progress.json`, so a crash cannot leave half a file. Quick successive saves are collapsed into the newest one. The app also saves when it goes to the background.
- One backup per day is written to `backups/progress-YYYY-MM-DD.json`. The newest 14 are kept.
- At launch the app reads `progress.json` before anything else, waiting at most 2 seconds.
  - A valid file wins over the app's own copy, so a file you replace in Files is picked up on the next launch.
  - A missing file is created from the app's own copy.
  - An unreadable file is renamed to `progress-unreadable-<date>.json` and never deleted. A fresh file is written, and Home shows a one-time notice.
- Settings shows where the file is and "Last saved: <time>". If saving fails it says so, and your progress stays in the app. It also warns that deleting the app deletes the folder. This appears only when a file store exists, so the web version looks and behaves as before.
- Build housekeeping:
  - Capacitor CLI is now version 8, matching the other packages. `@capacitor/filesystem` and `@capacitor/app` are added.
  - The bundle id is `io.github.fletcherwerner.trainmetosing` in the config and in Debug and Release.
  - `Info.plist` enables file sharing so the folder shows in Files.
  - `docs/ios-build.md` is rewritten for all of this.
- For testing in a browser, `?filestore=memory` (dev builds only) uses an in-memory stand-in for the file.

## Changes made during review

None. Approved in turn 1.

## How to test it

Automated checks (from the repo root):

1. `npm run lint`, `npm test` (489 tests), `npm run build`. Expect all to pass.
2. `npm run test:e2e` (104 tests at 1280 and 393 px). The coder reports it passing. The plan reviewer's full run exceeded 10 minutes, so only `tests/e2e/fileStore.spec.ts` (9 of 9) was confirmed independently.

Browser check of the stand-in:

3. Run `npm run dev` and open `https://localhost:5173/#/settings?filestore=memory`. Change a setting such as the delay. "Last saved: <time>" appears in Settings.
4. In the browser console, `sessionStorage['tmts.memfs']` holds `progress.json` and `backups/...`.
5. Open Settings without the query option, as the web version. No file line is shown.

On the iPhone (review script, per `docs/ios-build.md`):

6. Use Node 22. Run `npm install`, `npm run ios:sync`, `npm run ios:open`. In Xcode choose your signing team and run on the iPhone. Run `xcodebuild -runFirstLaunch` first if Xcode warns that CoreSimulator is out of date.
7. Grant the microphone once and sing one lesson.
8. In Files › On My iPhone › Train Me To Sing, expect `progress.json` updated just now and a `backups` folder with today's copy. Settings shows the same place and "Last saved".
9. Swipe the app away and reopen it. Progress is still there.
10. In the Home Screen web app, use Settings › Export and save to Files. In the iOS app, use Settings › Import on that file. Your web progress appears and `progress.json` updates.
11. Run again from Xcode over the top. Progress is still there.
12. In Files, copy `progress.json` somewhere safe, then replace it with an older backup and reopen the app. It shows the older progress. Put the newer copy back and reopen.
13. Repeat the E12 checks: no second mic prompt, a Stage 1 lesson and a song with headphones, and a phone call or Siri pauses and recovers.

## Not verified by the agents

- `xcodebuild`, the Simulator build and the device install were not run, because the sandbox refuses them.
- Review script steps 1–8 all need an iPhone: the Files listing, the `backups` folder, quit and reopen, re-install over the top, web Export then app Import, replacing the file with an older backup, and the E12 checks.
- That Capacitor's iOS `rename` replaces an existing file. The code removes the target and retries if the first rename fails, but this is untested on a device.
- That the Settings wording "Files › On My iPhone › Train Me To Sing" matches what Files shows.
- Dark mode for the new text was not captured.
- `npm run ios:sync` did not run (see below).

## Known issues and deferred items

- `npm run ios:sync` was not run: Capacitor CLI 8 needs Node 22 and the machine has Node 20. The coder hand-edited `ios/App/CapApp-SPM/Package.swift` to add the two plugins. Run `npm run ios:sync` on Node 22 and check `git diff ios/App/CapApp-SPM/Package.swift` is empty or trivial. Commit any difference. (PLAN-E16-T1-01, non-blocking; `docs/epic-notes/E16.md`)
- Settings shows an extra line, "Not saved to the file yet in this session.", before the first save. It is not in the epic and is harmless. (PLAN-E16-T1-02)
- `main.tsx` now loads the app by dynamic import after launch. The web start-up gains one tick.
- If the 2-second wait runs out, a late file result is ignored. The file catches up on the next save.
- A backup failure never marks a save as failed. A relaunch on the same day does not write a second backup.

## For the owner to decide

None. There is no `FOR-OWNER.md`, and both reviews list no questions or requirement changes.
