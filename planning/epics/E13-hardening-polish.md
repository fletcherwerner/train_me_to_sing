# E13 — Hardening and polish: audio recovery, run-screen layout, UI leftovers

## Goal

Close the gaps found by a review of the finished app against `planning/00-product-overview.md`, `planning/ui-requirements.md` and the approved epics. Three kinds of work:

1. **Audio recovery.** The app has no handling for the audio clock stopping or the microphone disconnecting. When either happens, a screen freezes with no message.
2. **Run-screen layout.** Since S02 added the pitch graph, the lesson screen no longer fits the window during a run, and on the phone the Stop bar covers the note chips.
3. **UI leftovers.** Every non-blocking finding the reviewers left open, plus the items the owner deferred to "the final UI pass".

Nothing here adds a feature. Scoring rules, lesson data, storage format and the session state machine do not change.

## What you will review

- A range test, lesson and calibration that say what went wrong and offer a retry when sound or the microphone stops, instead of freezing.
- A lesson run where the title, step, graph, piano, target and sung notes, note chips and Stop are all on screen at once, on the laptop and the phone.
- The same button, link and dialog styles on every screen.

## Depends on

E12 (run order only). Touches screens from E03, E06, E07, E08, E10, E11, S01 and S02.

## Scope

In: sections A to D below.

Out: new lessons; changes to scoring or tolerances; profiles on the phone or in the built app; a native audio plugin; anything in "Left for the owner" at the end of this file; editing `planning/ui-requirements.md` (only the owner edits it).

## Review findings this epic answers

Measured on `main` at commit `ac0410a`. `npm run lint`, `npm test` (259), `npm run build`, `npm run test:e2e` (31) and `npm run test:harness` (39) all pass, so none of these is caught by a test today.

| # | Finding | Evidence |
|---|---------|----------|
| F1 | Nothing watches the audio clock. `unlockAudio()` (`src/audio/audioEngine.ts:14`) awaits `resume()` with no timeout and never checks the result. No file listens for `statechange`. | The owner hit this: after a reset the range test's 3-2-1 countdown never moved. `RangeSetup.tsx` `record()` reads `now()` in a `setInterval` and never calls `unlockAudio()`, so a suspended context freezes it for good. |
| F2 | A lesson run ends on a wall-clock `setTimeout` (`src/audio/exercisePlayer.ts:56`). If the audio clock stalls mid-run, the run "finishes" and is scored from frames whose times stopped advancing. A You do attempt is then saved as a failed attempt. | Code reading. Only `visibilitychange` is handled (`Lesson.tsx:115`). |
| F3 | A microphone that disconnects mid-session (headphones unplugged, Bluetooth drops) is not noticed. `MicPitchSource.ts` never listens for the track's `ended` event. Every later note scores "No sound detected". | Code reading. |
| F4 | `getUserMedia` errors other than `NotAllowedError` (for example no microphone at all) give the generic "could not start" message. | `MicPitchSource.ts:50`. UR-25. |
| F5 | During a run the page is taller than the window: phone 393×852 You do is 994 px tall (142 px over); laptop 1280×800 is 924 px (124 px over). | UR-22. On the laptop the lesson title scrolls off the top once Start is pressed. |
| F6 | On the phone the sticky controls bar sits on top of the note chips during a run and on the results screen, cutting them in half. | UR-10, UR-21. `Lesson.css` `@media (max-width: 699px)`. |
| F7 | The piano colours the sung key "match" whenever the sung pitch rounds to the target key, ignoring the lesson's tolerance. With `sim=flat40` on a `t3` lesson (±35 cents) every key is green while every note is scored a miss. | UR-03, UR-24. `PianoKeyboard.tsx:56`. E05's notes record that the tolerance is applied only by the cents meter. |
| F8 | Buttons and links are browser defaults and differ by screen: the lesson's Home is a blue underlined link, the range screen's Home is a button, Settings links are plain text. The results screen shows Home twice. | UR-24. Open findings UI-E03-T2-01, UI-E06-T2-02, UI-E08-T2-02. |
| F9 | Step labels render as "I do· We do· You do" (no space before the dot). The per-note miss list on results is left-aligned in a centred page with no heading. A blank 44 px spacer sits above the lyric line in You do. | Owner's E06 notes; `Lesson.tsx` step list and `.lesson-phrase--spacer`. |
| F10 | Narrow chips clip their text ("F#3" shows as "F#", "cross" as "cros"). | UI-E09-T2-02. `SequenceStrip.tsx` `MIN_W = 28`. |
| F11 | The range-limit labels ("low", "high") and key labels on the piano are 8 px SVG text; the off-keyboard arrow label is 11 px. Unreadable at arm's length. | UR-05, UR-06. UI-E01-T2-01. `PianoKeyboard.css:30-33`. |
| F12 | The pitch graphs have no legend. | UI-S02-T1-01, UR-24. |
| F13 | Import progress: Replace, Merge and Cancel are three identical buttons with the destructive one first and no warning. The prompt is unboxed and is not scrolled into view. | UI-E10-T1-01, UI-E10-T1-02. `Settings.tsx:165`. |
| F14 | Settings shows a "Developer pages" list to the student. The links are about 18 px tall. | UI-E07-T1-02, UR-23. |
| F15 | Home: disabled rows lay out differently depending on the length of the reason; long titles push the status onto its own line ("Natural minor scale up and down"); "Profile:Name" has no space; the My songs Delete button is taller than its row. | UI-E07-T1-01, UI-S01-T1-01, UI-E11-T1-02. |
| F16 | Import MIDI: "Last bar" wraps away from "First bar" on the phone. | UI-E11-T1-01. |
| F17 | `saveData` (`src/storage/schema.ts:63`) calls `localStorage.setItem` with no `try`. A full or blocked store throws inside a click handler and the attempt is lost silently. | Code reading. |
| F18 | The lesson screen's Home links drop the `?sim=` query; Home and Settings keep it. | E07 notes. `Lesson.tsx` uses `to="/"`. |
| F19 | `tsconfig.tsbuildinfo` is committed and changes on every build. | `git ls-files`. |

