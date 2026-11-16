# Building Train Me To Sing for your iPhone

The `ios/` folder is a ready Xcode project (Swift Package Manager, no CocoaPods needed). You need a Mac with Xcode, an Apple ID, and the iPhone with a cable.

## One-time setup

1. Install Xcode from the App Store and open it once so it finishes installing components.
2. Xcode > Settings > Accounts > `+` > add your Apple ID. A free account works; the install expires after 7 days and you re-run it. TestFlight or longer installs need the paid Developer Program.
3. Choose your bundle identifier, for example `com.<yourname>.trainmetosing`. Set it in two places and keep them equal:
   - `capacitor.config.ts`: `appId`
   - Xcode (step 6 below), which stores it in `ios/App/App.xcodeproj/project.pbxproj` (`PRODUCT_BUNDLE_IDENTIFIER`).
   The committed placeholder is `com.example.trainmetosing`; it will not sign for you.
4. On the iPhone: Settings > Privacy & Security > Developer Mode > on (restart when asked).

## Build and run

1. `npm install`
2. `npm run ios:sync` — builds the web app and copies it into the iOS project.
3. `npm run ios:open` — opens the project in Xcode. Wait for "Resolving Package Dependencies" to finish.
4. In the left sidebar select **App** (blue icon) > target **App** > **Signing & Capabilities**.
5. Tick **Automatically manage signing** and choose your **Team** (your Apple ID).
6. Change **Bundle Identifier** to yours.
7. Plug in the iPhone, unlock it, tap **Trust** if asked. Pick it in the device menu at the top of Xcode.
8. Press **Run** (the play button).
9. First launch fails with "Untrusted Developer": on the iPhone open Settings > General > VPN & Device Management > your Apple ID > **Trust**. Run again.

After any web change, repeat steps 2 and 8.

## Simulator check (no signing needed)

```
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

## What to check on the device

- The mic prompt appears once; quit and relaunch, no second prompt.
- Tuner, range test, a Stage 1 lesson and a song, with wired headphones.
- Re-run calibration and compare with the PWA's value; note both in `docs/epic-notes/E12.md`.
- Phone call or Siri during a lesson: the app shows the paused message and recovers.
- Export via the share sheet; import via the file picker. If either fails in the shell, add `@capacitor/share` / `@capacitor/filesystem`.

## Audio session

`AppDelegate` sets `playAndRecord` with `measurement` mode and no options at launch, so the system does not apply voice processing to the mic. Use wired headphones; with the phone speaker the tone will be picked up by the mic.
