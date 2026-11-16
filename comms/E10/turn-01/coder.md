# E10 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

PWA, hosting workflow, export/import and iOS polish are implemented and committed. This turn also fixed two real bugs that kept the offline test failing: the service worker was never registered, and the preview server's self-signed cert blocked registration. Nothing could be verified on a real iPhone or on GitHub Pages.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| PWA | `vite.config.ts`, `public/icons/*`, `scripts/*`, `index.html`, `src/app/registerServiceWorker.ts`, `src/ui/components/UpdateBanner.*`, `src/app/App.tsx` | Manifest, icons, precache, update banner. |
| Hosting | `.github/workflows/deploy.yml` | Lint, test, build, deploy to Pages on push to `main`. |
| Export/import | `src/storage/exportImport.ts`, `src/storage/store.ts`, `src/ui/screens/Settings.tsx` | Merge/Replace with summary; latency never imported. |
| iOS polish | `src/index.css`, `src/ui/hooks/useWakeLock.ts`, `src/ui/screens/Lesson.tsx` | Safe areas, wake lock, pause on background. |
| Tests | `src/storage/exportImport.test.ts`, `tests/e2e/exportImport.spec.ts`, `tests/e2e/offline.spec.ts`, `playwright.config.ts` | Preview server added as a second Playwright web server. |
| Fixes | `registerServiceWorker.ts`, `vite.config.ts` | Register when `load` already fired; no basic-ssl for `vite preview`. |
| Notes | `docs/epic-notes/E10.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass (0 errors) |
| `npm test` | pass (207 of 207) |
| `npm run test:e2e` | pass (26 of 26) |
| `npm run build` | pass |

## Response to findings

N/A — turn 1.

## Not done

Nothing in scope is missing from the code. Not verified on device: install to home screen, Airplane Mode, AirDrop import, wake lock, background pause, standalone mic permission behaviour (recorded as unverified in the epic notes). GitHub Pages deployment needs the repo pushed and Pages enabled by the owner.

## Assumptions and deviations

- The offline e2e test serves the build over http on `localhost:4173` (a secure context) because Chromium refuses service workers behind the self-signed dev cert. The dev server is unchanged.
- Owner notes: `Plan:` and `Harness:` commits ignored as instructed.

## How to see it

- `npm run build && npm run preview`, open `http://localhost:4173`; Settings has Export and Import.
- `dist/manifest.webmanifest` and `dist/sw.js` after build.
