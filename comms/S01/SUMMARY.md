# S01 — Spike: local profiles — Summary

**Approved:** 2026-11-15 · **Turns:** 1 · **Branch merged:** `epic/S01` into `main`

## What was accomplished

More than one person can now use the app on this laptop, each with their own saved range and passed lessons.

- A profile is a readable, pretty-printed JSON file in `profiles/` (for example `profiles/ana.json`). You can read it, back it up or copy it by hand. The folder is git-ignored.
- **Settings → Profiles** shows the active profile (or "No profile"). You can create a profile with **Start fresh** (goes to range setup) or **Copy current range and progress**. You can also load a profile from a list that shows its name, range, passed-lesson count and last saved time.
- **Home** shows the active profile's name as a link to Settings → Profiles.
- Changes to range or progress save to the profile file automatically (500 ms debounce). The app saves the current profile before it switches to another one. The device's latency offset is kept when you switch.
- The file API exists only under `npm run dev`. In a build or preview, Settings says profiles only work with `npm run dev`.
- A "profile not found" message and a "couldn't save" message appear in a small non-blocking bar.

## Changes made during review

None. Both reviews approved in turn 1.

## How to test it

1. Run `npm run dev` and open the app. Settings → Profiles shows "No profile".
2. Create "Test A" and choose Copy current range and progress. Home shows "Test A" with your existing range and progress.
3. Open `profiles/test-a.json` in an editor. It is readable and shows your range and passed lessons.
4. Create "Test B" with Start fresh. You go to range setup. Do a short range test, then pass one lesson.
5. Load "Test A". Home shows A's range and lessons, not B's.
6. Load "Test B". B's range and passed lesson are back.
7. Run `git status`. Nothing under `profiles/` is listed.
8. Run `npm run build && npm run preview` and open Settings. It says profiles only work with `npm run dev`.
9. Automated checks: `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`. At review these gave 224 of 224 unit tests and 27 of 27 e2e tests, and lint and build passed. The e2e test uses a temporary profiles folder and its own dev server on port 5174.

## Not verified by the agents

- A full run of steps 4–6 with a real range test and a passed lesson. This needs a microphone. The Playwright test covers the same sequence with simulated input.
- Step 3, opening the JSON file in an editor.
- Step 8, the build and preview view of the "unavailable" message. The UI reviewer did not run it.
- The "Couldn't save to the profile file" notice. The reviewer could not trigger a failure.
- Profiles on an iPhone. They are laptop-only by design. The layout was checked at phone width only.

## Known issues and deferred items

- UI-S01-T1-01 (non-blocking, open): Home reads "Profile:Copy phone-dark" with no space after "Profile:" (`comms/S01/turn-01/ui-review.md`).
- If saving the current profile fails, switching profiles is refused with the save-failed message instead of discarding unsaved data (`docs/epic-notes/S01.md`).
- A profile saves only while the dev server is running. If it stops, changes stay in the browser and the save-failed message shows.
- Names with non-ASCII letters lose them in the id ("Zoë" becomes `zo`).
- The "not found" message shows the profile id (`Profile 'ana' was not found`), not the display name.
- Deleting and renaming profiles are out of scope. Edit or delete the file by hand.

## For the owner to decide

None
