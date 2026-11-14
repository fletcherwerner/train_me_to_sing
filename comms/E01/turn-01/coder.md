# E01 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Scaffolded the Vite React TS project and built `core/music/notes`, `audioEngine`, `tonePlayer`, the SVG `PianoKeyboard` and the `/dev/piano` page with tests. All four checks pass. Sound was not checked by ear (no audio device); the pitch maths is unit tested.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Setup | package.json, tsconfig.json, vite.config.ts, eslint.config.js, playwright.config.ts, index.html | strict, basicSsl, base './', core import-restriction rule, folder layout with .gitkeep |
| Music core | src/core/music/notes.ts + test | all six functions |
| Audio | src/audio/audioEngine.ts, tonePlayer.ts | triangle + sine octave up at 0.3, 10 ms attack, 60 ms release, stopAll |
| UI | src/ui/components/PianoKeyboard.tsx/.css + test, src/ui/screens/Home.tsx, dev/PianoDev.tsx, src/app/* | HashRouter routes / and /dev/piano |
| E2E | tests/e2e/piano.spec.ts | smoke test |
| Notes | docs/epic-notes/E01.md | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (13 of 13) |
| `npm run test:e2e` | pass (1 of 1) |
| `npm run build` | pass |

## Not done

Nothing.

## Assumptions and deviations

- Added dev deps jsdom and @testing-library/react + jest-dom for the render test; vite 6 and @vitejs/plugin-react are the build tooling.
- Sung key colouring: when the sung key equals the target it carries only the sung-match class (it also gets the target class); the arrow uses the same match/off colours.
- Piano is 24 SVG units per white key, so it scales with container width.

## How to see it

`npm run dev`, open `https://localhost:5173/#/dev/piano`.
