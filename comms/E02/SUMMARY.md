# E02 — Mic pitch detection and live tuner — Summary

**Approved:** 2026-11-14 · **Turns:** 2 · **Branch merged:** `epic/E02` into `main`

## What was accomplished

Built a live tuner page (`/dev/tuner`) that turns microphone input into a stream of pitch frames and displays the sung note on a piano keyboard in real time.

- **Pitch detection pipeline** — `MicPitchSource` captures audio from the microphone (echo cancellation, noise suppression, and auto gain all disabled), detects pitch using the `pitchy` library, applies 5-frame median smoothing, and emits frames at up to 60 fps.
- **Synthetic pitch source** — `SyntheticPitchSource` for testing, usable via the `sim=const:<midi>` query parameter (e.g. `?sim=const:60.3` emits C4 at +30 cents).
- **CentsMeter component** — A horizontal bar from −100 to +100 with a centre tolerance zone, a colour-coded needle (green inside, orange outside), and text showing the cents offset (e.g. `♭ 30`, `♯ 12`, or `—`).
- **Tuner page** — Start/Stop buttons, a piano keyboard (C2–C6), large note name display, frequency in Hz, and a CentsMeter against the nearest key (tolerance 50 cents). Display updates are throttled to ~30 fps.
- **Error handling** — When the mic is denied, the page shows a clear "Microphone access denied" message. When silent, it shows "No pitch detected."
- **Home page** — Updated with a link to the tuner page.

## Changes made during review

- PLAN-E02-T1-01: Added 5-frame median smoothing to `MicPitchSource` (was emitting raw values).
- PLAN-E02-T1-02: Wrapped `getUserMedia` in a try/catch that rejects with `new Error('mic-denied')` on `NotAllowedError`.
- PLAN-E02-T1-03: Fixed `SyntheticPitchSource` to track elapsed time and pass a monotonically increasing `tSec` to the behaviour function.
- PLAN-E02-T1-04 + UI-E02-T1-01 + UI-E02-T1-02: Added `error` state to `TunerDev` with a clear "Microphone access denied" message, and added `.tuner-note` CSS (2.5rem desktop, 2rem phone).

## How to test it

1. **Load the tuner page.** Open `https://localhost:5173/#/dev/tuner` on a laptop or `https://<laptop-ip>:5173/#/dev/tuner` on an iPhone. The page shows a Start button, a piano keyboard (C2–C6), and a "Home" link.
2. **Test synthetic mode.** Open `https://localhost:5173/#/dev/tuner?sim=const:60.3`. Click Start. The note "C4" appears in large text, and the CentsMeter shows `♯ 30` (within ±2 cents). A piano key lights up.
3. **Test mic denial (test environment).** Open `https://localhost:5173/#/dev/tuner` without the `sim` parameter. Click Start. The page shows "Microphone access denied. Please allow microphone access in your browser settings and reload." (`.tuner-error` is visible).
4. **Run automated checks.**
   - `npm run lint` — passes (0 errors).
   - `npm test` — passes (4 files, 19 tests).
   - `npm run test:e2e` — passes (3 tests: page loads, sim mode shows C4 and ♯, error when no mic).
   - `npm run build` — passes.

## Not verified by the agents

These steps require a real microphone, speakers, or an iPhone and were not verified by the coding or review agents:

1. **Laptop with live mic.** Open `/#/dev/tuner`, click Start, allow the mic. Hum a steady note — one key lights and stays lit. Slide up — the lit key moves up.
2. **Play a reference note.** Play a note on any instrument or tuner app (e.g. A4 = 440 Hz). The page shows the correct note name within ±10 cents.
3. **Silence.** Stay silent — no key is lit; readout shows `—`.
4. **iPhone Safari.** Run `npm run dev -- --host`, open `https://<laptop-ip>:5173/#/dev/tuner` in Safari, accept the certificate, repeat steps 1–3 with wired headphones.
5. **Lowest note detection.** Sing your lowest note. Check `docs/epic-notes/E02.md` for whether detection is stable there; if it flickers an octave up, record it as a known issue.

## Known issues and deferred items

- None beyond the general pitch detection limitations documented in the product overview (octave jumps on low or breathy notes).

## For the owner to decide

None. (No `FOR-OWNER.md` was provided for this epic.)
