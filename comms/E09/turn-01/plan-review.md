# E09 — Turn 1 — Plan Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 0

## Summary

The five Stage 3 songs match the catalog exactly (notes, lyrics, tempo, tolerance). Phrases, `slicePhrase`, the now-singing line, the phrase selector (I do and We do only), the three-row self-scrolling strip and the results grouped by line are all implemented. All four checks pass and every listed test exists.

## Checks run

| Command | Result | Matches coder report? |
|---------|--------|-----------------------|
| `npm run lint` | pass | Yes |
| `npm test` | 197 of 197 pass | Yes |
| `npm run test:e2e` | 22 of 22 pass | Yes |
| `npm run build` | pass | Yes |

## Specification coverage

| Item | Met? | Finding |
|------|------|---------|
| stage3.ts: five songs, lyrics, tolerances t3/t3/t3/t4/t4 | Yes | — |
| Note data unaltered | Yes | — |
| NowSinging line (current bold, previous 1 and next 2 lighter) | Yes | — |
| `phrases?` on ExerciseTemplate; phrases per song | Yes | — |
| Phrase selector in I do and We do; pure `slicePhrase` | Yes | — |
| You do and results use the whole song | Yes | — |
| Strip auto-scrolls, max three rows | Yes | — |
| Results grouped by phrase label | Yes | — |
| 4-click lead-in unchanged for phrases | Yes (playExercise untouched) | — |
| Range handling (existing "doesn't fit") | Yes | — |
| Tests: lyric count, beats 16/32/32/48/32, slicePhrase, phrase coverage, Playwright sim=perfect | Yes | — |

## Findings

None.

## Previous findings

None.

## Questions for the owner

None. The melodies still need a listen by ear, as the epic says. The iPhone fit also needs a device check.
