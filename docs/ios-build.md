# Building Train Me To Sing for your iPhone

The `ios/` folder is a ready Xcode project (Swift Package Manager, no CocoaPods needed). You need a Mac with Xcode, an Apple ID, and the iPhone with a cable.

## One-time setup

1. Install Xcode from the App Store and open it once so it finishes installing components. If it warns "CoreSimulator is out of date", let it install, or run `xcodebuild -runFirstLaunch`.
2. Xcode > Settings > Accounts > `+` > add your Apple ID. A free account works; the install expires after 7 days and you re-run it (see "Re-installing" below). TestFlight or longer installs need the paid Developer Program.
3. The bundle identifier is already set to `io.github.fletcherwerner.trainmetosing`, in `capacitor.config.ts` (`appId`) and in `ios/App/App.xcodeproj/project.pbxproj` (`PRODUCT_BUNDLE_IDENTIFIER`, Debug and Release). Keep the two equal. You only choose your signing team (below). If you ever change the id, change it in both places.
4. On the iPhone: Settings > Privacy & Security > Developer Mode > on (restart when asked).
5. Node 22 or newer is needed by Capacitor 8's command line (`npm run ios:sync` stops with "requires NodeJS >=22" on Node 20).

## Build and run

1. `npm install` — run this first: Capacitor is now on version 8 throughout and the app uses the `@capacitor/filesystem` and `@capacitor/app` plugins.
2. `npm run ios:sync` — builds the web app and copies it and the plugins into the iOS project.
3. `npm run ios:open` — opens the project in Xcode. Wait for "Resolving Package Dependencies" to finish.
4. In the left sidebar select **App** (blue icon) > target **App** > **Signing & Capabilities**.
5. Tick **Automatically manage signing** and choose your **Team** (your Apple ID).
6. Plug in the iPhone, unlock it, tap **Trust** if asked. Pick it in the device menu at the top of Xcode.
7. Press **Run** (the play button).
8. First launch fails with "Untrusted Developer": on the iPhone open Settings > General > VPN & Device Management > your Apple ID > **Trust**. Run again.

After any web change, repeat steps 2 and 7.

## Your progress file

In the iPhone app, your progress is also saved as a real file:

- **Files app > On My iPhone > Train Me To Sing > `progress.json`.** It is rewritten after every change (a lesson, a range test, a setting).
- **`backups` folder** next to it: one copy per day, `progress-YYYY-MM-DD.json`, the newest 14 kept.
- The app reads `progress.json` when it starts, so the file is the truth on the phone. To go back to an older state, copy a backup over `progress.json` (in Files) and reopen the app.
- If the file cannot be read, the app keeps the bad one as `progress-unreadable-YYYY-MM-DD.json`, uses its own copy, writes a new file, and tells you on Home.
- Settings shows where the file is and when it was last saved.
- The file includes this phone's timing delay. It is this device's own copy, not an export.

### What survives

- Quitting the app, restarting the phone, and **re-installing from Xcode over the top** (the 7-day re-install with a free account): everything is kept.
- **Deleting the app deletes this folder** and everything in it. To keep a copy, use Settings > Export, or copy `progress.json` somewhere else in Files.

### Re-installing every 7 days

With a free Apple ID the install stops opening after 7 days. Plug in the iPhone and press **Run** again in Xcode (do not delete the app first). Your progress is still there.

### Moving progress from the Home Screen web app

1. In the web app: Settings > Export progress, and save it to Files.
2. In the iPhone app: Settings > Import progress, choose that file, then Merge or Replace. `progress.json` updates straight away.

## Simulator check (no signing needed)

```
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

The agent sandbox refuses `xcodebuild`, so the agent has not run it. Run it once and expect `** BUILD SUCCEEDED **`. The deployment target is iOS 15.0.

## What to check on the device

- The mic prompt appears once; quit and relaunch, no second prompt.
- Tuner, range test, a Stage 1 lesson and a song, with wired headphones.
- Re-run calibration and compare with the PWA's value; note both in `docs/epic-notes/E12.md`.
- Phone call or Siri during a lesson: the app shows the paused message and recovers.
- Export via the share sheet; import via the file picker.
- The progress file steps above (Files app, backups, quit and reopen, re-install from Xcode).

## Audio session

`AppDelegate` sets `playAndRecord` with `measurement` mode and no options at launch, so the system does not apply voice processing to the mic. Use wired headphones; with the phone speaker the tone will be picked up by the mic.
