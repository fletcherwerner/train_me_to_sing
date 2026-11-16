# S02 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The live graph, results graph and pure geometry module match the epic. Every listed test exists, and all four commands pass. One small deviation is noted: the You do frames are held in Lesson state, not with `youDoResult`.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 244 of 244 pass | Yes |
| `npm run test:e2e` | 29 of 29 pass | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| Geometry functions (bounds, timeToX, midiToY, targetSegments, sungSegments) | Yes | — |
| Live SVG graph, transform on a group, 8 s window, now line at 30% | Yes | — |
| Colours and thickness, out-of-range pinning with ▲/▼ markers | Yes | — |
| I do black only; phrase notes only | Yes | — |
| Reduced motion at 10 Hz | Yes | — |
| Size 160 px and 220 px, sticky Stop on phone, no side scroll | Yes | — |
| Results graph, axis capped at C2–C6, scrolls past 30 s | Yes | — |
| Keep frames with `youDoResult` (in memory) | Partial | PLAN-S02-T1-01 |
| `aria-hidden` | Yes | — |
| Unit, component, results and Playwright tests | Yes | — |

## Findings

### PLAN-S02-T1-01 — Frames kept in Lesson state, not with `youDoResult`

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/screens/Lesson.tsx:102`
- **Requirement:** `planning/epics/S02-pitch-graph.md`, Results graph: "keep the You do frames with the session's `youDoResult` (in memory only, not saved)".
- **Problem:** The frames live in separate component state. The behaviour is the same: they are in memory, not saved, and replaced on retry. The coder reported the deviation.
- **Change needed:** None required. If the frames should survive the Lesson component being remounted, move them into the session state later.

## Previous findings

None: turn 1.

## Questions for the owner

None
