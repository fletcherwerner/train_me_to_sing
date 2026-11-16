# E13 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The work meets sections A to D of the epic. The audio engine helpers, stall detector, mic-lost and mic-missing handling, piano tolerance, layout, shared styles and storage-failure notice are all present and covered by tests. One item, D2 (untracking `tsconfig.tsbuildinfo`), is not done. The coder could not run `git rm --cached` in this environment, so the owner needs to run it.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 276 of 276 pass | Yes |
| `npm run test:e2e` | 47 of 47 pass | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| A1 `ensureAudioRunning`, `watchAudioClock`, `createStallDetector`, clock-rule comment, `__tmtsTest` only with `sim=` | Yes | — |
| A2 range, lesson, calibrate and dev pages use the recovery path, with the fixed wording | Yes | — |
| A3 `onLost`, `ended` listener, error mapping, Reconnect button | Yes | — |
| B1 to B5 layout, results order, piano `matchCents`, label sizes, legend | Yes (tests pass) | — |
| C1 to C5 shared styles, Home, Settings, Import MIDI. No old class names remain in `src`. | Yes | — |
| D1 `saveData` returns a boolean, and the store sets a save-failed flag and shows a notice | Yes | — |
| D2 untrack `tsconfig.tsbuildinfo` | Partial | PLAN-E13-T1-01 |
| Listed unit and e2e tests | Yes | — |
| `docs/epic-notes/E13.md` | Yes | — |

## Findings

### PLAN-E13-T1-01 — tsconfig.tsbuildinfo is still tracked

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `tsconfig.tsbuildinfo` (shown by `git ls-files`)
- **Requirement:** `planning/epics/E13-hardening-polish.md`, D2: "Stop tracking `tsconfig.tsbuildinfo` (`git rm --cached`)".
- **Problem:** The `.gitignore` entry was added, but the file is still tracked. The coder says its environment refused the git command. The agent hooks may block this as well, so I am not blocking on something the coder cannot fix.
- **Change needed:** The owner runs `git rm --cached tsconfig.tsbuildinfo` and commits.

## Previous findings

None (turn 1).

## Questions for the owner

Please run `git rm --cached tsconfig.tsbuildinfo` (D2). Agents are not allowed to run it.
