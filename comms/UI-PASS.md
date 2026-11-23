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

## E08 — Stage 2 scales, tighter tolerances, latency calibration

Approved after turn 2, 2026-11-15. Review: `comms/E08/turn-02/ui-review.md`.

### Not verified by the UI reviewer

- Real-microphone calibration, audible clicks, and review-script steps 2–7.
- Dark mode.
- A real iPhone.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Calibrate, count-in | OK | OK | `screenshots/cal-count-phone.png`, `screenshots/cal-count-laptop.png` |
| Calibrate, measured clicks | OK | OK | `screenshots/cal-click-phone.png`, `screenshots/cal-click-laptop.png` |
| Calibrate, result (Save / Retry) | OK | OK | `screenshots/cal-result-phone.png`, `screenshots/cal-result-laptop.png` |
| Calibrate, after Stop | OK | OK | `screenshots/cal-stopped-phone.png`, `screenshots/cal-stopped-laptop.png` |
| Settings, timing slider | OK | OK | `screenshots/settings-phone.png`, `screenshots/settings-laptop.png` |

### Screenshots

- `comms/E08/turn-02/screenshots/cal-click-laptop.png`
- `comms/E08/turn-02/screenshots/cal-click-phone.png`
- `comms/E08/turn-02/screenshots/cal-count-laptop.png`
- `comms/E08/turn-02/screenshots/cal-count-phone.png`
- `comms/E08/turn-02/screenshots/cal-result-laptop.png`
- `comms/E08/turn-02/screenshots/cal-result-phone.png`
- `comms/E08/turn-02/screenshots/cal-stopped-laptop.png`
- `comms/E08/turn-02/screenshots/cal-stopped-phone.png`
- `comms/E08/turn-02/screenshots/settings-laptop.png`
- `comms/E08/turn-02/screenshots/settings-phone.png`

## E09 — Stage 3 songs with lyrics

Approved after turn 2, 2026-11-15. Review: `comms/E09/turn-02/ui-review.md`.

### Not verified by the UI reviewer

- Listening to the melodies and the audible 4-click lead-in.
- Lyrics advancing in time with sound.
- The real iPhone fit, only approximated at 393×852 in Chromium.
- Real microphone singing. Only the simulated singer was used.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Twinkle I do playing | OK | OK | `screenshots/laptop-s3-04-ido-playing.png`, `screenshots/phone-s3-04-ido-playing.png` |
| We do, Line 2 | OK | OK | `screenshots/laptop-s3-04-wedo-line2.png`, `screenshots/phone-s3-04-wedo-line2.png` |
| You do running | OK (page 16 px taller than window) | OK (page 18 px taller than window) | `screenshots/laptop-s3-04-youdo-running.png`, `screenshots/phone-s3-04-youdo-running.png` |
| Results with misses (sim flat40) | OK | OK | `screenshots/laptop-results-flat40.png`, `screenshots/phone-results-flat40.png` |

Scripts: `ui-scripts/flow.mjs`, `ui-scripts/miss.mjs`.

### Screenshots

- `comms/E09/turn-02/screenshots/laptop-home.png`
- `comms/E09/turn-02/screenshots/laptop-results-flat40.png`
- `comms/E09/turn-02/screenshots/laptop-s3-01-intro.png`
- `comms/E09/turn-02/screenshots/laptop-s3-04-ido-done.png`
- `comms/E09/turn-02/screenshots/laptop-s3-04-ido-playing.png`
- `comms/E09/turn-02/screenshots/laptop-s3-04-ido-ready.png`
- `comms/E09/turn-02/screenshots/laptop-s3-04-intro.png`
- `comms/E09/turn-02/screenshots/laptop-s3-04-wedo-done.png`
- `comms/E09/turn-02/screenshots/laptop-s3-04-wedo-line2.png`
- `comms/E09/turn-02/screenshots/laptop-s3-04-wedo-running.png`
- `comms/E09/turn-02/screenshots/laptop-s3-04-youdo-late.png`
- `comms/E09/turn-02/screenshots/laptop-s3-04-youdo-ready.png`
- `comms/E09/turn-02/screenshots/laptop-s3-04-youdo-running.png`
- `comms/E09/turn-02/screenshots/laptop-s3-05-intro.png`
- `comms/E09/turn-02/screenshots/phone-home.png`
- `comms/E09/turn-02/screenshots/phone-results-flat40.png`
- `comms/E09/turn-02/screenshots/phone-s3-01-intro.png`
- `comms/E09/turn-02/screenshots/phone-s3-04-ido-done.png`
- `comms/E09/turn-02/screenshots/phone-s3-04-ido-playing.png`
- `comms/E09/turn-02/screenshots/phone-s3-04-ido-ready.png`
- `comms/E09/turn-02/screenshots/phone-s3-04-intro.png`
- `comms/E09/turn-02/screenshots/phone-s3-04-wedo-done.png`
- `comms/E09/turn-02/screenshots/phone-s3-04-wedo-line2.png`
- `comms/E09/turn-02/screenshots/phone-s3-04-wedo-running.png`
- `comms/E09/turn-02/screenshots/phone-s3-04-youdo-late.png`
- `comms/E09/turn-02/screenshots/phone-s3-04-youdo-ready.png`
- `comms/E09/turn-02/screenshots/phone-s3-04-youdo-running.png`
- `comms/E09/turn-02/screenshots/phone-s3-05-intro.png`

## E10 — PWA install, hosting, export/import

Approved after turn 1, 2026-11-16. Review: `comms/E10/turn-01/ui-review.md`.

