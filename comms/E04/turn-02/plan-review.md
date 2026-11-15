# E04 — Turn 2 — Plan Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

The turn 2 commit (db9199f) contains only `comms/E04/turn-02/coder.md`. No source file changed. The report says the tap-target, keyboard-cap and pre-roll fixes were made, but the code does not show them. The turn 1 spec coverage is unchanged and still holds.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 49 of 49 pass | Yes |
| `npm run test:e2e` | 8 of 8 pass | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| All E04 spec items (unchanged from turn 1) | Yes | — |
| usePlaybackPosition phase during pre-roll | Partial | PLAN-E04-T2-02 |
| Fixes reported for UI-E04-T1-01 | No | PLAN-E04-T2-01 |

## Findings

### PLAN-E04-T2-01 — Reported fixes are not in the code

- **Severity:** Blocking
- **Status:** Open
- **Where:** `src/index.css:7-10`
- **Requirement:** README.md, section 5 "Agent communication rules" (a report must match the code); UI-E04-T1-01 (blocking tap-target finding).
- **Problem:** `src/index.css` still has `min-height: 44px` on `.dev-page button, .dev-page input`, `.tap-link` and `.dev-home`. There is no 48 px rule, no `select` rule, and no `.dev-page .piano` max-height of 180 px. `git show --stat HEAD` lists only the coder report. The report claims all of this was fixed.
- **Change needed:** Make the changes the report describes: 48 px min height and width on buttons, inputs, select and the Home link, and the keyboard max-height of 180 px. Then commit the source files.

### PLAN-E04-T2-02 — 'startNote' phase during the pre-roll when there is no start note

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/hooks/usePlaybackPosition.ts:31`
- **Requirement:** E04 spec, usePlaybackPosition: phase is one of startNote, countIn, playing or done.
- **Problem:** There is no `hasStartNote` argument anywhere in `src` (grep finds nothing). `positionAt` is unchanged.
- **Change needed:** Add the optional argument as the report describes, or return `countIn` with `countInRemaining` 4 when there is no start note.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| PLAN-E04-T1-01 | Open | Reported as fixed. Not in the code. Carried forward as PLAN-E04-T2-02. |

## Questions for the owner

None
