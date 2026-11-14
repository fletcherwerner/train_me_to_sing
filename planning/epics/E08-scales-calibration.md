# E08 — Stage 2 scales, tighter tolerances, latency calibration

## Goal

Add the scale lessons with their tighter tolerance profiles, and a calibration step so timing is graded fairly on each device.

## What you will review

Stage 2 on the home screen with eight scale lessons, and a calibration screen that measures and stores your device's delay.

## Depends on

E07.

## Scope

In: Stage 2 content, per-lesson tolerance display, latency calibration, faster-tempo checks.
Out: songs.

## Specification

### Content

- `src/content/builtin/stage2.ts`: the eight lessons from `02-lesson-catalog.md` with `t2`/`t3` as listed. Write a `goal` for each.
- Register them in the built-in source. No engine or UI change should be needed to make them appear; if one is, record why in the epic notes.

### Tolerance shown to the student

- Lesson intro shows the profile in plain words: "Pitch: within 40 cents · Hold: 60% of each note · Timing: within 0.3 s".
- Home stage header shows a short note when a stage is stricter than the previous one.

### Latency calibration (`/settings/calibrate`)

Purpose: measure the delay between when the app schedules a sound and when the student's response is detected, so scoring can subtract it.

1. Intro: "Put on the headphones you practise with. You'll hear 8 clicks. Say 'ta' sharply on each one."
2. Play 4 count-in clicks, then 8 measured clicks at 60 bpm.
3. Record `rms` from the pitch source frames. Detect onsets: a frame where `rms` rises above `3 ×` the median `rms` of the count-in period, after at least 300 ms below that level.
4. For each measured click, take the nearest onset within ±600 ms; `error = onsetTime − clickTime`.
5. Need at least 5 matched clicks, else "Couldn't hear clear sounds — try again."
6. Result = median error, rounded to 10 ms, clamped to 0–500 ms. Show "Measured delay: 180 ms" with Save and Retry.
7. Save to `settings.latencyOffsetMs`.

- Put the onset detection in `src/core/scoring/onsets.ts` as a pure function `detectOnsets(frames, thresholdRms)` so it can be tested.
- Settings shows the current value with a manual slider (0–500 ms, step 10) and a link to calibrate.
- The `Lesson` screen already passes `latencyOffsetMs` to the frame recorder (E05); verify that it does.
- If the offset has never been calibrated, show a one-time hint on the first Stage 2 lesson intro linking to calibration.

### Faster notes

- Lesson s2-07 uses eighth notes at 72 bpm (0.42 s each). Confirm in tests that `evaluateAttempt` handles notes this short: the scoop allowance is `min(150 ms, 25%)` and the 80 ms onset run still fits.

## Tests

- Stage 2 lessons pass the generic content tests from E07.
- `detectOnsets`: synthetic rms bursts at known times are found within one frame; continuous loud signal gives one onset.
- Calibration maths: errors `[170, 180, 185, 190, 400]` → median 185 → stored as 190 (round half up to the nearest 10). The outlier 400 does not affect the result.
- `evaluateAttempt` with `late300` frames and `latencyOffsetSec: 0.3` applied by the recorder → all hits under `t4`.
- Short-note case: perfect singing of s2-07 scores 1 under `t3`.
- Playwright `?sim=perfect`: complete s2-03; home shows Stage 2 "1 of 8 passed".

## Review script

1. Home shows Stage 2 with eight lessons. Lessons needing an octave are disabled if your range is under 12 semitones.
2. Settings → Calibrate. Follow the prompt. A plausible value appears (wired headphones on a laptop: roughly 50–150 ms; Bluetooth: often 150–300 ms). Save.
3. Run it twice more; values should agree within about 40 ms.
4. Do s2-01. Notes you sing on the click are not marked late.
5. Set the slider to 500 ms and repeat — notes are now marked early. Restore the calibrated value.
6. Do s2-07 (eighth notes) and s2-05 (full scale). Record in feedback whether the tolerances feel fair.
7. Repeat steps 2 and 4 on the iPhone. The stored value is per device.