### Not verified by the UI reviewer

The following steps need an iPhone or hosted URL, so they are left for the owner:
- Review-script steps 1–3: hosted HTTPS URL, Add to Home Screen, full-screen standalone launch and the icon, offline launch in Airplane Mode.
- Step 4: the AirDrop/share sheet. Only the download path was exercised, and it showed "Export downloaded."
- Step 5: importing on the phone, and checking that the phone's calibration is unchanged. I confirmed the on-screen messages only.
- Steps 6–7: the "Paused — tap to restart" message after locking mid-lesson, and the screen wake lock during a song.
- The "Update ready — reload" banner, which did not appear.
- Safe-area insets on a notched phone.
- Dark mode on Settings.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Settings (default) | OK | OK | `screenshots/settings-laptop.png`, `screenshots/settings-phone.png` |
| Export done | OK | OK | `screenshots/export-done-laptop.png`, `screenshots/export-done-phone.png` |
| Import invalid file | OK | OK | `screenshots/import-invalid-laptop.png`, `screenshots/import-invalid-phone.png` |
| Import summary (Replace / Merge / Cancel) | OK | Issue | `screenshots/import-summary-laptop.png`, `screenshots/import-summary-phone.png` |
| Import merged | OK | OK | `screenshots/import-merged-laptop.png`, `screenshots/import-merged-phone.png` |
| Home (unchanged) | OK | OK | `screenshots/home-laptop.png`, `screenshots/home-phone.png` |

The script is `ui-scripts/import.mjs`. It uses a fresh browser profile, so the summary and merged screenshots start from an empty device.

### Screenshots

- `comms/E10/turn-01/screenshots/export-done-laptop.png`
- `comms/E10/turn-01/screenshots/export-done-phone.png`
- `comms/E10/turn-01/screenshots/home-laptop.png`
- `comms/E10/turn-01/screenshots/home-phone.png`
- `comms/E10/turn-01/screenshots/import-invalid-laptop.png`
- `comms/E10/turn-01/screenshots/import-invalid-phone.png`
- `comms/E10/turn-01/screenshots/import-merged-laptop.png`
- `comms/E10/turn-01/screenshots/import-merged-phone.png`
- `comms/E10/turn-01/screenshots/import-summary-laptop.png`
- `comms/E10/turn-01/screenshots/import-summary-phone.png`
- `comms/E10/turn-01/screenshots/settings-laptop.png`
- `comms/E10/turn-01/screenshots/settings-phone.png`

## E11 — MIDI import