## Specification

### A. Audio recovery

#### A1. Audio engine (`src/audio/audioEngine.ts`)

Add, keeping `getAudioContext`, `unlockAudio` and `now` as they are for existing callers:

```ts
/** Resumes the context from a tap and confirms the clock is really advancing. */
export async function ensureAudioRunning(timeoutMs = 1500): Promise<boolean>

/** Calls onStall once if the audio clock stops advancing. Returns a stop function. */
export function watchAudioClock(onStall: () => void, opts?: { intervalMs?: number; stallMs?: number }): () => void
```

- `ensureAudioRunning`: call `ctx.resume()` raced against `timeoutMs`; a rejection counts as failure. Then require `ctx.state === 'running'` and `ctx.currentTime` to increase within 300 ms. Return `false` otherwise. It never throws.
- `watchAudioClock`: defaults `intervalMs = 250`, `stallMs = 1000`. On each tick compare `ctx.currentTime` with the last tick. If it has not increased for `stallMs` of wall time, or `ctx.state !== 'running'`, call `onStall` once and stop.
- Put the stall decision in a small pure helper, `createStallDetector(stallMs)` with `sample(audioSec, wallMs): boolean`, so it is unit tested with made-up numbers. Suggested home: `src/core/session/stallDetector.ts`.
- **Clock rule.** The architecture's "one clock" rule covers musical timing. The watchdog and the resume timeout are the only places `performance.now()` or `setTimeout` may measure wall time. Say so in a comment.
- **Test hook.** When the URL has a `sim=` parameter, expose `window.__tmtsTest = { suspendAudio(), resumeAudio(), loseMic() }`. `suspendAudio` calls `ctx.suspend()`. `loseMic` is described in A3. Without `sim=` the object is not defined.

#### A2. Use it on every screen that runs on the audio clock

Wording is fixed so tests can match it:

- Sound did not start: **"Sound is paused on this device. Check your headphones, then tap Try again."**
- Sound stopped mid-run: **"The sound stopped. Check your headphones and microphone, then tap Try again."**

