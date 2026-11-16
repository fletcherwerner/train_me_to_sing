# E12 — Turn 2 — Plan Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 2 · **Non-blocking open:** 0

## Summary

The pbxproj deployment target is now 15.0. `ios/App/CapApp-SPM/Package.swift:7` still says `.iOS(.v14)`. That mismatch will likely fail the SwiftPM build against Capacitor 8. The Simulator build is still unverified, because the sandbox refuses `xcodebuild` for me too.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | not re-run; turn 2 changed only the pbxproj and docs | n/a |
| `npm test` | not re-run; same reason | n/a |
| `npm run test:e2e` | not re-run; same reason | n/a |
| `npm run build` | not re-run; same reason | n/a |
| `xcodebuild` Simulator | refused by sandbox | n/a |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| Everything except the Simulator build | Yes (turn 1) | — |
| `xcodebuild` Simulator succeeds | Unverified | PLAN-E12-T2-01 |

## Findings

### PLAN-E12-T2-01 — Package.swift platform still iOS 14

- **Severity:** Blocking
- **Status:** Open
- **Where:** `ios/App/CapApp-SPM/Package.swift:7`
- **Requirement:** `planning/epics/E12-capacitor-ios.md`, Tests: "`xcodebuild` for the iOS Simulator succeeds."
- **Problem:** The local package declares `platforms: [.iOS(.v14)]` but depends on `capacitor-swift-pm` 8.x, which requires iOS 15. SwiftPM rejects a package whose platform is lower than a dependency's.
- **Change needed:** Change line 7 to `.iOS(.v15)` and check that nothing else says 14.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| PLAN-E12-T1-01 | Open | The pbxproj target is 15.0, but the build is still unrun (the sandbox blocks me as well). See PLAN-E12-T2-01. The owner must run the `docs/ios-build.md` command and confirm `** BUILD SUCCEEDED **`. |
| PLAN-E12-T1-02 | Withdrawn | CLI 8 needs Node 22. The deferral is valid and documented. Align once Node 22 is installed. |
| PLAN-E12-T1-03 | Withdrawn | Waiting on the owner's bundle id. Not a code defect. |

## Questions for the owner

Please run the Simulator `xcodebuild` command from `docs/ios-build.md` once the Package.swift fix lands. Please also supply your bundle id.