Approved after turn 1, 2026-11-16. Review: `comms/E11/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Preview audio (needs speakers).
- Running an imported lesson by hand. I did not do this; the e2e test covers it.
- A real nursery-rhyme `.mid` file; I used the generated fixtures only.
- iPhone Safari, including the file picker.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Import, empty | OK | OK | `screenshots/laptop-2-import-empty.png`, `screenshots/phone-2-import-empty.png` |
| Import, two tracks, chord warning | OK | OK | `screenshots/laptop-7-chords-selected.png`, `screenshots/phone-7-chords-selected.png` |
| Import, melody selected, fits | OK | OK | `screenshots/laptop-8-melody-narrow-range.png`, `screenshots/phone-8-melody-narrow-range.png` |
| Import, melody selected, does not fit | OK | OK | `screenshots/phone-9-nofit-import.png` |
| Import, dark mode | OK | OK | `screenshots/phone-dark-8-melody-narrow-range.png` |
| Home, My songs and import link | OK | OK | `screenshots/laptop-5-home-mysongs.png`, `screenshots/phone-5-home-mysongs.png` |
| Home, imported lesson that does not fit | OK | OK | `screenshots/phone-10-nofit-home.png` |
| Home, delete confirmation | OK | OK | `screenshots/laptop-6-delete-confirm.png`, `screenshots/phone-6-delete-confirm.png` |

### Screenshots

- `comms/E11/turn-01/screenshots/laptop-1-home.png`
- `comms/E11/turn-01/screenshots/laptop-2-import-empty.png`
- `comms/E11/turn-01/screenshots/laptop-3-two-tracks.png`
- `comms/E11/turn-01/screenshots/laptop-4-selected.png`
- `comms/E11/turn-01/screenshots/laptop-5-home-mysongs.png`
- `comms/E11/turn-01/screenshots/laptop-6-delete-confirm.png`
- `comms/E11/turn-01/screenshots/laptop-7-chords-selected.png`
- `comms/E11/turn-01/screenshots/laptop-8-melody-narrow-range.png`
- `comms/E11/turn-01/screenshots/phone-1-home.png`
- `comms/E11/turn-01/screenshots/phone-10-nofit-home.png`
- `comms/E11/turn-01/screenshots/phone-2-import-empty.png`
- `comms/E11/turn-01/screenshots/phone-3-two-tracks.png`
- `comms/E11/turn-01/screenshots/phone-4-selected.png`
- `comms/E11/turn-01/screenshots/phone-5-home-mysongs.png`
- `comms/E11/turn-01/screenshots/phone-6-delete-confirm.png`
- `comms/E11/turn-01/screenshots/phone-7-chords-selected.png`
- `comms/E11/turn-01/screenshots/phone-8-melody-narrow-range.png`
- `comms/E11/turn-01/screenshots/phone-9-nofit-import.png`
- `comms/E11/turn-01/screenshots/phone-dark-1-home.png`
- `comms/E11/turn-01/screenshots/phone-dark-2-import-empty.png`
- `comms/E11/turn-01/screenshots/phone-dark-3-two-tracks.png`
- `comms/E11/turn-01/screenshots/phone-dark-4-selected.png`
- `comms/E11/turn-01/screenshots/phone-dark-5-home-mysongs.png`
- `comms/E11/turn-01/screenshots/phone-dark-6-delete-confirm.png`
- `comms/E11/turn-01/screenshots/phone-dark-7-chords-selected.png`
- `comms/E11/turn-01/screenshots/phone-dark-8-melody-narrow-range.png`

## E12 — Capacitor iOS wrapper

Approved after turn 3, 2026-11-16. Review: `comms/E12/turn-03/ui-review.md`.

### Not verified by the UI reviewer

These need an iPhone, Xcode and a real microphone, so they remain for the owner:

- Install via `docs/ios-build.md`, the single mic prompt, and no prompt on relaunch.
- Tuner, range test, lesson and song with wired headphones.
- Calibration compared with the PWA.
- Phone call or Siri interruption, then the paused message and recovery.
- Share-sheet export and file-picker import.
- Portrait lock, and the icon and launch screen on the device.
- The `xcodebuild` Simulator build, which the coder could not run.
- The placeholder bundle id `com.example.trainmetosing`, which the owner must replace.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| No visible change this turn | n/a | n/a | `comms/E12/turn-01/screenshots/` (unchanged) |

### Screenshots

None.

## E13 — Hardening and polish: audio recovery, run-screen layout, UI leftovers

Approved after turn 1, 2026-11-16. Review: `comms/E13/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Review script steps 1–3 with real headphones, Bluetooth or sleep/wake. I only used the `suspendAudio` and `loseMic` test hooks.
- The range-test failure screens (step 1) and the Calibrate recovery screen.
- Step 6 by ear. I did see an orange sung key on the piano for a flat note with `sim=flat40`.
- Step 8, dark mode (UR-27) on every screen.
- Step 9, the Import progress prompt (boxed, Merge primary, Replace danger and warning). It needs a file picked.
- Step 10: whether Settings lists only "Open the tuner" in a production build. The dev server shows dev links by design.
- The 393×660 window.
- Everything that needs a real iPhone.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Lesson You do, running (s1-05) | OK | OK | `screenshots/l-youdo-run-laptop.png`, `screenshots/l-youdo-run-phone.png` |
| Lesson You do, running, flat sung note (s3-01) | OK | OK | `screenshots/l-flat-youdo-phone.png`, `screenshots/l-flat-youdo-laptop.png` |
| Sound stopped mid-run | OK | OK | `screenshots/l-stalled-phone.png`, `screenshots/l-stalled-laptop.png` |
| Microphone lost, Reconnect microphone | OK | OK | `screenshots/l-miclost-phone.png`, `screenshots/l-miclost-laptop.png` |
| Results (fail) | OK | OK | `screenshots/results-flat40-phone.png`, `screenshots/results-flat40-laptop.png` |
| Home | OK | OK | `screenshots/home-phone.png`, `screenshots/home-laptop.png` |
| Settings | OK | OK | `screenshots/settings-phone.png`, `screenshots/settings-laptop.png` |
| Range test (find) | OK | OK | `screenshots/range-find-phone.png`, `screenshots/range-find-laptop.png` |
| Import MIDI (start) | OK | OK | `screenshots/import-phone.png`, `screenshots/import-laptop.png` |

### Screenshots

- `comms/E13/turn-01/screenshots/calibrate-laptop.png`
- `comms/E13/turn-01/screenshots/calibrate-phone.png`
- `comms/E13/turn-01/screenshots/home-laptop.png`
- `comms/E13/turn-01/screenshots/home-phone.png`
- `comms/E13/turn-01/screenshots/import-laptop.png`
- `comms/E13/turn-01/screenshots/import-phone.png`
- `comms/E13/turn-01/screenshots/l-flat-youdo-laptop.png`
- `comms/E13/turn-01/screenshots/l-flat-youdo-phone.png`
- `comms/E13/turn-01/screenshots/l-ido-idle-laptop.png`
- `comms/E13/turn-01/screenshots/l-ido-idle-phone.png`
- `comms/E13/turn-01/screenshots/l-ido-run-laptop.png`
- `comms/E13/turn-01/screenshots/l-ido-run-phone.png`
- `comms/E13/turn-01/screenshots/l-intro-laptop.png`
- `comms/E13/turn-01/screenshots/l-intro-phone.png`
- `comms/E13/turn-01/screenshots/l-miclost-laptop.png`
- `comms/E13/turn-01/screenshots/l-miclost-phone.png`
- `comms/E13/turn-01/screenshots/l-stalled-laptop.png`
- `comms/E13/turn-01/screenshots/l-stalled-phone.png`
- `comms/E13/turn-01/screenshots/l-wedo-done-laptop.png`
- `comms/E13/turn-01/screenshots/l-wedo-done-phone.png`
- `comms/E13/turn-01/screenshots/l-wedo-idle-laptop.png`
- `comms/E13/turn-01/screenshots/l-wedo-idle-phone.png`
- `comms/E13/turn-01/screenshots/l-wedo-run-laptop.png`
- `comms/E13/turn-01/screenshots/l-wedo-run-phone.png`
- `comms/E13/turn-01/screenshots/l-youdo-run-laptop.png`
- `comms/E13/turn-01/screenshots/l-youdo-run-phone.png`
- `comms/E13/turn-01/screenshots/probe-s301.png`
- `comms/E13/turn-01/screenshots/range-find-laptop.png`
- `comms/E13/turn-01/screenshots/range-find-phone.png`
- `comms/E13/turn-01/screenshots/range-laptop.png`
- `comms/E13/turn-01/screenshots/range-phone.png`
- `comms/E13/turn-01/screenshots/results-flat40-laptop.png`
- `comms/E13/turn-01/screenshots/results-flat40-phone.png`
- `comms/E13/turn-01/screenshots/results-perfect-laptop.png`
- `comms/E13/turn-01/screenshots/results-perfect-phone.png`
- `comms/E13/turn-01/screenshots/settings-laptop.png`
- `comms/E13/turn-01/screenshots/settings-phone.png`

