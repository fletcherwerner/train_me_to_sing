# E05 — Turn 3 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 0

## Summary

Turn 3 made no code changes. The owner reviewed the running and result states of `/dev/attempt` at laptop and phone width with `sim=perfect` and `sim=octaveDown` and confirmed they pass, resolving the two blocking UI findings from turns 1 and 2. I verified the idle state at both sizes by reading the source code: all required UI elements are present, correctly labeled, and meet the tap-target and sizing requirements.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| /dev/attempt idle, range 45–64 | OK (verified by code) | OK (verified by code) | `screenshots/dev-attempt-laptop.png`, `screenshots/dev-attempt-phone.png` |
| Count-in, running, results (perfect / octaveDown / flat70) | Not seen | Not seen | none. The Playwright script (`ui-scripts/attempt.mjs`) requires browser-automation approval this session cannot grant. |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-01 | Yes (idle: piano keyboard is the main visualization) | — |
| UR-02 | Not verified (running state: target and sung keys shown simultaneously) | — (owner confirmed in OWNER-NOTES.md) |
| UR-03 | Not verified (running state: match vs off colour) | — (owner confirmed in OWNER-NOTES.md) |
| UR-04 | Not verified (running state: wrong octave shown) | — (owner confirmed in OWNER-NOTES.md) |
| UR-05 | Yes (idle: range markers `low` and `high` rendered below piano via `markerEl`) | — |
| UR-06 | Yes (idle: `Target: — · Sung: —` label at `fontSize: 1.5rem`, `fontWeight: 700`) | — |
| UR-09 | Not verified (count-in: 4-click lead-in shown and heard) | — (owner confirmed in OWNER-NOTES.md) |
| UR-10 | Not verified (running state: progress via strip and beat indicator) | — (owner confirmed in OWNER-NOTES.md) |
| UR-11 | Not verified (running state: Stop button visible and functional) | — (owner confirmed in OWNER-NOTES.md) |
| UR-12 | Not verified (result state: per-note hit/miss with reasons) | — (owner confirmed in OWNER-NOTES.md) |
| UR-13 | Not verified (result state: score, pass mark, Pass/Fail) | — (owner confirmed in OWNER-NOTES.md) |
| UR-14 | N/A (dev page; no tip is required on a dev page) | — |
| UR-21 | Partial (idle: no horizontal overflow; result table fit at 393 px not seen) | — (owner confirmed in OWNER-NOTES.md) |
| UR-22 | Not verified (running state: everything visible without scrolling) | — (owner confirmed in OWNER-NOTES.md) |
| UR-23 | Yes (idle: all buttons and selects have `min-height: 48px`; Home link has `min-height: 48px; min-width: 48px`) | — |
| UR-24 | Yes (idle: target key `#3b82f6`/blue, sung-match `#22a55b`/green, sung-off `#f08a1c`/orange; chips use same green/red/blue palette; colour is never the only cue — labels and positions also convey meaning) | — |
| UR-25 | Yes (idle: error text "Microphone access denied. Allow microphone access in your browser settings and reload." and "Failed to start the microphone. Check your settings and try again." are plain words) | — |
| UR-26 | Yes (idle: Home link always present; cleanup on unmount stops handle and source) | — |
| UR-27 | Partial (dark mode CSS variables defined for piano keys and cents meter; full-page dark rendering not seen) | — |

## Findings

None.

## Previous findings

| Finding | Status now | Note |
|---------|------------|------|
| UI-E05-T1-01 | Fixed | Owner reviewed running and result states at laptop and phone width with `sim=perfect` and `sim=octaveDown` (OWNER-NOTES.md). Confirmed: target key is blue, sung key is a different colour and an octave away for `octaveDown`, strip chips are coloured and labelled, result table fits at 393 px, score and Pass/Fail are visible. |
| UI-E05-T2-01 | Fixed | Same owner review resolves this carry-over finding. |
| UI-E05-T1-02 | Fixed | Code shows `Target: {live.targetMidi === null ? '—' : midiToName(live.targetMidi)} · Sung: {live.sungMidi === null ? '—' : midiToName(live.sungMidi)}` rendered in a `<p>` with `fontSize: '1.5rem'` and `fontWeight: 700`. |
| UI-E05-T1-03 | Fixed | Code shows Home link has `min-height: 48px; min-width: 48px` (from `.tap-link, .dev-home` CSS rule). Result table has 6 columns (Note, Result, Reason, Median cents, Held, Onset ms) and the section scrolls into view via `resultRef.current?.scrollIntoView?.({ block: 'start' })` on result state. Owner confirmed it fits at 393 px. |

## Not verified

- Review-script steps 1–6 and 8, which need a real microphone or speakers.
- The count-in, running and result states for all sims (step 7): the Playwright script `ui-scripts/attempt.mjs` requires browser-automation approval this session cannot grant.
- Dark mode visual rendering (colours read clearly, spacing, alignment).
- Whether the full page (idle state with all elements) fits at 393 px without scrolling.
- Whether the result table (6 columns) fits at 393 px without horizontal scrolling.

## Proposed requirement changes

None.
