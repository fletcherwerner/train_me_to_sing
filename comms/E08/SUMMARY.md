# E08 — Stage 2 scales, tighter tolerances, latency calibration — Summary

**Approved:** 2026-11-15 · **Turns:** 2 · **Branch merged:** `epic/E08` into `main`

## What was accomplished

- Home now shows Stage 2 with eight scale lessons (s2-01 to s2-08). Lessons that need an octave are disabled, with a reason such as "Needs 12 semitones; your range is 8", if your range is too small.
- Each Stage 2 lesson intro states its tolerance in plain words (pitch, hold, timing). The Stage 2 header on Home notes that it is stricter than Stage 1, with a "Calibrate timing" link.
- New calibration screen at `/settings/calibrate`. It plays 4 count-in clicks and 8 measured clicks at 60 bpm, listens for your "ta", and shows "Measured delay: N ms" with Save and Retry. If fewer than 5 clicks are matched, it says "Couldn't hear clear sounds" and offers Try again. The screen shows "Count-in n of 4" and "Click n of 8", and has a Stop button and a Home link.
- Settings has a full-width 0–500 ms delay slider (step 10) with −10/+10 buttons and a link to calibrate. The saved value is applied when notes are scored.
- The first Stage 2 lesson (s2-01) shows a calibration hint until you have calibrated.
- Lesson s2-07 (eighth notes at 72 bpm) is tested to score 1 for perfect singing.

## Changes made during review

- UI-E08-T1-01: the calibration run showed nothing and had no Stop. It now shows the count-in and click number, plus a Stop button that stops the clicks and the microphone.
- UI-E08-T1-02: the delay slider was too small on a phone. It is now full width with a 44 px thumb, −10/+10 buttons and a range label.
- UI-E08-T1-03: Calibrate had no way back to Home and the result screen could not be reached in review. A Home link and a `?sim=calibrate:<ms>` test hook were added.

## How to test it

1. Setup: `npm install`, then `npm run dev`. Open the printed URL.
2. Home: Stage 2 lists eight lessons with a stricter-than-Stage-1 note. With a range under 12 semitones, octave lessons are disabled with a reason.
3. Open s2-01. The intro shows the tolerance line and the calibration hint.
4. Go to `/#/settings/calibrate`. Put on headphones, press Start, and say "ta" on each of the 8 clicks after the 4 count-in clicks. A value appears (wired is roughly 50–150 ms, Bluetooth often 150–300 ms). Press Save. Settings shows the value, and the hint on s2-01 is gone.
5. Repeat the run twice more. The values should agree within about 40 ms.
6. During a run, press Stop. The run ends and the microphone is released.
7. Do s2-01. Notes you sing on the click should not be marked late.
8. In Settings, set the slider to 500 ms and repeat s2-01. Notes should now be marked early. Restore the calibrated value.
9. Do s2-07 and s2-05 and note whether the tolerances feel fair.
10. Without a microphone, open `/#/settings/calibrate?sim=calibrate:200` and press Start. Count-in and click counters show, then "Measured delay" with Save and Retry.
11. Repeat steps 4 and 7 on the iPhone. The value is stored per device.
12. Automated: `npm run lint`, `npm test` (157 pass), `npm run test:e2e` (20 pass), `npm run build`. The e2e suite includes completing s2-03 with `?sim=perfect` and Home showing "1 of 8 passed".

## Not verified by the agents

- Calibration with a real microphone, the plausibility and repeatability of measured values (steps 4–5).
- That the clicks are audible.
- Lateness marking with the calibrated value and with 500 ms (steps 7–8), and whether tolerances feel fair on s2-07 and s2-05.
- Anything on a real iPhone.
- Dark mode.
- The Stage 2 Home note link was checked in code only, with no new screenshot.

## Known issues and deferred items

- UI-E08-T1-04: the last Stage 2 row puts its status under the title instead of on the right, and disabled rows have no lock icon (`comms/E08/turn-02/ui-review.md`).
- UI-E08-T2-02 (from T1-05): Calibrate and Settings use default browser button styling (`comms/E08/turn-02/ui-review.md`).
- UI-E08-T2-01: the slider thumb looks about 15 px wide, and the 44 px touch area is unconfirmed. The −10/+10 buttons are the fallback.
- The calibrate hint shows on every visit to s2-01 until you calibrate, not once only. This is recorded in `docs/epic-notes/E08.md`.
- `?sim=` lessons use constant-rms audio, so calibration there reports "Couldn't hear clear sounds". Use `?sim=calibrate:<ms>`.
- The slider does not mark the device as calibrated. Only a saved calibration does.

## For the owner to decide

None
