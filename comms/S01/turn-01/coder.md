# S01 — Turn 1 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Local profiles are built as specified: a dev-server file API, a client with debounced auto-save and safe switching, a Settings → Profiles section and the profile name on Home. All four checks pass. One deviation: the e2e dev server moved to port 5174 (see Assumptions).

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Profile format | `src/storage/profileFormat.ts` | zod schema from `StoredData` parts, name-to-id rules |
| File API | `scripts/profilesApi.ts`, `vite.config.ts` | Pure handler plus dev-only plugin (`apply: 'serve'`); atomic write, 1 MB limit, id check first |
| Client | `src/storage/profiles.ts`, `src/main.tsx` | API client, `isProfilesAvailable`, sync (create/load/auto-save), status store; loads via `importProgress` replace |
| UI | `ProfilesSection.tsx`, `ProfileNotices.tsx`, `Settings.tsx`, `Home.tsx`, `App.tsx` | Profiles section, Home link, non-blocking messages |
| Config | `.gitignore`, `playwright.config.ts`, `tests/e2e/profilesDir.ts` | `profiles/` ignored; e2e uses a temp folder |
| Tests | `scripts/profilesApi.test.ts`, `src/storage/profiles.test.ts`, `tests/e2e/profiles.spec.ts` | API, id rules, switching, debounce, e2e Ana/Ben |
| Notes | `docs/epic-notes/S01.md` | |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (224 of 224) |
| `npm run test:e2e` | pass (27 of 27) |
| `npm run build` | pass |

## Response to findings

Turn 1: no earlier findings.

## Not done

Nothing.

## Assumptions and deviations

- The e2e dev server now uses port 5174 with `TMTS_PROFILES_DIR` set. A first e2e run reused a hand-started dev server on 5173 and wrote `ana.json`/`ben.json` into the real `profiles/`; I deleted those two files and moved the port so it cannot recur.
- Vitest also includes `scripts/**/*.test.ts` so the API tests run under `npm test`.
- "Profile 'x' was not found" uses the stored id, since the name lives in the missing file.
- Names are reduced to ASCII for ids ("Zoë" gives `zo`); a name with no usable character is rejected.
- If the current profile cannot be saved, switching is refused with the save-failed message rather than overwriting unsaved data.
- "Fresh" profiles have no imported lessons.
- Home links to Settings (the Profiles section is its first block) rather than an anchor.
- `isProfilesAvailable` also requires the answer to be a JSON array, because `vite preview` or a static host can answer 200 with HTML.

## How to see it

`npm run dev`, then Settings → Profiles; follow the epic's review script.
