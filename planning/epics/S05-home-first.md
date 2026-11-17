# S05 — Spike: open on Home, not the range test

> **Recorded after the fact.** The owner asked for this directly and it was built outside the build loop, on `main`, after S04. This file records what was built so the loop can review it. If the driver runs S05, the coder's job is to confirm the work below matches this file and the checks pass, and to fix any gaps, not to rebuild it.

## Goal

With no saved range, the app used to force the Vocal Range Assessment on launch. With profiles (S01) that makes no sense: a returning student should be able to go to Settings and load their profile. The app now always opens on Home. From there the student either finds their range or loads a profile.

## What you will review

On a fresh device (or after a reset), the app opens on Home. A "Get started" card offers Find my range and a link to load a profile in Settings. Lessons are listed but locked with "Find your range first". After the range test or loading a profile, Home looks as before.

## Depends on

S04 (run order only), S01 profiles, E07 Home, E03 range setup.

## Scope

In: the `/` route, Home with no range, the lesson screen's no-range redirect.
Out: the range test itself, Settings and profile loading, Home with a range.

## Specification

- `src/app/routes.tsx`: `/` always renders `Home`. The redirect to `/range` is removed.
- `Home` with no range:
  - Header shows "Your range: not set yet", with Settings and Mic check links as usual.
  - A "Get started" card (`data-testid="setup-card"`) in place of Continue: one line on why, a primary "Find my range" link to `/range`, and "Already have a profile? Load it in Settings" linking to `/settings`.
  - Every lesson row (built-in and My songs) is shown, not clickable, with the status "Find your range first".
- `Lesson` with no range redirects to `/` (keeping `?sim=` and other query), not `/range`.
- The range test's Save still returns to Home.

## Tests

- `tests/e2e/range.spec.ts`: first launch shows Home with "not set yet", a locked lesson and the Settings link; Find my range opens the assessment, which completes and persists as before.
- `tests/e2e/lesson.spec.ts`: a lesson link with no range lands on Home with the setup card.
- All other Playwright specs pass unchanged.

## Review script

1. In Settings, reset (or use a private window). Reload: Home opens with the Get started card.
2. Tap Load it in Settings, load a saved profile, go Home: your range and progress show and lessons open.
3. Reset again, tap Find my range, complete it: Home shows your range and the Continue card.
4. Open a lesson link directly with no range: you land on Home.