| Screen | On Start / Record / Play | During the run |
|--------|--------------------------|----------------|
| `RangeSetup.tsx` | `start()` and `record()` both `await ensureAudioRunning()` first. On `false`: go to the `fail` step with the "paused" message. `record()` currently does not resume at all; this is the owner's frozen countdown. | Start `watchAudioClock` when recording starts; stop it when the window ends or the screen unmounts. On stall: clear the timer, go to `fail` with the "stopped" message. "Try again" returns to `find`, and the next Record goes through `ensureAudioRunning` again. |
| `Lesson.tsx` | `begin()` and `run()` use `ensureAudioRunning()` in place of `unlockAudio()`. On `false` in `run()`: dispatch `STOP` and show the "paused" message in the existing `notice`. | Watch while `running`. On stall: call the existing `stop()` and show the "stopped" message. A stalled You do run must not call `recordAttempt` and must not show Results. |
| `Calibrate.tsx` | Same as the lesson. | Same: stop the measurement, show the "stopped" message, offer Retry. |
| `dev/TunerDev.tsx`, `dev/ExerciseDev.tsx`, `dev/AttemptDev.tsx` | Use `ensureAudioRunning()`; show the "paused" message on `false`. | Not required. |

The existing `visibilitychange` handling in `Lesson.tsx` ("Paused — tap to restart") stays.

#### A3. Microphone lost or missing

- `src/audio/pitch/PitchSource.ts`: add an optional method to the interface. This is an addition to a shared type in `planning/01-architecture.md`; record it in `docs/epic-notes/E13.md`.

  ```ts
  /** Called once if the source stops producing input by itself (the mic was unplugged). Returns unsubscribe. */
  onLost?(cb: () => void): () => void;
  ```

- `MicPitchSource.ts`: after `getUserMedia`, listen for `ended` on the audio track and call the `onLost` callbacks. Do not call them from `stop()`.
- `SyntheticPitchSource.ts`: implement `onLost` and a way to trigger it, used only by `window.__tmtsTest.loseMic()`. After it fires the source emits no more frames.
- `MicPitchSource.start()` error mapping: `NotAllowedError` → `mic-denied` (as now); `NotFoundError` or `OverconstrainedError` → `mic-missing`; anything else rethrown.
- Messages:
  - `mic-missing`: **"No microphone was found. Plug one in or check your sound settings, then press Start again."** (Range intro, lesson intro, calibrate, tuner.)
  - Lost: **"The microphone disconnected. Reconnect it, then tap Reconnect microphone."**
- On lost, `Lesson.tsx` stops the run in progress (no attempt recorded), shows the message, and shows a **Reconnect microphone** button in the controls row in place of the run button. Reconnect creates and starts a new source, keeps the current step and its earlier results, and restores the run button. `RangeSetup.tsx` goes to `fail` with the message, and "Try again" reconnects before returning to `find`. `Calibrate.tsx` stops and offers Retry, which reconnects.

### B. Lesson run-screen layout

This replaces S02's allowance that "on the phone the lesson screen may now scroll vertically".

#### B1. Fit the window during a run

Requirement, checked for lessons `s1-05`, `s3-01` (lyrics) and `s3-04` (lyrics and phrases) in I do, We do and You do, idle and running:

| Window | Requirement |
|--------|-------------|
| 1280×800 and 393×852 | No vertical page scroll (`scrollHeight <= clientHeight`). Lesson title, step labels, instruction, beat indicator, graph, piano, Target/Sung line, cents meter (We do, You do), the chip strip and the run button are all inside the window and none overlaps another. |
| 393×660 (iPhone Safari with its toolbars showing) | The page may scroll. Without scrolling: graph, piano, Target/Sung line and the Stop button are in view. The sticky controls bar must never cover content: when the page is scrolled to the bottom everything above the bar is fully visible. |

How to get there is the coder's choice, within these limits:

