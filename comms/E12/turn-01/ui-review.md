# E12 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 0

## Summary

E12 wraps the existing web app in a Capacitor iOS shell and changes no web screen. The only new visuals are the app icon and the launch screen. Both reuse the E10 icon on its navy background, are legible and are centred. I did not capture web screenshots because the web UI is unchanged.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| App icon (1024 px) | n/a | OK | `screenshots/app-icon.png` |
| Launch screen image | n/a | OK | `screenshots/launch-screen.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-21 | Yes (web UI unchanged) | — |
| UR-25 | Yes (no change to web error messages; the mic permission text is set in Info.plist as the epic specifies) | — |
| UR-26 | Yes (no change to web behaviour; the service worker is skipped only in the native shell) | — |
| UR-27 | Yes (the launch screen is a single dark navy design with no text) | — |

## Findings

None.

## Previous findings

Turn 1: none.

## Not verified

The steps below need an iPhone, Xcode and a real microphone, so they remain for the owner. The coder also could not run `xcodebuild`.

- Installing via `docs/ios-build.md` and launching from the icon (review script steps 1 and 2).
- The single mic prompt and no prompt on relaunch.
- Tuner, range test, lesson and song with wired headphones.
- Calibration compared with the PWA.
- Phone call or Siri interruption, then the paused message and recovery.
- Share-sheet export and file-picker import.
- Portrait lock, and the icon and launch screen on the device (only the source images were viewed).
- The app uses the placeholder bundle id `com.example.trainmetosing`; the owner must set their own.

## Proposed requirement changes

None.
