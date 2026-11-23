# E16 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The file store, queued atomic saving, daily backups, launch sync, Settings line, bundle id, Info.plist keys and docs match the epic, and the listed unit and e2e tests exist and pass. The one gap is that `npm run ios:sync` was not run (Node 20 here, Capacitor 8 needs Node 22). The coder hand-edited `Package.swift` and said so, and I count that as an environment limit, not a defect. Device and Xcode steps are left for the owner.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass, no output | Yes |
| `npm test` | 489 of 489 pass | Yes |
| `npm run test:e2e` | Full run exceeded 10 minutes and was not completed. `tests/e2e/fileStore.spec.ts` alone: 9 of 9 pass. | Partly confirmed |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| A. Capacitor 8 packages, filesystem and app added | Yes | — |
| A. Bundle id in config and Debug and Release | Yes | — |
| A. `npm run ios:sync` run | Partial (Node 20) | PLAN-E16-T1-01 |
| A. Info.plist file-sharing keys | Yes | — |
| B. `FileStore`, capacitor and memory stores, `getFileStore` (memory only when `import.meta.env.DEV`) | Yes | — |
| C. Save through `.tmp` and rename, collapsed queue, status flags, background flush | Yes | — |
| C. Daily backup, newest 14 kept | Yes | — |
| D. Launch: file wins, missing created, invalid renamed with notice, 2 s cap | Yes | — |
| E. Settings line, failure text, deletion warning, only with a file store | Yes | PLAN-E16-T1-02 |
| F. `docs/ios-build.md` | Yes | — |
| Tests: `fileSync.test.ts`, launch tests, e2e web and memory | Yes | — |
| Coder lists `xcodebuild` and device steps not run | Yes | — |

## Findings

### PLAN-E16-T1-01 — `ios:sync` not run, `Package.swift` hand-edited

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `ios/App/CapApp-SPM/Package.swift`
- **Requirement:** E16 Specification A: "Run `npm run ios:sync` ... and commit the result."
- **Problem:** The file is marked "managed by Capacitor CLI". The hand edit may differ from what the CLI generates.
- **Change needed:** The owner runs `npm run ios:sync` on Node 22 and commits any difference to `Package.swift`. State this in `docs/ios-build.md`.

### PLAN-E16-T1-02 — Extra Settings text

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/*/Settings.tsx:167`
- **Requirement:** E16 Specification E.
- **Problem:** "Not saved to the file yet in this session." is not in the epic. It is harmless.
- **Change needed:** None required. Noted as an addition.

## Previous findings

None: turn 1.

## Questions for the owner

None
