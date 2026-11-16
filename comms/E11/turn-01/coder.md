# E11 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

MIDI import is built end to end: parse a `.mid`, pick a track, trim bars, set tempo, add it as a stage-3 imported lesson that appears under "My songs" on Home and runs through the normal Lesson screen. Delete removes the lesson and its progress. All four checks pass.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Core conversion | `src/core/exercise/fromMidi.ts` (+test) | `summariseTrack`, `toTemplate` per spec |
| Parsing | `src/content/midiFile.ts` | `@tonejs/midi`, ticks to beats via PPQ, first tempo and time signature, defaults 100 bpm / 4/4 |
| Source and store | `src/content/importedSource.ts`, `registry.ts`, `src/storage/store.ts` | zod-validated source; `addImportedLesson`, `removeImportedLesson` (drops progress) |
| UI | `src/ui/screens/ImportMidi.tsx/.css`, `Home.tsx/.css`, `routes.tsx` | `/import`, My songs, delete confirmation, import link |
| Fixtures | `tests/fixtures/*.mid`, `scripts/make-midi-fixture.mjs`, `npm run fixtures` | scale and melody+chords files |
| Tests | `src/content/importedSource.test.ts`, `tests/e2e/importMidi.spec.ts` | fixture offsets, registry, export/import round trip, e2e import/pass/delete, chord warning |
| Docs | `docs/epic-notes/E11.md`, `package.json` | adds `@tonejs/midi` |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (259 of 259) |
| `npm run test:e2e` | pass (31 of 31) |
| `npm run build` | pass |

## Response to findings

Turn 1: none.

## Not done

Nothing. Not run: iPhone Safari and a real nursery-rhyme MIDI file; only the generated fixtures were exercised.

## Assumptions and deviations

- Imported lessons show only under "My songs", not under Stage 3, and are excluded from the "Continue" card.
- Bar range is 1-based and inclusive, using the file's first time signature.
- Preview plays at the tempo field's value; pitches are original.
- `removeImportedLesson` removes the progress entry for that id.

## How to see it

`npm run dev`, then Home → "Import a MIDI file" (`/#/import`). Use `tests/fixtures/c-major-scale.mid` or `two-tracks.mid`.