- Put Home and the lesson title on one header row (Home at the left, title centred) instead of two stacked blocks.
- Remove the `.lesson-phrase--spacer` gap. When a step has no phrase picker, nothing takes its place. The layout shifting by that amount between We do and You do is accepted.
- The graph may shrink from S02's 160 px (phone) / 220 px (laptop) but not below 110 px. Update the height assertion in `tests/e2e/pitchGraph.spec.ts` to the new values.
- The live chip strip is a single row that scrolls sideways inside itself and keeps the current chip in view. It must not wrap during a run and must not make the page scroll sideways.
- The piano keeps a height of at least 80 px.
- The We do results graph (added in commit `ac0410a`) appears only after a run, below the practice line. The page may scroll when it is showing; it is not part of the "during a run" requirement.

#### B2. Results screen

- Order: header (Home + title), verdict, score, pass mark, tip, **action buttons (Try again, Hear it again)**, legend and graph, chips, misses grouped by line (songs), per-note list.
- The action buttons are not sticky on this screen.
- One Home link only, in the header.
- UR-13 still holds at both sizes: verdict, score and pass mark are visible without scrolling. Add: the action buttons are also visible without scrolling at 393×852.
- Per-note list: give it a heading, "Missed notes", and keep it left-aligned as a block centred in the page (not text-centred). Keep the two-column layout on the laptop.

#### B3. Piano match colour follows the lesson's tolerance

- `PianoKeyboard` gets an optional prop `matchCents?: number` (default `50`).
- With a target and a sung pitch: the sung key is "match" only when `Math.round(sungMidi) === targetMidi` **and** `|sungMidi − targetMidi| × 100 <= matchCents`. Otherwise it is "off", including when it is the same key but outside the tolerance.
- When the sung key is the target key but "off", the target key shows the "off" colour (the sung state wins, as it does today for "match").
- With no target (tuner, range setup) behaviour is unchanged.
- `Lesson.tsx` and `dev/AttemptDev.tsx` pass `tol.cents`.
- The off-keyboard arrow uses the same rule.

#### B4. Legible piano labels and chips

- Range-limit labels ("low", "high") and the off-keyboard arrow label: at least 12 px as rendered at 393 px width, measured with `getBoundingClientRect` on the text. The SVG scales with its `viewBox`, so set the size from the rendered scale, or draw these labels as HTML positioned over the SVG.
- Octave key labels ("C3"): at least 10 px rendered, or hidden when they would be smaller.
- Chips: no chip's text may be clipped (`scrollWidth <= clientWidth` for the note name and the lyric). Either size the chip to its content, with duration setting only a minimum width, or reduce the font. Applies to the live strip and the results strip.

#### B5. Graph legend

Under the live graph in We do and You do, and above both results graphs, one line: a thick black sample labelled **"target"** and a thin red sample labelled **"you"**. In I do only "target" shows. The samples are drawn (thick and thin), so the legend does not rely on colour. `aria-hidden="true"`, like the graph.

### C. One look across screens

#### C1. Shared styles (`src/index.css`)

Define once and use on every screen (Home, RangeSetup, Lesson, results, Settings, ProfilesSection, Calibrate, ImportMidi, the dev pages):

- `.btn`: the default button. At least 48 px high, 1 px border in `currentColor`, 8 px radius, transparent background, `color: inherit`.
- `.btn--primary`: filled with the app theme colour (`#1f3a5f`; in dark mode a lighter tint with at least 4.5:1 contrast against its text). Exactly one per screen state: the action the student is expected to take next (Start, Record, Use this, Save, Play / Sing along / Start, Stop while running, Try again on a failed result, Create profile).
- `.btn--danger`: red border and text. Used for Reset progress, Replace, Delete and their confirm buttons.
- `.nav-link`: the Home / Settings / "Redo range test" / "Calibrate timing" / "Import a MIDI file" style. It looks like a `.btn` (same height and border) and is used for every in-app navigation link. Replaces `.tap-link`, `.dev-home`, `.lesson-home-button` and the range screen's Home `<button>`, which becomes a `Link`.
- Every screen puts Home in the same place: top left, first element.
- Colours must work in light and dark mode (UR-27). Prefer `currentColor`, system colours and CSS variables set under `@media (prefers-color-scheme: dark)` over hard-coded hex. Fix `RangeSetup.css` (`#e5e7eb` progress track) and any other hard-coded light-only value you touch.

Do not add a CSS framework or any dependency.

#### C2. Lesson screen details