## E14 — Beginner path: new Stage 1, feedback levels, echo yourself

Approved after turn 2, 2026-11-18. Review: `comms/E14/turn-02/ui-review.md`.

### Not verified by the UI reviewer

- Echo with a real recording and playback.
- Hearing the target tone and the count-in clicks.
- Sliding on purpose, and the "you slid" message (needs a real voice).
- Whether the starting note changes between attempts.
- Stage 2 and 3 lessons.
- Everything on a real iPhone.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Prove start | OK | OK | `screenshots/b04-prove-start-laptop.png`, `b04-prove-start-phone.png` |
| Prove run | OK | OK | `screenshots/b04-prove-run-laptop.png`, `b04-prove-run-phone.png` |
| Prove results | OK | OK | `screenshots/b04-prove-results-laptop.png`, `b04-prove-results-phone.png` |
| Other Stage 1 screens (re-captured, unchanged) | OK | OK | `screenshots/` |

The sideways-scroll check passed on every screen at phone size.

### Screenshots

- `comms/E14/turn-02/screenshots/b04-ido-done-laptop.png`
- `comms/E14/turn-02/screenshots/b04-ido-done-phone.png`
- `comms/E14/turn-02/screenshots/b04-ido-laptop.png`
- `comms/E14/turn-02/screenshots/b04-ido-phone-dark.png`
- `comms/E14/turn-02/screenshots/b04-ido-phone.png`
- `comms/E14/turn-02/screenshots/b04-intro-laptop.png`
- `comms/E14/turn-02/screenshots/b04-intro-phone.png`
- `comms/E14/turn-02/screenshots/b04-learn-results-laptop.png`
- `comms/E14/turn-02/screenshots/b04-learn-results-phone.png`
- `comms/E14/turn-02/screenshots/b04-learn-run-laptop.png`
- `comms/E14/turn-02/screenshots/b04-learn-run-phone.png`
- `comms/E14/turn-02/screenshots/b04-practise-results-laptop.png`
- `comms/E14/turn-02/screenshots/b04-practise-results-phone.png`
- `comms/E14/turn-02/screenshots/b04-practise-run-laptop.png`
- `comms/E14/turn-02/screenshots/b04-practise-run-phone.png`
- `comms/E14/turn-02/screenshots/b04-practise-start-laptop.png`
- `comms/E14/turn-02/screenshots/b04-practise-start-phone.png`
- `comms/E14/turn-02/screenshots/b04-prove-results-laptop.png`
- `comms/E14/turn-02/screenshots/b04-prove-results-phone.png`
- `comms/E14/turn-02/screenshots/b04-prove-run-laptop.png`
- `comms/E14/turn-02/screenshots/b04-prove-run-phone.png`
- `comms/E14/turn-02/screenshots/b04-prove-start-laptop.png`
- `comms/E14/turn-02/screenshots/b04-prove-start-phone.png`
- `comms/E14/turn-02/screenshots/b04-wedo-done-laptop.png`
- `comms/E14/turn-02/screenshots/b04-wedo-done-phone.png`
- `comms/E14/turn-02/screenshots/b04-wedo-laptop.png`
- `comms/E14/turn-02/screenshots/b04-wedo-phone.png`
- `comms/E14/turn-02/screenshots/b04-youdo-learn-laptop.png`
- `comms/E14/turn-02/screenshots/b04-youdo-learn-phone.png`
- `comms/E14/turn-02/screenshots/home-laptop.png`
- `comms/E14/turn-02/screenshots/home-phone-dark.png`
- `comms/E14/turn-02/screenshots/home-phone.png`
- `comms/E14/turn-02/screenshots/match-intro-laptop.png`
- `comms/E14/turn-02/screenshots/match-intro-phone-dark.png`
- `comms/E14/turn-02/screenshots/match-intro-phone.png`
- `comms/E14/turn-02/screenshots/match-results-laptop.png`
- `comms/E14/turn-02/screenshots/match-results-phone.png`
- `comms/E14/turn-02/screenshots/match-run-laptop.png`
- `comms/E14/turn-02/screenshots/match-run-phone.png`
- `comms/E14/turn-02/screenshots/match3-intro-laptop.png`
- `comms/E14/turn-02/screenshots/match3-intro-phone.png`
- `comms/E14/turn-02/screenshots/match3-silent-results-laptop.png`
- `comms/E14/turn-02/screenshots/match3-silent-results-phone.png`

## E15 — Daily practice: session, spaced mastery, review, onset coaching

Approved after turn 3, 2026-11-18. Review: `comms/E15/turn-03/ui-review.md`.

### Not verified by the UI reviewer

- Audio of the glides and the lead-in clicks.
- The real microphone and the iPhone itself.
- New-pattern, review and results states, export and import, dark mode.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Warm-up running | OK | OK (fits 852 px) | `screenshots/laptop-glide-run.png`, `screenshots/phone-glide-run.png` |

