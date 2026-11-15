# UI pass for the owner

Written by the driver when an epic is approved. One section per epic: what the UI reviewer could not check (on the local model it cannot see images, so anything judged by eye is here), the screens it reviewed, and their screenshots. Work through it as a final visual pass. Edit `planning/ui-requirements.md` for anything that should become a requirement.

## E05 — Scoring engine and graded "You do"

Approved after turn 3, 2026-11-15. Review: `comms/E05/turn-03/ui-review.md`.

### Not verified by the UI reviewer

- Review-script steps 1–6 and 8, which need a real microphone or speakers.
- The count-in, running and result states for all sims (step 7): the Playwright script `ui-scripts/attempt.mjs` requires browser-automation approval this session cannot grant.
- Dark mode visual rendering (colours read clearly, spacing, alignment).
- Whether the full page (idle state with all elements) fits at 393 px without scrolling.
- Whether the result table (6 columns) fits at 393 px without horizontal scrolling.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| /dev/attempt idle, range 45–64 | OK (verified by code) | OK (verified by code) | `screenshots/dev-attempt-laptop.png`, `screenshots/dev-attempt-phone.png` |
| Count-in, running, results (perfect / octaveDown / flat70) | Not seen | Not seen | none. The Playwright script (`ui-scripts/attempt.mjs`) requires browser-automation approval this session cannot grant. |

### Screenshots

- `comms/E05/turn-03/screenshots/dev-attempt-laptop.png`
- `comms/E05/turn-03/screenshots/dev-attempt-phone.png`
- `comms/E05/turn-03/screenshots/dev-piano-laptop.png`
- `comms/E05/turn-03/screenshots/dev-piano-phone.png`

## E06 — Full lesson session: I do / We do / You do

Approved after turn 3, 2026-11-15. Review: `comms/E06/turn-03/ui-review.md`.

### Not verified by the UI reviewer

- Real microphone, sound, the physical iPhone, dark mode.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Intro, I do, We do, You do, results (octaveDown) | OK | OK | `screenshots/octaveDown-laptop-1-intro.png` to `screenshots/octaveDown-phone-11-results.png` |

### Screenshots

- `comms/E06/turn-03/screenshots/octaveDown-laptop-1-intro.png`
- `comms/E06/turn-03/screenshots/octaveDown-laptop-10-youdo-running.png`
- `comms/E06/turn-03/screenshots/octaveDown-laptop-11-results.png`
- `comms/E06/turn-03/screenshots/octaveDown-laptop-2-ido-idle.png`
- `comms/E06/turn-03/screenshots/octaveDown-laptop-3-ido-leadin.png`
- `comms/E06/turn-03/screenshots/octaveDown-laptop-4-ido-running.png`
- `comms/E06/turn-03/screenshots/octaveDown-laptop-5-ido-done.png`
- `comms/E06/turn-03/screenshots/octaveDown-laptop-6-wedo-idle.png`
- `comms/E06/turn-03/screenshots/octaveDown-laptop-7-wedo-running.png`
- `comms/E06/turn-03/screenshots/octaveDown-laptop-8-wedo-done.png`
- `comms/E06/turn-03/screenshots/octaveDown-laptop-9-youdo-idle.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-1-intro.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-10-youdo-running.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-11-results.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-2-ido-idle.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-3-ido-leadin.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-4-ido-running.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-5-ido-done.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-6-wedo-idle.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-7-wedo-running.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-8-wedo-done.png`
- `comms/E06/turn-03/screenshots/octaveDown-phone-9-youdo-idle.png`

## E07 — Lesson catalog, tracker, Stage 1 lessons

Approved after turn 1, 2026-11-15. Review: `comms/E07/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Review-script steps 2–8 with real singing: completing lessons, failing a passed lesson, reloading, and working through all eight lessons. I checked the passed, attempted and reset states only with seeded storage. The coder's Playwright tests cover the simulated runs.
- Whether any lesson feels too hard, too easy or mis-scored.
- The iPhone run on a real device.
- Dark mode.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home, range A2–E4, nothing started | OK | OK | `screenshots/home-laptop.png`, `screenshots/home-phone.png` |
| Home, range D3–B3 (9 semitones), all fit | OK | OK | `screenshots/narrow/home-laptop.png`, `screenshots/narrow/home-phone.png` |
| Home, 3-semitone range (disabled rows) | OK | Issue (UI-E07-T1-01) | `screenshots/home-smallrange-laptop.png`, `screenshots/home-smallrange-phone.png` |
| Home with a passed and an attempted lesson | OK | OK | `screenshots/home-progress-laptop.png`, `screenshots/home-progress-phone.png` |
| Settings | OK | Issue (UI-E07-T1-02) | `screenshots/settings-laptop.png`, `screenshots/settings-phone.png` |
| Settings, reset confirmation | OK | OK | `screenshots/settings-confirm-laptop.png`, `screenshots/settings-confirm-phone.png` |
| Lesson not found | OK | OK | `screenshots/lesson-nope-laptop.png`, `screenshots/lesson-nope-phone.png` |

Page scroll width equals the viewport width at both sizes (1280 and 393), so there is no horizontal scrolling.

### Screenshots

- `comms/E07/turn-01/screenshots/home-laptop.png`
- `comms/E07/turn-01/screenshots/home-phone.png`
- `comms/E07/turn-01/screenshots/home-progress-laptop.png`
- `comms/E07/turn-01/screenshots/home-progress-phone.png`
- `comms/E07/turn-01/screenshots/home-smallrange-laptop.png`
- `comms/E07/turn-01/screenshots/home-smallrange-phone.png`
- `comms/E07/turn-01/screenshots/lesson-nope-laptop.png`
- `comms/E07/turn-01/screenshots/lesson-nope-phone.png`
- `comms/E07/turn-01/screenshots/settings-confirm-laptop.png`
- `comms/E07/turn-01/screenshots/settings-confirm-phone.png`
- `comms/E07/turn-01/screenshots/settings-laptop.png`
- `comms/E07/turn-01/screenshots/settings-phone.png`
