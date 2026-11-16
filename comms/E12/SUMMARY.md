# E12 — Capacitor iOS wrapper — Summary

**Approved:** 2026-11-15 · **Turns:** 3 · **Branch merged:** `epic/E12` into `main`

## What was accomplished

- The web app is now wrapped as a native iOS project (Capacitor 8) in the `ios/` folder. You can open it in Xcode and install it on your iPhone as "Train Me To Sing".
- The iOS project asks for the microphone with the text "The microphone is used to hear your singing and show which note you are hitting. Audio never leaves your device."
- At launch the app sets the audio session to play-and-record in measurement mode, with no extra options. This stops the system's voice processing from distorting pitch.
- The app is locked to portrait. The app icon and launch screen are generated from the E10 icon (`npm run icons`).
- The service worker is not registered inside the native shell.
- New npm scripts: `npm run ios:sync` (build, then sync to iOS) and `npm run ios:open` (open Xcode).
- `docs/ios-build.md` has the step-by-step install guide.
- The web app's behaviour is unchanged.

## Changes made during review

- Turn 1: the iOS Simulator build had not been run, and the deployment target was iOS 14, which is too low for Capacitor 8. Turn 2 raised the target to iOS 15.0 in the Xcode project.
- Turn 2: `ios/App/CapApp-SPM/Package.swift` still said iOS 14, which would likely break the Swift package build. Turn 3 changed it to iOS 15.

## How to test it

1. Run the automated checks from the repo root: `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`. All should pass. The plan reviewer saw them pass in turn 1 (259 unit tests, 31 e2e tests).
2. Set your own bundle id in `capacitor.config.ts` (the placeholder is `com.example.trainmetosing`) and in Xcode.
3. Run the Simulator build with the `xcodebuild` command in `docs/ios-build.md`. It should end with `** BUILD SUCCEEDED **`. No signing is needed.
4. Run `npm run ios:sync`. It should finish with no errors. Check that `ios/App/CapApp-SPM/Package.swift` still says `.iOS(.v15)`.
5. Run `npm run ios:open`. Follow `docs/ios-build.md` to choose your team, plug in the phone, trust the developer certificate and run.
6. Launch from the app icon. Grant the microphone once. Quit and relaunch. There should be no second prompt.
7. With wired headphones, run the tuner, the range test, one Stage 1 lesson and one song. Tones, metronome and pitch detection should all work.
8. Run calibration and compare the value with the PWA's.
9. Take a phone call or trigger Siri during a lesson. Afterwards the app should show the paused message and recover.
10. Export progress through the share sheet. Import a file through the file picker.

## Not verified by the agents

- The `xcodebuild` Simulator build. The sandbox refused it for the coder and for the reviewer.
- Installing on an iPhone through `docs/ios-build.md`.
- The single microphone prompt, and no prompt on relaunch.
- Tuner, range test, lesson and song with wired headphones, covering tone playback, metronome and pitch frames.
- Calibration compared with the PWA. No latency or dropout measurements exist.
- Phone call or Siri interruption, the paused message and recovery.
- Share-sheet export and file-picker import.
- Portrait lock, and the icon and launch screen on the device.

## Known issues and deferred items

- The bundle id is a placeholder (`com.example.trainmetosing`). See `docs/epic-notes/E12.md`.
- `cap add ios` was not run. The CLI mishandles the SPM option and CocoaPods is not installed here. The `ios/` project was built from the CLI's own SPM template by hand (`docs/epic-notes/E12.md`).
- `@capacitor/cli` is still on 7.6.10, while core and ios are 8.6.2. CLI 8 needs Node 22 and this machine has Node 20. After installing Node 22, align the CLI to `^8.6.2`, re-run `npm run ios:sync` and check the template is unchanged.
- Capacitor marks `Package.swift` as managed, so a `cap sync` may rewrite it. Re-check that it says iOS 15.
- `@capacitor/filesystem` and `@capacitor/share` were not added. Add them only if the web export and import fail in the shell.
- If WKWebView audio proves inadequate, record the measurements in the epic notes and propose a follow-up epic with a native `PitchSource` and `TonePlayer` plugin.

## For the owner to decide

- Supply your bundle id.
- Run the Simulator `xcodebuild` command from `docs/ios-build.md` and confirm it succeeds.
- Re-check `Package.swift` after any `cap sync`, since the CLI may rewrite it.