### Screenshots

- `comms/E15/turn-03/screenshots/laptop-glide-run.png`
- `comms/E15/turn-03/screenshots/phone-glide-run.png`

## E16 — iPhone app with progress saved as a file

Approved after turn 1, 2026-11-23. Review: `comms/E16/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Review script steps 1–8: the Xcode build, device install, Files app listing, `backups` folder, quit and reopen, re-install over the top, web Export and app Import, replacing the file with an older backup, and the E12 checks all need an iPhone.
- The wording "Saved on this iPhone in Files › On My iPhone…" appears in the browser because the dev stand-in uses it; on the device, check that it matches what the Files app shows.
- Dark mode was not captured.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Settings, before first save ("Not saved to the file yet in this session.") | OK | OK | `screenshots/settings-filestore-memory-laptop.png`, `screenshots/settings-filestore-memory-phone.png` |
| Settings, after a change ("Last saved: 8:29 PM") | OK | OK | `screenshots/saved-laptop.png`, `screenshots/saved-phone.png` |
| Home, unreadable-file notice with OK button | OK | OK | `screenshots/unreadable-laptop.png`, `screenshots/unreadable-phone.png` |

Seen with `?filestore=memory`, the dev-only stand-in for the native file.

### Screenshots

- `comms/E16/turn-01/screenshots/-filestore-memory-laptop.png`
- `comms/E16/turn-01/screenshots/-filestore-memory-phone.png`
- `comms/E16/turn-01/screenshots/saved-laptop.png`
- `comms/E16/turn-01/screenshots/saved-phone.png`
- `comms/E16/turn-01/screenshots/settings-filestore-memory-laptop.png`
- `comms/E16/turn-01/screenshots/settings-filestore-memory-phone.png`
- `comms/E16/turn-01/screenshots/unreadable-laptop.png`
- `comms/E16/turn-01/screenshots/unreadable-phone.png`

## S01 — Spike: local profiles

Approved after turn 1, 2026-11-16. Review: `comms/S01/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Review script steps 4–6 as a full run, meaning a real range test and passing a lesson. These need a microphone, and the Playwright e2e covers the same sequence. I only created profiles through the UI.
- Step 8, the `npm run build && npm run preview` view of the unavailable message. I did not run it.
- The non-blocking "Couldn't save to the profile file" notice. I could not trigger a save failure.
- Step 3, opening the JSON file in an editor.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Settings, no profile, empty list | OK | OK | `screenshots/settings-noprofile-laptop.png`, `screenshots/settings-noprofile-phone.png` |
| Settings, profile active, list of two | OK | OK | `screenshots/settings-active-laptop.png`, `screenshots/settings-active-phone.png` |
| Duplicate-name error | OK | OK | `screenshots/duplicate-laptop.png`, `screenshots/duplicate-phone.png` |
| Empty name error | OK | OK | `screenshots/emptyname-laptop.png`, `screenshots/emptyname-phone.png` |
| Start fresh goes to range setup | OK | OK | `screenshots/after-create-fresh-laptop.png`, `screenshots/after-create-fresh-phone.png` |
| Home with the profile link (Copy mode, range kept) | OK | OK | `screenshots/copy-home-laptop.png`, `screenshots/copy-home-phone.png` |
| Dark mode, Settings and Home | n/a | OK | `screenshots/settings-dark-phone.png`, `screenshots/copy-home-phone-dark.png` |

### Screenshots

- `comms/S01/turn-01/screenshots/after-create-fresh-laptop.png`
- `comms/S01/turn-01/screenshots/after-create-fresh-phone.png`
- `comms/S01/turn-01/screenshots/copy-home-laptop.png`
- `comms/S01/turn-01/screenshots/copy-home-phone-dark.png`
- `comms/S01/turn-01/screenshots/copy-home-phone.png`
- `comms/S01/turn-01/screenshots/duplicate-laptop.png`
- `comms/S01/turn-01/screenshots/duplicate-phone.png`
- `comms/S01/turn-01/screenshots/emptyname-laptop.png`
- `comms/S01/turn-01/screenshots/emptyname-phone.png`
- `comms/S01/turn-01/screenshots/home-dark-phone.png`
- `comms/S01/turn-01/screenshots/home-profile-laptop.png`
- `comms/S01/turn-01/screenshots/home-profile-phone.png`
- `comms/S01/turn-01/screenshots/settings-active-laptop.png`
- `comms/S01/turn-01/screenshots/settings-active-phone.png`
- `comms/S01/turn-01/screenshots/settings-dark-phone.png`
- `comms/S01/turn-01/screenshots/settings-filled-laptop.png`
- `comms/S01/turn-01/screenshots/settings-filled-phone.png`
- `comms/S01/turn-01/screenshots/settings-noprofile-laptop.png`
- `comms/S01/turn-01/screenshots/settings-noprofile-phone.png`

## S02 — Spike: scrolling pitch graph

