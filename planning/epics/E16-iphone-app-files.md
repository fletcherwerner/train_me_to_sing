# E16 — iPhone app with progress saved as a file

## Goal

Make the iOS app (E12) the owner's everyday way to practise, with their progress and performance kept as a real file on the iPhone that they can see, copy and back up.

Today the app stores everything in the web view's `localStorage` (`tmts.v1`, `src/storage/schema.ts`). On the iPhone that data is invisible, is lost if the app is deleted, and can only be saved by remembering to use Export. In the native app, the same data is now also written to `progress.json` in the app's Documents folder, which the Files app shows under **On My iPhone › Train Me To Sing**. The app reads it at launch, so the file is the source of truth on the phone, and a few dated backups guard against a bad write.

The web version (GitHub Pages, the Home Screen web app and the laptop) is unchanged.

The iOS project was last synced on 2026-11-15, before E14–S09, so this epic also brings the native build up to date.

## What you will review

- The app installed on your iPhone from Xcode, with today's lessons, Today's practice, accuracy and best scores.
- After singing a lesson, the Files app shows **On My iPhone › Train Me To Sing › progress.json**, updated a moment ago. Settings shows where it is and when it was last saved.
- Deleting nothing, quitting the app and reopening it keeps everything. Re-installing from Xcode over the top (as you must every 7 days with a free Apple account) keeps everything.
- Your progress from the Home Screen web app comes across with Export there and Import in the app.
- A `backups` folder next to `progress.json` holds one copy per day for the last 14 days.

## Depends on

S09 (run order). E12 Capacitor wrapper (`ios/`, `capacitor.config.ts`, `docs/ios-build.md`), E10 storage and export/import (`src/storage/schema.ts`, `store.ts`, `exportImport.ts`).

## Owner prerequisites

- **Bundle identifier.** The placeholder `com.example.trainmetosing` won't sign. The owner gives theirs in `comms/E16/OWNER-NOTES.md` before the run (for example `io.github.<github-user>.trainmetosing`). If none is given, the coder leaves the placeholder and the docs say where to change it.
- **Xcode components.** On 2026-11-22 a Simulator build succeeded but warned "CoreSimulator is out of date". Open Xcode once and let it install components, or run `xcodebuild -runFirstLaunch`.
- An Apple ID in Xcode (free is fine: installs expire after 7 days and are re-run), the iPhone with a cable, and Developer Mode on.
- The agents can't run `xcodebuild` (the sandbox refuses it, as in E12) or install to a device. The owner runs the Simulator build and the device install from `docs/ios-build.md`.

## Scope

In: saving and loading `progress.json` in the native app; daily backups; showing the file in the Files app; the Settings line; first-launch migration from `localStorage`; Capacitor version alignment and `cap sync`; the bundle id; `docs/ios-build.md`.
Out: the web and PWA storage (unchanged); iCloud sync or any server; attempt history (a later spike, which will be saved in this file automatically); Android; App Store or TestFlight; changes to lessons, scoring or audio.

## Specification

### A. Native build housekeeping

- Align Capacitor packages on one major version: `@capacitor/cli` to the same major as `@capacitor/core` and `@capacitor/ios` (8). Add `@capacitor/filesystem` and `@capacitor/app` at that major.
- Bundle id from `OWNER-NOTES.md` in both `capacitor.config.ts` (`appId`) and `PRODUCT_BUNDLE_IDENTIFIER` in `ios/App/App.xcodeproj/project.pbxproj` (Debug and Release). If none is given, keep the placeholder.
- Run `npm run ios:sync` so `ios/App/App/public` holds the current build, and commit the result.
- `ios/App/App/Info.plist`: `UIFileSharingEnabled` = YES and `LSSupportsOpeningDocumentsInPlace` = YES, so the Documents folder appears in the Files app. Keep the microphone text and portrait lock from E12.

### B. A file store behind an interface (`src/storage/fileStore.ts`)

- `interface FileStore { read(path): Promise<string | null>; write(path, text): Promise<void>; rename(from, to): Promise<void>; list(dir): Promise<string[]>; remove(path): Promise<void> }`. Paths are relative to the app's Documents folder.
- `capacitorFileStore` uses `@capacitor/filesystem` with `Directory.Documents` and UTF-8.
- `memoryFileStore` keeps files in a `Map`, for unit tests and for e2e (C).
- `getFileStore()`: `capacitorFileStore` when `Capacitor.isNativePlatform()`; `memoryFileStore` when the URL has `?filestore=memory` (dev and test builds only, never in production web builds); otherwise `null`, which means today's `localStorage`-only behaviour.

### C. Saving (`src/storage/fileSync.ts`, used by `store.ts`)