- Step labels read "I do · We do · You do" with equal space on both sides of each dot.
- Lesson Home links keep the query string, the way `Home.tsx` does (`to={{ pathname: '/', search }}`).

#### C3. Home

- A row is always two lines when the status does not fit beside the title: title and note count first, status below, left-aligned. No row may put the status on the right for some titles and below for others at the same width. Simplest: on windows narrower than 700 px, always stack.
- Disabled rows: the reason always sits on its own line and starts with "Doesn't fit:", for example "Doesn't fit: needs 7 semitones; your range is 3".
- "Profile: Name" has a space after the colon.
- My songs Delete is a `.btn--danger` no taller than its row.
- The Settings link is a `.nav-link` with a space between the gear and the word.

#### C4. Settings

- **Import prompt.** A bordered box with the heading "Import progress". Buttons in this order: **Merge** (`.btn--primary`), **Cancel**, then, separated from the first two, **Replace** (`.btn--danger`). Above Replace, one line: "Replace deletes the range and progress on this device. This cannot be undone." When the prompt appears, scroll it into view and move focus to its heading. The summary also states how many lessons were attempted, for example "1 lesson passed, 3 attempted".
- **Developer pages.** Replace the list with a section titled "Check your microphone" holding one `.nav-link` to `/dev/tuner`, labelled "Open the tuner". The other three dev links show only when `import.meta.env.DEV` is true. All four routes stay registered.
- The slider thumb is at least 28 px wide as drawn, with its 44 px touch area kept.

#### C5. Import MIDI

Each option label sits above its field. First bar and Last bar sit side by side as two equal columns, each label above its own box. Nothing wraps mid-pair at 393 px.

### D. Small fixes

- **D1. Storage write failure.** `saveData` catches a throwing `setItem` and returns `false`. The store keeps the new state in memory and sets a flag; show a non-blocking notice, "Couldn't save on this device. Your progress will be lost when you close the app. Export it from Settings." Reuse the notice pattern in `ProfileNotices.tsx`. The flag clears on the next successful save.
- **D2.** Stop tracking `tsconfig.tsbuildinfo` (`git rm --cached`) and add it to `.gitignore`.

## Tests

Unit (Vitest):

- `createStallDetector`: advancing clock never stalls; a frozen clock stalls only after `stallMs`; one late tick followed by progress does not stall.
- `ensureAudioRunning` with a fake context: resolves `true` when running and advancing; `false` when `resume()` never settles (fake timers); `false` when `resume()` rejects; `false` when state stays `suspended`.
- `MicPitchSource` error mapping for `NotAllowedError`, `NotFoundError` and an unknown error (mock `navigator.mediaDevices.getUserMedia`).
- `SyntheticPitchSource.onLost` fires once and frames stop.
- `PianoKeyboard`: target 64, sung 63.6 → "off" with `matchCents={35}` and "match" with `matchCents={50}`; sung 64.2 → "match" with both; no target → unchanged.
- `saveData` returns `false` when `setItem` throws; the store sets and clears the flag.
- Import summary text includes the attempted count.

End to end (Playwright), with `sim=` sources:

- **Range, sound stops.** `/#/range?sim=range:45,64` → Start → Record → `__tmtsTest.suspendAudio()` during the countdown → the "sound stopped" message and Try again appear within 3 s. Try again → Record → the countdown runs and a result is reached. (Record resumes the context, since it is a tap.)
- **Range, sound paused before Record.** Suspend while on `find`, press Record: recording proceeds normally, because Record resumes.
- **Lesson, sound stops.** `s1-05?sim=perfect`, in You do call `suspendAudio()` mid-run → the "sound stopped" message; Results is not shown; Home afterwards shows the lesson as not started (no attempt saved).
- **Lesson, mic lost.** In We do call `loseMic()` mid-run → the "disconnected" message and a Reconnect microphone button. Press it, then Sing along completes with a practice line.
- **Run fits.** For `s1-05`, `s3-01` and `s3-04`, in You do while running, at 1280×800 and 393×852: `scrollHeight <= clientHeight`; the bounding boxes of the title, graph, piano, chip strip and Stop are inside the window; the chip strip's box does not intersect the controls' box. At 393×660: graph, piano and Stop are in the window.
- **Chips not clipped.** For `s3-04` at 393 px, in the live strip and on results, no chip has `scrollWidth > clientWidth`.
- **Results.** At 393×852 the verdict, score, pass mark and Try again are in the window without scrolling; exactly one Home link exists.
- **Piano tolerance.** `s3-01?sim=flat40` in You do: the sung key has the "off" class while a note is sounding.
- **Legend.** Present in You do and on results; in I do it shows only "target".
- **Import prompt.** After picking a valid file the prompt is in the window, Merge has the primary class and Replace the danger class.
- **Settings.** In the production preview (the port 4173 server the offline test uses), "Open the tuner" is present and the links to `/dev/piano`, `/dev/exercise` and `/dev/attempt` are not.
- Update existing specs for changed wording or structure. Do not delete an assertion without replacing it.

