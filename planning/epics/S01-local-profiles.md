# S01 — Spike: local profiles

## Goal

Let more than one person use the app on this laptop, each with their own saved range and passed lessons. A profile is a text file in the repository folder, so it can be read, backed up, and copied by hand. This is a short-term, local-only solution; it is not cloud sync.

## What you will review

On the laptop (`npm run dev`): create two profiles, pass a lesson in one, switch to the other and see a fresh start, switch back and see the passed lesson and saved range again. Each profile is a readable JSON file under `profiles/`.

## Depends on

E10, for `replaceData` and the export format in `src/storage/exportImport.ts` and `importProgress` in `src/storage/store.ts`. Reuse them; do not write a second copy of that logic.

## Scope

In: a profile file format, a dev-server file API, create / load / auto-save in the app, a Profiles section in Settings, the current profile's name on Home.
Out: deleting or renaming profiles (edit or delete the file by hand), passwords, cloud sync, profiles on the hosted (GitHub Pages) build or the iOS app. A profile does not carry the latency offset; that belongs to the device.

## Specification

### Profile file

- One file per profile: `profiles/<id>.json`, pretty-printed (2-space indent) so it reads as text.
- Contents:
  ```json
  { "profileVersion": 1, "id": "ana", "name": "Ana", "createdAt": "…", "updatedAt": "…",
    "data": { "range": { … } | null, "progress": { … }, "importedLessons": [] } }
  ```
  `data` uses the same shapes as `StoredData` (`src/storage/schema.ts`). Validate with a zod schema built from those parts.
- `id` is made from the name: lower case, spaces to `-`, only `[a-z0-9-]`, 1–40 characters. Names are 1–40 characters after trimming. Two profiles cannot have the same id.
- Add `profiles/` to `.gitignore`. Profiles are personal data, and the build loop must not see them as uncommitted changes.

### Dev-server file API

A browser cannot write into the repository, so the Vite dev server does it. Put the request handler in `scripts/profilesApi.ts` (a plain function over a directory path, so it can be unit tested without Vite), and register it with a small plugin in `vite.config.ts` using `configureServer`. It runs only under `vite` dev; `vite build` and `vite preview` do not include it.

| Request | Result |
|---|---|
| `GET /api/profiles` | `200` list: `id`, `name`, `updatedAt`, range as note names or `null`, passed-lesson count; newest first |
| `GET /api/profiles/:id` | `200` the file; `404` if missing |
| `POST /api/profiles` with `{ name, data }` | `201` the new file; `409` if the id exists; `400` for a bad name or data |
| `PUT /api/profiles/:id` with `{ data }` | `200` the file with a new `updatedAt`; `404` if missing; `400` for bad data |

- Reject any `:id` that does not match the id pattern with `400`, before touching the disk. No path from a request may leave the profiles folder.
- Write atomically: write `<id>.json.tmp`, then rename it over `<id>.json`.
- Body limit 1 MB.
- The folder is `profiles/` at the repo root, overridable with the environment variable `TMTS_PROFILES_DIR`. Tests use a temporary folder and never touch the real one.
- Create the folder on first write.

### App behaviour

- `src/storage/profiles.ts`: the client for the API, plus `isProfilesAvailable()`, which is true when `GET /api/profiles` answers `200`.
- The active profile id is kept in `localStorage` under `tmts.activeProfile`.
- On start, if there is an active profile and the API is available, load its file and apply it with `replaceData` (the device's latency offset is kept). If the file is missing, clear the active profile and say so once ("Profile 'Ana' was not found").
- Auto-save: while a profile is active, every change to range or progress is saved to its file, debounced by 500 ms. Before loading another profile, save the current one first, and wait for that save.
- If a save fails, show a small non-blocking message ("Couldn't save to the profile file. Your progress is still kept in this browser."). Retry on the next change.
- With no active profile, the app works exactly as it does today.

### UI

- Settings → **Profiles** section:
  - The active profile's name, or "No profile".
  - **New profile**: a name field and a choice of **Start fresh** (no range, no progress) or **Copy current range and progress**. After it is created it becomes active. Start fresh goes to range setup.
  - **Load profile**: a list of profiles with name, range, passed-lesson count and last saved. Tapping one loads it and goes Home (or to range setup if it has no range).
  - When the API is not available (hosted or installed app): the section shows "Profiles work when the app runs locally with `npm run dev`." and no buttons.
- Home: the active profile's name near the title, linking to Settings → Profiles. Nothing is shown when no profile is active.
- Follow `planning/ui-requirements.md`, including tap sizes and phone width.

## Tests

- `scripts/profilesApi.ts` against a temporary folder: create, list (newest first), get, update, `409` duplicate, `404` missing, `400` for bad ids (including `../x`, `a/b`, `%2e%2e`), bad names and wrong-schema data. The atomic write leaves no `.tmp` file behind.
- Name-to-id rules.
- Switching profiles: the current profile is saved before the new one is loaded, and the latency offset is unchanged after a load.
- Auto-save is debounced: several quick changes produce one write.
- Playwright (dev server, `TMTS_PROFILES_DIR` set to a temporary folder):
  1. Create profile "Ana" (Start fresh) and set a range.
  2. Pass a lesson with `sim=perfect`.
  3. Create "Ben" (Start fresh). Home shows no passed lessons.
  4. Load "Ana": the range and passed lesson are back.
  5. `ana.json` exists in the folder and contains the passed lesson.

## Review script

1. Run `npm run dev` and open the app. Settings shows a Profiles section with "No profile".
2. Create profile "Test A", choosing Copy current range and progress. Home shows "Test A", with your existing range and progress.
3. Open `profiles/test-a.json` in an editor. It is readable and shows your range and passed lessons.
4. Create "Test B" with Start fresh. You are sent to range setup. Do a short range test, then pass one lesson.
5. Load "Test A". Home shows A's range and passed lessons, not B's.
6. Load "Test B" again. B's range and the lesson you passed are back.
7. Run `git status`. Nothing under `profiles/` is listed.
8. Run `npm run build && npm run preview` and open Settings. The Profiles section says profiles only work with `npm run dev`.