- `localStorage` stays the synchronous working copy, so `loadData`/`saveData` and the store don't change shape.
- After every successful `saveData` (the store's `commit`), when a file store exists, queue a write of the full `StoredData` as pretty-printed JSON (2-space indent) to `progress.json`:
  - write `progress.json.tmp`, then rename it over `progress.json`, so a crash never leaves half a file;
  - writes run one at a time; if several are queued, only the newest is written;
  - on success, record `lastFileSaveAt` in memory for Settings; on failure, set a `fileSaveFailed` flag (shown in Settings) and keep `localStorage` as is.
- Also flush the queue when the app goes to the background (`@capacitor/app` `appStateChange` with `isActive: false`).
- **Daily backup:** on the first successful file save of each local calendar day, also write `backups/progress-YYYY-MM-DD.json`. Keep the newest 14 and remove older ones.

### D. Loading at launch (`src/main.tsx` or the app's start-up)

Before the store is created, when a file store exists:

1. Read `progress.json`.
2. **File present and valid** (parses with `storedDataSchema`, so version 1 and 2 files migrate as usual): write it to `localStorage` with `saveData`, then start. The file wins, so a file replaced through the Files app is picked up on the next launch.
3. **File missing:** if `localStorage` has data, write it to `progress.json` now (first launch after this update, or after the file was deleted by hand). Otherwise start fresh.
4. **File present but invalid:** keep `localStorage` as the working copy, rename the bad file to `progress-unreadable-YYYY-MM-DD.json` (never delete it), write a fresh `progress.json` from `localStorage`, and show a one-time notice on Home: "Your progress file couldn't be read, so the app used its own copy. The unreadable file is kept in Files › Train Me To Sing."
5. Keep the start-up wait short: show the app after the read finishes or after 2 seconds, whichever is first (in the timeout case, use `localStorage` and let the file catch up on the next save).

The device's latency offset and calibration time are part of `StoredData` and go in the file too: the file is this device's own copy, not an export.

### E. Settings (`Settings.tsx`)

In the existing data section, only when a file store exists:

- "Saved on this iPhone in Files › On My iPhone › Train Me To Sing › progress.json" and "Last saved: 2:14 PM" (`data-testid="file-save-status"`), or "Couldn't save to the file. Your progress is still kept in the app." when `fileSaveFailed`.
- One line under it: "Deleting the app deletes this folder. To keep a copy elsewhere, use Export or copy the file in Files."
- Export and Import stay as they are (Import then saves to the file like any other change).

### F. Documentation (`docs/ios-build.md`)

Update for:
- the Capacitor version change and running `npm install` first;
- setting the bundle id (if not done in this epic);
- installing Xcode components (`xcodebuild -runFirstLaunch`);
- where the file is, the backups folder, what survives a re-install (everything) and what doesn't (deleting the app);
- moving progress from the Home Screen web app: Export there (share to Files), then Import in the app;
- the 7-day re-install with a free account, and that progress survives it.

## Tests

- `fileSync.test.ts` with `memoryFileStore`:
  - a commit writes `progress.json` via `.tmp` + rename; the content parses with `storedDataSchema`;
  - three quick commits produce at most two writes, the last with the newest data;
  - the first save of a day writes a dated backup, the second save that day doesn't; a 15th day removes the oldest;
  - a failing `write` sets `fileSaveFailed` and leaves `localStorage` alone.
- Start-up tests: valid file wins over different `localStorage`; missing file is created from `localStorage`; invalid file is renamed, a fresh file is written, and the notice flag is set; a version-1 file migrates; no file store means no file calls at all.
- Playwright (1280 and 393 px), web: everything passes unchanged, and Settings shows no file line.
- Playwright with `?filestore=memory&sim=perfect`: after a lesson, Settings shows "Last saved"; reload with a seeded memory file whose range differs, and Home shows the file's range.
- `npm run build` and `npm run ios:sync` succeed. The coder states that `xcodebuild` and the device install were not run and lists them for the owner.

## Review script

1. Follow `docs/ios-build.md`: `npm install`, `npm run ios:sync`, `npm run ios:open`, choose your team, run on the iPhone.
2. Grant the microphone once. Sing one lesson.
3. Open the Files app › On My iPhone › Train Me To Sing: `progress.json` is there, with a `backups` folder holding today's copy. Settings shows the same place and "Last saved".
4. Quit the app (swipe it away) and reopen: progress is still there.
5. In the Home Screen web app, Settings › Export, save to Files. In the iOS app, Settings › Import that file: your web progress appears, and `progress.json` updates.
6. Run again from Xcode (as after the 7-day expiry): progress is still there.
7. In Files, duplicate `progress.json` somewhere safe, then replace it with an older backup and reopen the app: it shows the older progress. Put the newer copy back and reopen.
8. The usual E12 checks still pass: no second mic prompt, a Stage 1 lesson and a song with headphones, a phone call or Siri pauses and recovers.
