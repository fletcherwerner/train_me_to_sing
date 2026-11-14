# E10 — PWA install, hosting, export/import

## Goal

Put the app on the iPhone home screen from a real HTTPS address, working offline, and let progress be carried between devices.

## What you will review

The app installed on your iPhone home screen, opening full-screen without the laptop running; and your laptop progress imported onto the phone.

## Depends on

E07 at minimum. Best done after E09 so all content ships.

## Scope

In: PWA manifest and service worker, static hosting, export/import, iOS polish.
Out: native wrapper (E12), cloud sync.

## Owner decision needed before starting

Which static host to use. Default: **GitHub Pages** from this repository via a GitHub Actions workflow. Alternatives: Cloudflare Pages, Netlify. The builder needs the repository pushed to GitHub and Pages enabled; if that is not available, stop and ask.

## Specification

### PWA

- Add `vite-plugin-pwa` (`registerType: 'autoUpdate'`), precaching all build assets so the app works offline after the first visit.
- Manifest: `name` "Train Me To Sing", `short_name` "Sing", `display: 'standalone'`, `orientation: 'portrait'`, theme and background colours matching the app, icons 192, 512 and a maskable 512. Create a simple icon (a piano key and a sound wave) as SVG and export PNGs.
- `index.html`: `apple-touch-icon` (180 px), `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `viewport` with `viewport-fit=cover`.
- When a new version is available, show a small "Update ready — reload" banner.

### Hosting

- GitHub Actions workflow: on push to `main` — install, lint, unit tests, build, deploy `dist/` to Pages.
- `base: './'` and `HashRouter` (already set) make sub-path hosting work. Verify assets and the service worker scope load correctly under `/<repo-name>/`.

### Export / import (`src/storage/exportImport.ts`)

- `exportData(): Blob` — the full `StoredData` as pretty JSON plus `exportedAt`.
- Settings → "Export progress" downloads `train-me-to-sing-YYYY-MM-DD.json`. On iOS, use the Web Share API (`navigator.share` with a file) when available so it can be saved to Files or AirDropped; fall back to a download link.
- Settings → "Import progress": file picker; validate with the zod schema.
  - Invalid file → error message, nothing changed.
  - Valid → show a summary ("Range E2–C4, 9 lessons passed") and ask: **Replace** everything, or **Merge**.
  - Merge rule: per lesson, keep `passed` if either side passed, the higher `bestScore`, summed `attempts`, later `lastAttemptAt`. Range and settings: keep the device's own unless it has no range. Imported lessons: union by id.
  - `latencyOffsetMs` is never imported; it is device-specific.

### iOS polish

- Respect safe-area insets (`env(safe-area-inset-*)`) so controls are not under the notch or home bar.
- Prevent double-tap zoom and text selection on the keyboard and buttons (`touch-action: manipulation`, `user-select: none`).
- Request a screen wake lock (`navigator.wakeLock`) during a lesson run; release afterwards. Ignore if unsupported.
- When the app returns from the background, the `AudioContext` may be suspended or interrupted: on `visibilitychange`, if a run was in progress, stop it and return the step to idle with a "Paused — tap to restart" message.
- Verify mic permission behaviour in standalone mode; iOS may ask again on each launch. Record what happens in the epic notes.

## Tests

- Merge function: the rules above, including an import with unknown lesson ids (kept).
- Export → import round trip yields identical progress.
- Invalid JSON and wrong-schema files are rejected.
- Build output contains `manifest.webmanifest` and a service worker.
- Playwright: load the built app (`vite preview`), go offline, reload — the home screen still renders.

## Review script

1. Open the hosted URL on the laptop. It works the same as the dev version.
2. On the iPhone, open the URL in Safari → Share → Add to Home Screen. Launch from the icon: it opens full-screen with no browser bars.
3. Turn on Airplane Mode and relaunch — the app loads. Do a lesson offline.
4. On the laptop: Settings → Export progress. Send the file to the phone (AirDrop).
5. On the phone: Settings → Import progress → pick the file → Merge. Home shows the laptop's passed lessons. The phone's calibration value is unchanged.
6. Lock the phone mid-lesson and unlock — the app shows the paused message and restarts cleanly.
7. During a song, the screen does not dim or lock.
