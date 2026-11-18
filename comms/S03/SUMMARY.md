# S03 — Spike: mic check — Summary

**Approved:** 2026-11-17 · **Turns:** 1 · **Branch merged:** `epic/S03` into `main`

## What was accomplished

- A new **Mic check** screen at `/mic-check`. It answers "can the app hear me?" before a lesson.
- After you tap Start it shows a live loudness bar with a mark at the level the pitch detector needs. The bar turns amber when you are too quiet.
- It shows a plain status line: "No sound yet…", "Too quiet…", "We hear sound but no clear note…" or "We can hear you."
- It shows "Hearing: <note>" and lights the sung key on a C2–C6 piano.
- Notes you hold for about 0.3 s are listed under "Notes caught". The newest is first, with up to 8 chips and a "Last note" line. The list stays after Stop. Clear empties it.
- Errors stop the check and leave Start available. They cover sound paused, mic missing, mic denied and mic disconnected mid-check.
- Leaving the screen stops the microphone.
- Links to the screen: "🎤 Mic check" in the Home header, and a link in the Settings "Check your microphone" section next to the tuner link.
- The tuner at `/dev/tuner` is unchanged.

This was built on `main` outside the loop. The coder confirmed it matches the epic and only added the epic notes.

## Changes made during review

None. Approved in turn 1.

## How to test it

1. Run `npm run dev` and open the app. Or open `/#/mic-check` directly. Add `?sim=const:60` to use a simulated C4 with no microphone.
2. From Home, tap "Mic check". The screen shows a title, instructions, Start and "Notes caught" with "None yet. Hold a note for a moment to catch it."
3. Tap Start and allow the microphone. Stay silent. The status should say "No sound yet. Sing or hum a steady note."
4. Whisper. The bar should move and turn amber, with "Too quiet…".
5. Hum a steady note. The bar should pass the mark. The status should say "We can hear you.", the note should be named, and its key should light on the piano.
6. Hold the note for about half a second. It should appear under Notes caught. Hum two more notes. They should appear newest first.
7. Tap Stop. The meter goes away and the caught notes stay. Tap Clear. The list empties.
8. On the iPhone home-screen app with wired headphones, repeat steps 2–5.
9. Unplug the headphones' mic mid-check. You should see "The microphone disconnected. Reconnect it, then tap Start." Start should work again after you reconnect.
10. Open Settings. "Check your microphone" should have a "Mic check" link and the tuner link.
11. Automated checks: `npm run lint`, `npm test` (285 pass), `npm run test:e2e` (50 pass), `npm run build`. All passed in review.

## Not verified by the agents

- Review script steps 1–7 with a real microphone. Only the simulated C4 state ("We can hear you.") was seen.
- The amber "Too quiet" and "No sound yet" states, and the real mic-denied message, were not captured.
- The mic-disconnected message (step 9) was not captured.
- The iPhone home-screen app with wired headphones was not tested.

## Known issues and deferred items

- UI-S03-T1-01 (non-blocking, open, in `comms/S03/turn-01/ui-review.md`): "Hearing: C4" is small body text, about 18 px. The piano also jumps down when Start is tapped, because the meter and status rows appear. The reviewer suggests making the note 2 rem or larger and reserving space for the meter and status.
- The generic mic-start fallback message ("Could not start the microphone. Check your settings and try again.") is less specific than the others.

## For the owner to decide

None. `FOR-OWNER.md` does not exist, and no requirement changes were proposed. You could decide whether to fix UI-S03-T1-01 in a later epic.
