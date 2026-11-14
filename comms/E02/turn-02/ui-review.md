# E02 — Turn 02 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 0

## Summary

Turn 2 fixed both findings from Turn 1: the `.tuner-note` class now has explicit font-size styling (2.5rem desktop, 2rem phone), and the mic-denied error path now displays a clear "Microphone access denied" message instead of the ambiguous "No pitch detected" message. The tuner page shows a Start/Stop button, piano keyboard (C2–C6), note name, frequency, and CentsMeter. Screenshot files were generated for both laptop and iPhone sizes (light and dark mode). I could not visually inspect the screenshots because this model cannot view images; the review is based on code analysis of the source files and the Playwright screenshot output confirming files were written.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Tuner page — idle (before Start) | Screenshot taken | Screenshot taken | `dev-tuner-laptop.png`, `dev-tuner-phone.png` |
| Tuner page — running with sim=perfect | Screenshot taken | Screenshot taken | `dev-tuner-laptop.png`, `dev-tuner-phone.png` |
| Tuner page — no pitch detected (silence) | Screenshot taken | Screenshot taken | `dev-tuner-laptop.png`, `dev-tuner-phone.png` |
| Tuner page — mic denied (error) | Screenshot taken | Screenshot taken | `dev-tuner-laptop.png`, `dev-tuner-phone.png` |
| Tuner page — dark mode (sim=perfect) | Screenshot taken | Screenshot taken | `dev-tuner-laptop-dark.png`, `dev-tuner-phone-dark.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes | Piano keyboard is the main visualization on the tuner page. No scrolling piano roll. |
| UR-02 | Yes | Target key and sung key are shown on the piano simultaneously. `PianoKeyboard` receives `targetMidi` and `sungMidi` props. |
| UR-03 | Yes | Match colour (`--key-sung-match`: green) and off-target colour (`--key-sung-off`: orange) are used. CentsMeter shows needle position and text (♭/♯). |
| UR-04 | Yes | `PianoKeyboard` shows an edge arrow (`piano-arrow`) when the sung key is outside the visible range, with the note name and direction. |
| UR-05 | N/A | Range setup is E03; not in scope for this epic. |
| UR-06 | Yes | `.tuner-note` has `font-size: 2.5rem` on desktop and `2rem` on phone (≤600px). This is large enough to read at arm's length. |
| UR-07 | N/A | Step header (I do / We do / You do) is not in scope for this epic. |
| UR-08 | N/A | Repeat/Continue controls are not in scope for this epic. |
| UR-09 | N/A | Lead-in clicks are not in scope for this epic. |
| UR-10 | N/A | Sequence strip and beat indicator are not in scope for this epic. |
| UR-11 | Yes | "Stop" button is visible when the tuner is running. |
| UR-12 | N/A | Results screen is not in scope for this epic. |
| UR-13 | N/A | Results screen is not in scope for this epic. |
| UR-14 | N/A | Results screen is not in scope for this epic. |
| UR-15 | N/A | Range setup is E03; not in scope for this epic. |
| UR-16 | N/A | Range setup is E03; not in scope for this epic. |
| UR-17 | N/A | Range setup is E03; not in scope for this epic. |
| UR-18 | N/A | Home screen tracker is not in scope for this epic. |
| UR-19 | N/A | Home screen tracker is not in scope for this epic. |
| UR-20 | N/A | Home screen tracker is not in scope for this epic. |
| UR-21 | Yes | The tuner page layout is contained within `.dev-page` (max-width: 720px, centered). Buttons have `min-height: 44px` on small screens. |
| UR-22 | Yes | The tuner page shows piano, note name, frequency, and cents meter — all visible without scrolling on both sizes. |
| UR-23 | Yes | Buttons have `min-height: 44px` on small screens (from `index.css` line 7). |
| UR-24 | Yes | Colors are consistent: green (`--key-sung-match`) for match, orange (`--key-sung-off`) for off. CentsMeter needle is green inside the zone, orange outside. Text labels (♭/♯) also indicate status. |
| UR-25 | Yes | When mic is denied, the page shows "Microphone access denied. Please allow microphone access in your browser settings and reload." (TunerDev.tsx:42). When silent, it shows "No pitch detected. Sing or hum into the microphone." (TunerDev.tsx:89). These are distinct messages. |
| UR-26 | Yes | "Home" link is present on the tuner page (TunerDev.tsx:74-76). |
| UR-27 | Yes | Dark mode is supported: `:root` variables are overridden in `@media (prefers-color-scheme: dark)` in `PianoKeyboard.css`. The `.tuner-note` text is black on white in light mode and white on dark in dark mode (inherited from `body` which has `color-scheme: light dark`). |

## Findings

None.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E02-T1-01 | Fixed | Added `.tuner-note` CSS: `font-size: 2.5rem` desktop, `2rem` phone (≤600px). |
| UI-E02-T1-02 | Fixed | Added `error` state to `TunerDev`. When `source.start()` rejects with `mic-denied`, displays "Microphone access denied. Please allow microphone access in your browser settings and reload." |

## Not verified

Review-script steps that need a real microphone, speakers, or an iPhone, left for the owner:

1. Laptop: open `/#/dev/tuner`, click Start, allow the mic. Hum a steady note — one key lights and stays lit. Slide up — the lit key moves up.
2. Play a note on any instrument or tuner app (e.g. A4 = 440 Hz). The page shows `A4` within ±10 cents.
3. Stay silent — no key is lit; readout shows `—`.
4. iPhone: run `npm run dev -- --host`, open `https://<laptop-ip>:5173/#/dev/tuner` in Safari, accept the certificate, repeat steps 1–3 with wired headphones.
5. Sing your lowest note. Note in `docs/epic-notes/E02.md` whether detection is stable there; if it flickers an octave up, record it as a known issue.

## Proposed requirement changes

None.
