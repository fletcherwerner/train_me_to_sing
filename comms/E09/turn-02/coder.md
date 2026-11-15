# E09 — Turn 2 — Coder Report

**Status:** READY FOR REVIEW

## Summary

Fixed the two blocking UI findings (Stop button below the fold on laptop, clipped and hidden result chips) and the three non-blocking ones, using CSS and small markup changes. I could not re-measure the laptop fit in a browser this turn, so the UI reviewer should confirm that Stop is visible at 1280×800.

## What was built or changed

| Area | Files | Notes |
|------|-------|-------|
| Strip | `SequenceStrip.tsx/.css` | `expanded` prop (results view shows every chip); result chips grow to fit the hit/miss label |
| Results | `Lesson.tsx/.css` | Tip moved under the score; miss lists left-aligned, two-column; line summary bold |
| Laptop fit | `Lesson.css` | At max-height 900px and min-width 700px: piano capped at 100px, tighter padding and margins |
| Layout shift | `Lesson.tsx/.css` | A 44px spacer holds the selector's place in You do |
| Now singing | `NowSinging.css` | Current syllable 3rem (about twice its neighbours), centred, full width |

## Checks

| Command | Result |
|---------|--------|
| `npm run lint` | pass |
| `npm test` | pass (197 of 197) |
| `npm run test:e2e` | pass (22 of 22) |
| `npm run build` | pass |

## Response to findings

| Finding | Response | What was done, or why disputed or deferred |
|---------|----------|--------------------------------------------|
| UI-E09-T1-01 | Fixed | Piano 110px shorter and spacing tightened at laptop heights. About 80px saved against about 47px overflow. Not re-measured by screenshot. |
| UI-E09-T1-02 | Fixed | Results strip is `expanded` (no cap, no inner scroll). Result chips use auto height, so the label is not clipped. |
| UI-E09-T1-03 | Fixed | Spacer keeps the selector row height in You do. |
| UI-E09-T1-04 | Fixed | Current syllable 3rem, centred. |
| UI-E09-T1-05 | Fixed | Tip directly under score; lists left-aligned in two columns. |

## Not done

Nothing. Laptop fit not verified by screenshot.

## Assumptions and deviations

The savings estimate for T1-01 is from CSS values, not a measurement.

## How to see it

`npm run dev`, then Stage 3 > Twinkle at a 1280×800 window, then I do, You do and results.
