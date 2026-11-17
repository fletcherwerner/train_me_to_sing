# S03 — Spike: mic check

> **Recorded after the fact.** The owner asked for this directly and it was built outside the build loop, on `main`, after E13. This file records what was built so the loop can review it. If the driver runs S03, the coder's job is to confirm the work below matches this file and the checks pass, and to fix any gaps, not to rebuild it.

## Goal

A quick way to answer "can the app hear me?" before a lesson. One screen shows a live loudness bar, a plain-language status, the note being heard right now, and a list of the notes caught while checking. Caught notes stay on screen after Stop, so the student can see what the app heard.

The existing tuner (`/dev/tuner`) stays for exact pitch in cents. The mic check is the simple version for everyone.

## What you will review

From Home, tap Mic check, tap Start and hum. The bar moves with your voice, the status says "We can hear you.", the note you hum lights on the piano and is named. Hold a note and it appears under "Notes caught"; it is still there after Stop.

## Depends on

E13 (run order only), E02 pitch source (`createPitchSource`, `PitchFrame.rms`, `MicPitchSource` `MIN_RMS` 0.01), E13 audio recovery (`ensureAudioRunning`, `PitchSource.onLost`, `src/ui/audioMessages.ts`), E01 `PianoKeyboard`.

## Scope

In: a `/mic-check` screen; links to it from the Home header and the Settings "Check your microphone" section; a pure note catcher with unit tests; Playwright tests.
Out: recording or playing back audio; saving caught notes; changing pitch detection thresholds; changing the tuner.

## Specification

### Note catcher (pure, `src/core/session/noteCatcher.ts`)

- `createNoteCatcher({ holdSec = 0.3 })` returns `{ push(frame), reset() }`.
- `push` takes `{ tSec, midi }` and returns `{ midi, tSec }` when the voice has stayed on the same key (rounded MIDI) for `holdSec`, otherwise `null`.
- Each hold is caught once. A `null` frame or a different key starts a new run, so the same note sung twice with a gap is caught twice.

### Screen (`src/ui/screens/MicCheck.tsx`, route `/mic-check`)

- Layout, top to bottom: Home link, title "Mic check", one line of instructions, Start / Stop, then while running the level bar, status line and "Hearing: <note>", then a piano C2–C6 with the sung key lit, then "Notes caught".
- **Level bar:** `role="meter"`, log scale of `rms` from 0.002 to 0.3. A thin mark shows the level the pitch detector needs (rms 0.01). The fill is amber when too quiet, theme colour otherwise.
- **Status**, from the latest frame:
  - rms below 0.004 or no frame: "No sound yet. Sing or hum a steady note."
  - rms below 0.01: "Too quiet. Move closer to the microphone or sing louder."
  - loud enough but no pitch: "We hear sound but no clear note. Hum one steady note."
  - pitch found: "We can hear you."
- **Notes caught:** "Last note: <name>" and up to 8 chips, newest first and highlighted. A Clear button empties the list. Before any note: "None yet. Hold a note for a moment to catch it." The list survives Stop and Start; it is not saved.
- **Errors:** sound paused (`SOUND_PAUSED_MSG`), mic missing (`MIC_MISSING_MSG`), mic denied, and mic lost mid-check ("The microphone disconnected. Reconnect it, then tap Start."). Each stops the check and leaves Start available.
- Leaving the screen stops the microphone.
- UI updates are throttled to about 30 per second; the catcher sees every frame.

### Links

- Home header: "🎤 Mic check" under Settings (`data-testid="home-mic-check"`).
- Settings, "Check your microphone": "Mic check" link with one line on what it does, then the existing tuner link.

## Tests

- `noteCatcher.test.ts`: a held note is caught once; a short note is not; a sequence catches each note; the same note after a gap is caught again; silence is never caught; `reset` starts over.
- `tests/e2e/micCheck.spec.ts`, at 1280 and 393 px with `sim=const:60`: Home link opens the screen; after Start the status is "We can hear you.", Hearing is C4, the meter is above 50; C4 is caught; no horizontal scroll; after Stop the meter is gone and C4 is still listed; Clear empties the list. Settings links to the screen.

## Review script

1. From Home, tap Mic check. Tap Start and allow the microphone.
2. Stay silent: the status says no sound yet. Whisper: the bar moves, amber, "Too quiet".
3. Hum a steady note: the bar passes the mark, the status says "We can hear you.", the note is named and lit on the piano.
4. Hold the note about half a second: it appears under Notes caught. Hum two more notes; they appear newest first.
5. Tap Stop: the caught notes stay. Tap Clear: the list empties.
6. On the iPhone home-screen app, with wired headphones, repeat 1–4.
7. Unplug the headphones' mic mid-check: the disconnected message shows and Start works again after reconnecting.
