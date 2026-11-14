# E12 — Capacitor iOS wrapper

## Goal

Package the existing web app as a native iOS app that can be installed on the iPhone from Xcode.

## What you will review

"Train Me To Sing" installed as a real app on your iPhone, with the same behaviour as the PWA and a single microphone permission prompt.

## Depends on

E10. Do this epic only if the PWA shows limits worth removing (repeated mic prompts, audio interruptions, wanting TestFlight).

## Owner prerequisites

- A Mac with Xcode installed.
- An Apple ID added to Xcode. A free account works for personal installs that expire after 7 days; the paid Apple Developer Program is needed for TestFlight or longer-lived installs.
- A bundle identifier, e.g. `com.<yourname>.trainmetosing`.

The builder cannot complete signing or device install without the owner. The builder prepares the project and written steps; the owner runs the final build to the device.

## Scope

In: Capacitor project, iOS permissions and audio session, build scripts, instructions.
Out: App Store submission, Android, rewriting audio natively.

## Specification

### Setup

- Add `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`.
- `capacitor.config.ts`: `appId` from the owner, `appName: 'Train Me To Sing'`, `webDir: 'dist'`.
- `npx cap add ios`. Commit the `ios/` folder.
- npm scripts: `ios:sync` (`npm run build && npx cap sync ios`), `ios:open` (`npx cap open ios`).
- The service worker must not register inside the native shell: skip registration when `Capacitor.isNativePlatform()`.

### iOS configuration

- `Info.plist`: `NSMicrophoneUsageDescription` = "The microphone is used to hear your singing and show which note you are hitting. Audio never leaves your device."
- Audio session: category `playAndRecord`, mode `measurement`, options `allowBluetoothA2DP` and `defaultToSpeaker` off (headphones are expected). Set this in `AppDelegate` at launch. `measurement` mode disables the system's voice processing, which otherwise distorts pitch.
- Lock orientation to portrait. App icon and launch screen from the E10 icon.

### Verification inside the shell

- `getUserMedia` works in WKWebView (iOS 14.3+). Confirm the mic prompt appears once and is remembered.
- Confirm all three audio paths: tone playback, metronome, mic pitch frames.
- Re-run calibration; native latency may differ from Safari.
- Export uses the share sheet; import uses the file picker. Add `@capacitor/filesystem` and `@capacitor/share` only if the web APIs fail in the shell.

### If WKWebView audio is inadequate

Do not rewrite. Record measurements (latency, dropouts, pitch stability) in the epic notes and propose a follow-up epic that implements `PitchSource` and `TonePlayer` as a native plugin. The interfaces from E01/E02 exist so that this swap touches no UI or core code.

### Documentation

`docs/ios-build.md`: step-by-step for the owner — open Xcode, choose team, plug in the phone, trust the developer certificate on the device, run.

## Tests

- Web test suites still pass; the Capacitor additions do not change web behaviour.
- `npm run ios:sync` completes without errors.
- `xcodebuild` for the iOS Simulator succeeds (no signing needed).

## Review script

1. Follow `docs/ios-build.md` to install on the iPhone.
2. Launch from the app icon. Grant the mic once. Quit and relaunch — no second prompt.
3. Run the tuner, the range test, one Stage 1 lesson and one song with wired headphones.
4. Run calibration and compare the value with the PWA's.
5. Take a phone call or trigger Siri during a lesson; afterwards the app shows the paused message and recovers.
6. Export progress via the share sheet; import a file.