Approved after turn 1, 2026-11-16. Review: `comms/S02/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Review-script steps 2, 3 and 5 with a real voice: going sharp or flat on purpose, the gap when you pause, and singing one note low. I used only `sim=perfect` and `sim=octaveDown`.
- Step 6: the Stage 3 song results scroll sideways inside the graph box. Not exercised.
- Reduced-motion behaviour.
- Real iPhone and sound. Whether the graph and the audio feel in sync can only be judged by ear.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| I do, count-in and running (black only) | OK | OK | `screenshots/laptop-perfect-1-ido-countin.png`, `screenshots/phone-perfect-2-ido-run.png` |
| We do (sim=perfect) | OK | OK | `screenshots/laptop-perfect-3-wedo.png`, `screenshots/phone-perfect-3-wedo.png` |
| You do running, on target | OK | OK | `screenshots/laptop-perfect-4-youdo.png`, `screenshots/phone-perfect-4-youdo.png` |
| You do, octave low (▼ marker at the now line) | OK | OK | `screenshots/laptop-octaveDown-4-youdo.png`, `screenshots/phone-octaveDown-4-youdo.png` |
| Results, passed (red lies on black) | OK | OK | `screenshots/laptop-perfect-5-results.png`, `screenshots/phone-perfect-5-results-full.png` |
| Results, octave error (red an octave below) | OK | OK | `screenshots/laptop-octaveDown-5-results-full.png`, `screenshots/phone-octaveDown-5-results.png` |

### Screenshots

- `comms/S02/turn-01/screenshots/laptop-octaveDown-1-ido-countin.png`
- `comms/S02/turn-01/screenshots/laptop-octaveDown-2-ido-run.png`
- `comms/S02/turn-01/screenshots/laptop-octaveDown-3-wedo.png`
- `comms/S02/turn-01/screenshots/laptop-octaveDown-4-youdo.png`
- `comms/S02/turn-01/screenshots/laptop-octaveDown-5-results-full.png`
- `comms/S02/turn-01/screenshots/laptop-octaveDown-5-results.png`
- `comms/S02/turn-01/screenshots/laptop-perfect-1-ido-countin.png`
- `comms/S02/turn-01/screenshots/laptop-perfect-2-ido-run.png`
- `comms/S02/turn-01/screenshots/laptop-perfect-3-wedo.png`
- `comms/S02/turn-01/screenshots/laptop-perfect-4-youdo.png`
- `comms/S02/turn-01/screenshots/laptop-perfect-5-results-full.png`
- `comms/S02/turn-01/screenshots/laptop-perfect-5-results.png`
- `comms/S02/turn-01/screenshots/phone-octaveDown-1-ido-countin.png`
- `comms/S02/turn-01/screenshots/phone-octaveDown-2-ido-run.png`
- `comms/S02/turn-01/screenshots/phone-octaveDown-3-wedo.png`
- `comms/S02/turn-01/screenshots/phone-octaveDown-4-youdo.png`
- `comms/S02/turn-01/screenshots/phone-octaveDown-5-results-full.png`
- `comms/S02/turn-01/screenshots/phone-octaveDown-5-results.png`
- `comms/S02/turn-01/screenshots/phone-perfect-1-ido-countin.png`
- `comms/S02/turn-01/screenshots/phone-perfect-2-ido-run.png`
- `comms/S02/turn-01/screenshots/phone-perfect-3-wedo.png`
- `comms/S02/turn-01/screenshots/phone-perfect-4-youdo.png`
- `comms/S02/turn-01/screenshots/phone-perfect-5-results-full.png`
- `comms/S02/turn-01/screenshots/phone-perfect-5-results.png`

## S03 — Spike: mic check

Approved after turn 1, 2026-11-18. Review: `comms/S03/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Review-script steps 1 to 7 need a real microphone, so none were run live. The simulator showed the "We can hear you." state only.
- The amber "Too quiet" and "No sound yet" states and the real mic-denied message were not captured.
- The mic-disconnected message (step 7) was not captured.
- The iPhone home-screen app with wired headphones was not tested.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Idle (light, dark) | OK | OK | `screenshots/idle-laptop.png`, `idle-phone.png`, `idle-*-dark.png` |
| Running, sim C4 (light, dark) | OK | OK | `screenshots/running-laptop.png`, `running-phone.png`, `running-*-dark.png` |
| Stopped, C4 still listed (light, dark) | OK | OK | `screenshots/stopped-phone-dark.png`, `stopped-laptop.png`, `stopped-phone.png` |
| Start error (no mic in headless browser) | OK | OK | `screenshots/error-phone.png` |
| Home with Mic check link | OK | OK | `screenshots/home-phone.png` |

### Screenshots

- `comms/S03/turn-01/screenshots/error-phone.png`
- `comms/S03/turn-01/screenshots/home-phone.png`
- `comms/S03/turn-01/screenshots/idle-laptop-dark.png`
- `comms/S03/turn-01/screenshots/idle-laptop.png`
- `comms/S03/turn-01/screenshots/idle-phone-dark.png`
- `comms/S03/turn-01/screenshots/idle-phone.png`
- `comms/S03/turn-01/screenshots/running-laptop-dark.png`
- `comms/S03/turn-01/screenshots/running-laptop.png`
- `comms/S03/turn-01/screenshots/running-phone-dark.png`
- `comms/S03/turn-01/screenshots/running-phone.png`
- `comms/S03/turn-01/screenshots/stopped-laptop-dark.png`
- `comms/S03/turn-01/screenshots/stopped-laptop.png`
- `comms/S03/turn-01/screenshots/stopped-phone-dark.png`
- `comms/S03/turn-01/screenshots/stopped-phone.png`

## S04 — Spike: narrower pitch axis on the graph

