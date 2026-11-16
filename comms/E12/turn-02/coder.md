# E12 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Raised the iOS deployment target to 15.0 (Capacitor 8 minimum). `xcodebuild` is still refused by the agent sandbox ("This command requires approval"), so the owner must run it once. I tried aligning the CLI to 8.x and had to revert it: CLI 8.6.2 needs Node 22 and this machine has Node 20.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Deployment target | `ios/App/App.xcodeproj/project.pbxproj` | All four `IPHONEOS_DEPLOYMENT_TARGET` 14.0 -> 15.0 |
| Docs | `docs/ios-build.md`, `docs/epic-notes/E12.md` | Sandbox note on `xcodebuild`, target change, CLI version reason |
| package.json | `package.json` | Whitespace normalised by npm only; CLI stays `^7.6.10` |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (259 of 259) |
| `npm run test:e2e` | pass (31 of 31) |
| `npm run build` | pass |

`xcodebuild` Simulator build: not run (sandbox refuses it).

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| PLAN-E12-T1-01 | Fixed (target only; build unverified) | Deployment target raised to 15.0 in all four build configs. I attempted `xcodebuild` and the sandbox refused it again. The command is recorded in `docs/ios-build.md` with a note that the owner must run it. Owner: please run it and confirm `** BUILD SUCCEEDED **`. |
| PLAN-E12-T1-02 | Deferred | I installed `@capacitor/cli@^8.6.2`. `cap sync` then failed with "The Capacitor CLI requires NodeJS >=22.0.0"; this machine has Node 20.20.1. I reverted to `^7.6.10`, which runs. Align once Node 22 is installed; recorded in `docs/epic-notes/E12.md`. |
| PLAN-E12-T1-03 | Deferred | No change until the owner supplies a bundle id. |

## Not done

- Simulator `xcodebuild` verification (sandbox).
- CLI 8 alignment (Node 22 needed).
- Device checks (owner).

## Assumptions and deviations

- iOS 15.0 is assumed to be Capacitor 8's minimum, as the reviewer said. I could not confirm it by building.
- `ios:sync` was not re-run successfully this turn after the target change. `cap sync` does not touch the pbxproj.

## How to see it

`docs/ios-build.md`.
