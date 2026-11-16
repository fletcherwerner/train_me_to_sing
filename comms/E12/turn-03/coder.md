# E12 — Turn 3 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the one blocking finding: `ios/App/CapApp-SPM/Package.swift` now declares `.iOS(.v15)`, matching the pbxproj and Capacitor 8. `xcodebuild` is still unrun (the sandbox refuses it), so the owner must run it.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| SwiftPM platform | `ios/App/CapApp-SPM/Package.swift` | `.iOS(.v14)` -> `.iOS(.v15)`. No other "14" remains in `ios/` (checked by grep). |
| Docs | `docs/epic-notes/E12.md` | Notes the change and that Capacitor marks the file managed, so re-check after `cap sync`. |

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
| PLAN-E12-T2-01 | Fixed | Package.swift line 7 now `.iOS(.v15)`; grep found no other iOS 14 setting in `ios/`. |
| PLAN-E12-T1-01 | Deferred | Simulator build still needs the owner. Run the command in `docs/ios-build.md` and confirm `** BUILD SUCCEEDED **`. |
| PLAN-E12-T1-02 | Deferred | CLI 8 needs Node 22; not installed here. |
| PLAN-E12-T1-03 | Deferred | Waiting on the owner's bundle id. |

## Not done

- Simulator `xcodebuild` verification (sandbox).
- CLI 8 alignment (Node 22).
- Device checks (owner).

## Assumptions and deviations

- A later `cap sync` with CLI 7 may rewrite Package.swift back to v14, since the file is CLI-managed. I did not run `cap sync` this turn.

## How to see it

`docs/ios-build.md`.