All of `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` pass. Write `docs/epic-notes/E13.md` as the definition of done requires, listing the `PitchSource.onLost` addition and the S02 graph-height change as deviations.

## Review script

1. Open Settings → Redo range test → Start → Record. The 3-2-1 countdown runs and a note is recorded. Press Try again, then Record. It counts down again.
2. During a countdown, unplug or switch the headphones (or put the laptop to sleep and wake it). Within a few seconds the screen says the sound stopped and offers Try again, which works.
3. Start a lesson, and in We do pull out the headphones or turn Bluetooth off. The run stops with the "disconnected" or "sound stopped" message. Reconnect, tap the offered button, and the lesson carries on from the same step.
4. On the laptop, open Hot Cross Buns and run You do. Without scrolling you can see the title, the step, the graph, the piano, Target/Sung, the chips and Stop.
5. On the phone, do the same. Nothing is covered by the Stop button.
6. Sing a note slightly flat on purpose. The key on the piano shows the "off" colour while the meter shows you outside the green band, and the note is marked a miss on the results.
7. Results: the buttons are under the tip, there is one Home, the graph has a "target / you" legend, and the missed notes list has a heading.
8. Walk Home → Settings → Calibrate → Import a MIDI file → Range test in light and dark mode. Buttons and Home look the same everywhere; one button on each screen stands out as the next step.
9. Settings → Import progress with an export file. The prompt is boxed and in view, Merge stands out, Replace is set apart with a warning.
10. Settings no longer lists developer pages, but "Open the tuner" works.

## Left for the owner (not work for the coder)

These came out of the same review and cannot be done by an agent.

| Item | Where it came from |
|------|--------------------|
| Listen to all 21 built-in melodies; the catalog rule requires a person to hear each one. Frère Jacques' ending (`0 -5 0:2`) is the one to check first. | E07, E09 notes |
| Run each epic's review script on a real iPhone with a real microphone: tuner, range test, a Stage 1 lesson, a song, calibration. Nothing has been checked on a device or by ear. | Every epic's "not verified" list in `comms/UI-PASS.md` |
| Judge whether the tolerances feel fair once calibrated (E08 review step 6). | E08 notes |
| Deploy to GitHub Pages and check the app and offline launch under the `/<repo>/` path, Add to Home Screen, wake lock, and whether the mic prompt repeats in standalone mode. | E10 notes, PLAN-E10-T1-01 |
| iOS: supply a bundle id (placeholder `com.example.trainmetosing` in `capacitor.config.ts`), run the Simulator `xcodebuild` from `docs/ios-build.md`, install Node 22 and move `@capacitor/cli` from 7.6.10 to ^8.6.2, then re-check `ios/App/CapApp-SPM/Package.swift` after `cap sync`. | `comms/E12/FOR-OWNER.md`, E12 notes |
| Reword UR-01 in `planning/ui-requirements.md` ("There is no scrolling piano roll"), which S02 deliberately contradicts, and add a change-log line. Consider adding the 393×660 window from B1 to UR-22. | `comms/S02/FOR-OWNER.md` |
| Decide whether profiles should work on the phone and in the built app. Today they exist only under `npm run dev`. That would be a new spike. | S01 notes |
