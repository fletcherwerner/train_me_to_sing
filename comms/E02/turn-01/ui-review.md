# E02 — Turn 01 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 1

## Summary

The tuner page builds the core pitch detection pipeline and displays a piano keyboard, note name, frequency, and cents meter. However, the note name text has no explicit font-size styling, making it potentially too small to read at arm's length on the phone (UR-06). Additionally, the "No pitch detected" message appears when the mic is denied, which is ambiguous — the user cannot distinguish between silence and an error. I could not take screenshots because the dev server could not be started in the background; this review is based on code analysis of the source files.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Tuner page — idle (before Start) | Code analysis only | Code analysis only | None (dev server could not be started) |
| Tuner page — running with sim=perfect | Code analysis only | Code analysis only | None (dev server could not be started) |
| Tuner page — no pitch detected (silence) | Code analysis only | Code analysis only | None (dev server could not be started) |
| Tuner page — mic denied (error) | Code analysis only | Code analysis only | None (dev server could not be started) |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes | — |
| UR-02 | Yes | — |
| UR-03 | Yes | — |
| UR-04 | Yes | — |
| UR-05 | N/A | Range setup is E03; not in scope for this epic. |
| UR-06 | No | UI-E02-T1-01 |
| UR-07 | N/A | Step header (I do / We do / You do) is not in scope for this epic. |
| UR-08 | N/A | Repeat/Continue controls are not in scope for this epic. |
| UR-09 | N/A | Lead-in clicks are not in scope for this epic. |
| UR-10 | N/A | Sequence strip and beat indicator are not in scope for this epic. |
| UR-11 | Partial | Stop button exists, but there is no clear error handling when the mic is denied. |
| UR-12 | N/A | Results screen is not in scope for this epic. |
| UR-13 | N/A | Results screen is not in scope for this epic. |
| UR-14 | N/A | Results screen is not in scope for this epic. |
| UR-15 | N/A | Range setup is E03; not in scope for this epic. |
| UR-16 | N/A | Range setup is E03; not in scope for this epic. |
| UR-17 | N/A | Range setup is E03; not in scope for this epic. |
| UR-18 | N/A | Home screen tracker is not in scope for this epic. |
| UR-19 | N/A | Home screen tracker is not in scope for this epic. |
| UR-20 | N/A | Home screen tracker is not in scope for this epic. |
| UR-21 | Partial | Buttons have min-height 44px on small screens, but note text has no explicit sizing. |
| UR-22 | Partial | The tuner page shows piano, note name, frequency, and cents meter, but the note name may be too small on the phone. |
| UR-23 | Yes | Buttons have min-height 44px on small screens (from index.css). |
| UR-24 | Yes | Colors are consistent: green for match, orange for off. Text labels also indicate status. |
| UR-25 | No | UI-E02-T1-02 |
| UR-26 | Yes | "Home" link is present on the tuner page. |
| UR-27 | Partial | Dark mode is supported for the piano keyboard and cents meter, but the note name text has no explicit dark-mode styling. |

## Findings

### UI-E02-T1-01 — Note name text has no explicit font-size, may be too small on iPhone

- **Severity:** Blocking
- **Status:** Open
- **Where:** `src/ui/screens/dev/TunerDev.tsx:85`, `.tuner-note` class has no CSS styling
- **Requirement:** UR-06 — "The current note name (and the current syllable in songs) is large enough to read at arm's length on the phone."
- **Problem:** The note name is rendered in a `<div className="tuner-note">` but there is no CSS rule setting its font-size. It inherits the default body font-size (no explicit size in `index.css`), which is likely too small to read at arm's length on an iPhone. The CentsMeter has `font-size: 1.2rem` but the note name does not.
- **Change needed:** Add a CSS rule for `.tuner-note` with a font-size large enough to read at arm's length on the phone (e.g., `font-size: 2rem` or larger, with a media query for smaller screens if needed).

### UI-E02-T1-02 — "No pitch detected" message is ambiguous when mic is denied

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** `src/ui/screens/dev/TunerDev.tsx:75-77`
- **Requirement:** UR-25 — "Problems are explained in plain words with the next action: microphone denied, no sound heard, no range set, lesson does not fit."
- **Problem:** When `started` is true and `frame?.midi == null`, the page shows "No pitch detected. Sing or hum into the microphone." This message is the same whether the user is silent or the mic was denied. If `getUserMedia` is denied, the user sees this message but has no way to know that the problem is a permission error rather than silence. The plan-reviewer also flagged that `MicPitchSource.start()` does not reject with `mic-denied` on permission denied (PLAN-E02-T1-02), which means the error path is not handled at the pitch source level either.
- **Change needed:** When `source.start()` rejects (e.g., with a `mic-denied` error), display a clear "Microphone access denied" message with instructions to check browser settings. This requires both fixing `MicPitchSource.start()` to reject with `mic-denied` (plan-reviewer finding) and updating `TunerDev.tsx` to catch and display the error.

## Previous findings

None (turn 1).

## Not verified

Review-script steps that need a real microphone, speakers, or an iPhone, left for the owner:

1. Laptop: open `/#/dev/tuner`, click Start, allow the mic. Hum a steady note — one key lights and stays lit. Slide up — the lit key moves up.
2. Play a note on any instrument or tuner app (e.g. A4 = 440 Hz). The page shows `A4` within ±10 cents.
3. Stay silent — no key is lit; readout shows `—`.
4. iPhone: run `npm run dev -- --host`, open `https://<laptop-ip>:5173/#/dev/tuner` in Safari, accept the certificate, repeat steps 1–3 with wired headphones.
5. Sing your lowest note. Note in `docs/epic-notes/E02.md` whether detection is stable there; if it flickers an octave up, record it as a known issue.

## Proposed requirement changes

None.
