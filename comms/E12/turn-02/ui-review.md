# E12 — Turn 2 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 0

## Summary

Turn 2 raises the iOS deployment target to 15.0 and updates docs. No web screen, icon or launch screen changed since turn 1, so I captured no new screenshots. The turn 1 approval still stands.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| No visible change this turn | n/a | n/a | `comms/E12/turn-01/screenshots/` (unchanged) |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-21 | Yes (web UI unchanged) | — |
| UR-25 | Yes (no change) | — |
| UR-26 | Yes (no change) | — |
| UR-27 | Yes (no change) | — |

## Findings

None.

## Previous findings

Turn 1: none.

## Not verified

These need an iPhone, Xcode and a real microphone, so they remain for the owner:

- Install via `docs/ios-build.md`, the single mic prompt, and no prompt on relaunch.
- Tuner, range test, lesson and song with wired headphones.
- Calibration compared with the PWA.
- Phone call or Siri interruption, then the paused message and recovery.
- Share-sheet export and file-picker import.
- Portrait lock, and the icon and launch screen on the device.
- The `xcodebuild` Simulator build, which the coder could not run.
- The placeholder bundle id `com.example.trainmetosing`, which the owner must replace.

## Proposed requirement changes

None.