Approved after turn 1, 2026-11-18. Review: `comms/S04/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Singing with a real microphone: sharp by a small amount, and the octave-low step in the review script. I used the simulated singer only.
- Dark mode was not captured. S04 changes no colours.
- A phone screenshot with the live dashed line caught mid-note. The octaveDown live frame was captured before the first note, so only the results graph shows the dashed line.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| You do, live graph (octaveDown, flat40, perfect) | OK | OK | `screenshots/laptop-octaveDown-live.png`, `screenshots/phone-flat40-live.png`, `screenshots/*-perfect-live.png` |
| Results, passed (perfect, flat40) | OK | OK | `screenshots/laptop-perfect-results.png`, `screenshots/laptop-flat40-results.png`, `screenshots/phone-*-results.png` |
| Results, wrong octave (octaveDown) | OK | OK | `screenshots/phone-octaveDown-results.png`, `screenshots/laptop-octaveDown-results.png` |

### Screenshots

- `comms/S04/turn-01/screenshots/laptop-flat40-live.png`
- `comms/S04/turn-01/screenshots/laptop-flat40-results.png`
- `comms/S04/turn-01/screenshots/laptop-octaveDown-live.png`
- `comms/S04/turn-01/screenshots/laptop-octaveDown-results.png`
- `comms/S04/turn-01/screenshots/laptop-perfect-live.png`
- `comms/S04/turn-01/screenshots/laptop-perfect-results.png`
- `comms/S04/turn-01/screenshots/phone-flat40-live.png`
- `comms/S04/turn-01/screenshots/phone-flat40-results.png`
- `comms/S04/turn-01/screenshots/phone-octaveDown-live.png`
- `comms/S04/turn-01/screenshots/phone-octaveDown-results.png`
- `comms/S04/turn-01/screenshots/phone-perfect-live.png`
- `comms/S04/turn-01/screenshots/phone-perfect-results.png`

## S05 — Spike: open on Home, not the range test

Approved after turn 1, 2026-11-18. Review: `comms/S05/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Review script step 2 (loading a saved profile in Settings, then Home with range and progress). I did not click through it.
- Review script step 3 (completing the range test needs a microphone).
- Review script step 1 (reset in Settings) was checked only as a fresh load. I did not exercise the reset button.
- Real iPhone rendering. I used a 393×852 emulation.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Home, no range | OK | OK | `screenshots/home-laptop.png`, `screenshots/home-phone.png` |
| Lesson link, no range (redirects to Home) | OK | OK | `screenshots/lesson-x-laptop.png`, `screenshots/lesson-x-phone.png` |
| Home, no range, dark mode | OK | OK | `screenshots/dark/home-laptop-dark.png`, `screenshots/dark/home-phone-dark.png` |

### Screenshots

- `comms/S05/turn-01/screenshots/home-laptop.png`
- `comms/S05/turn-01/screenshots/home-phone.png`
- `comms/S05/turn-01/screenshots/lesson-x-laptop.png`
- `comms/S05/turn-01/screenshots/lesson-x-phone.png`

## S06 — Spike: ignore the piano leaking into the microphone

Approved after turn 2, 2026-11-18. Review: `comms/S06/turn-02/ui-review.md`.

### Not verified by the UI reviewer

Review script steps with real speakers and a microphone are left for the owner. These are whether the gate level suits the owner's laptop, whether quiet singing still counts, and the no-notice behaviour with headphones. I used only the simulator.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| We do running, sim=bleed | OK | OK | `screenshots/laptop-bleed-wedo-running.png`, `screenshots/iphone-bleed-wedo-running.png` |
| We do running, sim=perfect | OK | OK | `screenshots/laptop-perfect-wedo-running.png`, `screenshots/iphone-perfect-wedo-running.png` |
| We do finished, sim=bleed | OK | Minor | `screenshots/laptop-bleed-wedo-done.png`, `screenshots/iphone-bleed-wedo-done.png` |
| We do ready, sim=bleed (notice) | OK | OK | `screenshots/laptop-bleed-wedo-ready.png`, `screenshots/iphone-bleed-wedo-ready.png` |

### Screenshots

- `comms/S06/turn-02/screenshots/iphone-bleed-wedo-done.png`
- `comms/S06/turn-02/screenshots/iphone-bleed-wedo-ready.png`
- `comms/S06/turn-02/screenshots/iphone-bleed-wedo-running.png`
- `comms/S06/turn-02/screenshots/iphone-bleedSing-wedo-done.png`
- `comms/S06/turn-02/screenshots/iphone-bleedSing-wedo-ready.png`
- `comms/S06/turn-02/screenshots/iphone-bleedSing-wedo-running.png`
- `comms/S06/turn-02/screenshots/iphone-perfect-wedo-done.png`
- `comms/S06/turn-02/screenshots/iphone-perfect-wedo-ready.png`
- `comms/S06/turn-02/screenshots/iphone-perfect-wedo-running.png`
- `comms/S06/turn-02/screenshots/laptop-bleed-wedo-done.png`
- `comms/S06/turn-02/screenshots/laptop-bleed-wedo-ready.png`
- `comms/S06/turn-02/screenshots/laptop-bleed-wedo-running.png`
- `comms/S06/turn-02/screenshots/laptop-bleedSing-wedo-done.png`
- `comms/S06/turn-02/screenshots/laptop-bleedSing-wedo-ready.png`
- `comms/S06/turn-02/screenshots/laptop-bleedSing-wedo-running.png`
- `comms/S06/turn-02/screenshots/laptop-perfect-wedo-done.png`
- `comms/S06/turn-02/screenshots/laptop-perfect-wedo-ready.png`
- `comms/S06/turn-02/screenshots/laptop-perfect-wedo-running.png`

## S07 — Spike: clearer next step and a lighter look

Approved after turn 3, 2026-11-19. Review: `comms/S07/turn-03/ui-review.md`.

### Not verified by the UI reviewer

- Real microphone, piano sound and headphones.
- iPhone Safari rendering and tap comfort.
- Results screens in light and dark; not re-captured this turn.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Lesson header (s2-03, range 45–64, sim=perfect) | OK | OK | `screenshots/measure-393.png`, `screenshots/measure-360.png`, `screenshots/measure-1280.png` |

Turn-1 screens were not re-captured. Turn 3 touched only the header CSS.

### Screenshots

- `comms/S07/turn-03/screenshots/measure-1280.png`
- `comms/S07/turn-03/screenshots/measure-360.png`
- `comms/S07/turn-03/screenshots/measure-393.png`

## S08 — Spike: accuracy percentage and best score per lesson

Approved after turn 1, 2026-11-22. Review: `comms/S08/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Dark mode was not captured.
- Review-script step 5 (export and import on another browser) was not run.
- Real singing was not tested. I used the simulated singer, so "perfect" gave 99–100%, as the coder noted.
- Today's practice was not captured.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Lesson intro, no best | OK | OK | `screenshots/laptop-intro-nobest.png`, `screenshots/phone-intro-nobest.png` |
| Lesson intro, with best | OK | OK | `screenshots/laptop-intro-best.png`, `screenshots/phone-intro-best.png` |
| Results, first attempt (new best) | OK | OK | `screenshots/laptop-results-perfect.png`, `screenshots/phone-results-perfect.png` |
| Results, lower accuracy (Best: n%) | OK | OK | `screenshots/laptop-results-flat40.png`, `screenshots/phone-results-flat40.png` |
| Match lesson results | OK | OK | `screenshots/laptop-match-results.png`, `screenshots/phone-match-results.png` |
| Home statuses (seeded) | OK | OK | `screenshots/phone-home-status.png` (text: "✓ Passed · 91%", "◐ Learn · Best 74%", "◐ Learn · Started") |

### Screenshots

- `comms/S08/turn-01/screenshots/laptop-home.png`
- `comms/S08/turn-01/screenshots/laptop-intro-best.png`
- `comms/S08/turn-01/screenshots/laptop-intro-nobest.png`
- `comms/S08/turn-01/screenshots/laptop-match-intro.png`
- `comms/S08/turn-01/screenshots/laptop-match-results.png`
- `comms/S08/turn-01/screenshots/laptop-results-flat40.png`
- `comms/S08/turn-01/screenshots/laptop-results-perfect.png`
- `comms/S08/turn-01/screenshots/phone-home-status.png`
- `comms/S08/turn-01/screenshots/phone-home.png`
- `comms/S08/turn-01/screenshots/phone-intro-best.png`
- `comms/S08/turn-01/screenshots/phone-intro-nobest.png`
- `comms/S08/turn-01/screenshots/phone-match-intro.png`
- `comms/S08/turn-01/screenshots/phone-match-results.png`
- `comms/S08/turn-01/screenshots/phone-results-flat40.png`
- `comms/S08/turn-01/screenshots/phone-results-perfect.png`

## S09 — Spike: let pitch-finding notes run their full length, then report

Approved after turn 1, 2026-11-23. Review: `comms/S09/turn-01/ui-review.md`.

### Not verified by the UI reviewer

- Real microphone singing: the feel of staying on the note, and the cents text on real singing (steps 1–3 of the Review script).
- The countdown against real audio, and the piano playback.
- A real iPhone.
- Today's practice Pitch finding was not captured. It uses the same MatchRun component.
- Dark mode was not captured.

### Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Find one note (s1a-02), intro | OK | OK | `screenshots/perfect-laptop-intro.png`, `screenshots/perfect-phone-intro.png` |
| Singing, matched early, countdown bar | OK | OK | `screenshots/perfect-laptop-singing.png`, `screenshots/perfect-phone-singing.png` |
| After a note, line under "Listen…" | OK | OK | `screenshots/perfect-laptop-afternote.png`, `screenshots/perfect-phone-afternote.png` |
| Results, sim=perfect | OK | OK | `screenshots/perfect-laptop-results.png`, `screenshots/perfect-phone-results.png` |
| Results, sim=flat40 | Issue (UI-S09-T1-01) | Issue (UI-S09-T1-01) | `screenshots/flat40-laptop-results.png`, `screenshots/flat40-phone-results.png` |

### Screenshots

- `comms/S09/turn-01/screenshots/flat40-laptop-afternote.png`
- `comms/S09/turn-01/screenshots/flat40-laptop-intro.png`
- `comms/S09/turn-01/screenshots/flat40-laptop-results.png`
- `comms/S09/turn-01/screenshots/flat40-laptop-singing.png`
- `comms/S09/turn-01/screenshots/flat40-phone-afternote.png`
- `comms/S09/turn-01/screenshots/flat40-phone-intro.png`
- `comms/S09/turn-01/screenshots/flat40-phone-results.png`
- `comms/S09/turn-01/screenshots/flat40-phone-singing.png`
- `comms/S09/turn-01/screenshots/perfect-laptop-afternote.png`
- `comms/S09/turn-01/screenshots/perfect-laptop-intro.png`
- `comms/S09/turn-01/screenshots/perfect-laptop-results.png`
- `comms/S09/turn-01/screenshots/perfect-laptop-singing.png`
- `comms/S09/turn-01/screenshots/perfect-phone-afternote.png`
- `comms/S09/turn-01/screenshots/perfect-phone-intro.png`
- `comms/S09/turn-01/screenshots/perfect-phone-results.png`
- `comms/S09/turn-01/screenshots/perfect-phone-singing.png`
