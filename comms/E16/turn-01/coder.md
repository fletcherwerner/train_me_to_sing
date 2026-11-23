# E16 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

The native app now mirrors all stored progress to `progress.json` in Documents (temp file plus rename, newest write wins, one dated backup per day, 14 kept) and reads it at launch before the store exists. Settings shows the file line, and Home shows a notice for an unreadable file. `npm run ios:sync` could not run: the Capacitor 8 CLI needs Node 22 and this machine has Node 20. `xcodebuild` and the device install were not run.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| File store | `src/storage/fileStore.ts` | `FileStore`, `capacitorFileStore`, `createMemoryFileStore`, `getFileStore()`. The memory store only works in dev builds with `?filestore=memory`. It persists in sessionStorage so a reload keeps it. |
| Saving | `src/storage/fileSync.ts`, `store.ts` | `.tmp` plus rename, collapsed queue, `useFileStatus`, daily backups. |
| Launch | `src/storage/launch.ts`, `src/main.tsx`, `notices.ts`, `Home.tsx` | The file wins when valid. A missing file is created from localStorage. An invalid file is renamed and replaced, and a notice is set. 2 s cap. Background flush on native. |
| Settings | `Settings.tsx` | `file-save-status` line and the deletion warning, shown only with a file store. |
| Native | `package.json`, `capacitor.config.ts`, `project.pbxproj`, `Info.plist`, `CapApp-SPM/Package.swift` | CLI, `@capacitor/filesystem` and `@capacitor/app` at ^8. Bundle id `io.github.fletcherwerner.trainmetosing` (config plus Debug and Release). File sharing keys. Package.swift edited by hand. |
| Docs | `docs/ios-build.md`, `docs/epic-notes/E16.md` | Rewritten for the file, backups, re-install, web-to-app move and the bundle id. |
| Tests | `fileSync.test.ts`, `launch.test.ts`, `tests/e2e/fileStore.spec.ts` | Unit tests cover everything the epic lists. E2e runs at 1280 and 393 px. |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass (no output) |
| `npm test` | pass (489 of 489) |
| `npm run test:e2e` | pass (104 of 104) |
| `npm run build` | pass |

## Response to findings

None: turn 1.

## Not done

- `npm run ios:sync` did not run. Capacitor CLI 8 stops with "requires NodeJS >=22". Instead I ran `npm run build` and hand-edited the tracked `CapApp-SPM/Package.swift` to add the two plugins. `ios/App/App/public` and `capacitor.config.json` are git-ignored, so there is nothing to commit for them.
- `xcodebuild`, the Simulator build and the device install were not run (the sandbox refuses them). The owner runs these from `docs/ios-build.md`, on Node 22 for `ios:sync`.
- Not verified on a device: that the Capacitor iOS `rename` replaces an existing file. `capacitorFileStore.rename` removes the target and retries if the first attempt fails.

## Assumptions and deviations

- Backups: the first successful save of a local day checks `backups/` and writes that day's copy only if it is missing. This means a relaunch the same day does not write a second one. A backup failure never marks the save as failed.
- `main.tsx` loads `App` and the profile sync by dynamic import after `launch()`, so the store is created after the file is applied.
- The 2-second timeout path ignores a late file result, so it cannot overwrite localStorage after the app has started.
- Settings shows "Not saved to the file yet in this session." before the first save, an addition the epic does not specify.
- The e2e "after a lesson" test seeds an already-Prove lesson so the run is short.

## How to see it

`npm run dev`, then open `https://localhost:5173/#/settings?filestore=memory`. Change the delay and "Last saved" appears. In the browser console, `sessionStorage['tmts.memfs']` holds `progress.json` and `backups/...`. The real check is the device, per the review script.
