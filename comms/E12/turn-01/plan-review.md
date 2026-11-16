# E12 — Turn 1 — Plan Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

The Capacitor shell matches the spec on config, Info.plist, AppDelegate audio session, portrait lock, service-worker guard, scripts and docs. The web suites pass. The listed `xcodebuild` Simulator test was never run. The project also has a likely iOS version mismatch that this test would have caught.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | pass (259/259) | Yes |
| `npm run test:e2e` | pass (31/31) | Yes |
| `npm run build` | pass | Yes |

I did not run `npm run ios:sync`. I did not run `xcodebuild` either.

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| Add core/cli/ios | Partial | PLAN-E12-T1-02 |
| `capacitor.config.ts` (appName, webDir; appId placeholder) | Yes | — |
| `ios/` committed (hand-extracted template instead of `cap add`) | Yes | — |
| Scripts `ios:sync`, `ios:open` | Yes | — |
| SW skipped when native | Yes | — |
| `NSMicrophoneUsageDescription` text | Yes | — |
| Audio session playAndRecord/measurement, no options, in AppDelegate | Yes | — |
| Portrait lock; icon and launch screen | Yes | — |
| `docs/ios-build.md` | Yes | — |
| Test: web suites pass | Yes | — |
| Test: `ios:sync` completes | Yes (per report) | — |
| Test: `xcodebuild` Simulator succeeds | No | PLAN-E12-T1-01 |
| On-device verification | Owner step | — |

## Findings

### PLAN-E12-T1-01 — Simulator build not verified; deployment target likely too low

- **Severity:** Blocking
- **Status:** Open
- **Where:** `ios/App/CapApp-SPM/Package.swift:8`, `ios/App/App.xcodeproj/project.pbxproj:233,284,301`
- **Requirement:** `planning/epics/E12-capacitor-ios.md`, Tests: "`xcodebuild` for the iOS Simulator succeeds (no signing needed)."
- **Problem:** The test was not run. The project sets the iOS 14 deployment target while pinning `capacitor-swift-pm` 8.6.2. Capacitor 8 most likely requires iOS 15 or later, so SwiftPM resolution may fail. I could not confirm this here.
- **Change needed:** Run `xcodebuild -project ios/App/App.xcodeproj -scheme App -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` and fix any errors. This includes raising the deployment target to the minimum Capacitor 8 supports. If the sandbox blocks it again, say so and tell the owner to run it. Record the exact command and result in `docs/ios-build.md`. Then the owner can clear this item.

### PLAN-E12-T1-02 — `@capacitor/cli` major version differs from core/ios

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `package.json:20-22`
- **Requirement:** `planning/epics/E12-capacitor-ios.md`, Setup (add the three packages).
- **Problem:** The CLI is 7.6.10 while core and ios are 8.6.2. Mixed majors can give wrong sync output. The coder's CLI-bug workaround may be related.
- **Change needed:** Align `@capacitor/cli` to `^8.6.2` and re-run `ios:sync`. Re-check that the SPM template is unchanged.

### PLAN-E12-T1-03 — Bundle id is a placeholder

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `capacitor.config.ts:5`
- **Requirement:** Epic Owner prerequisites: appId from the owner.
- **Problem:** The owner has not supplied one, and the placeholder is documented.
- **Change needed:** None until the owner supplies it.

## Previous findings

None (turn 1).

## Questions for the owner

Please supply your bundle id. You will also need to run the Simulator `xcodebuild` if the agent sandbox keeps refusing it.
