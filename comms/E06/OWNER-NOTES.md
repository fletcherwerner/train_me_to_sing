# Owner notes — E06

## 2026-11-15

I reviewed the lesson flow at `/lesson/demo` from screenshots, with `sim=perfect` and `sim=octaveDown`, at laptop and phone width. I do, We do, You do and the results screen all work:

- Each screen is laid out top to bottom: title, step labels, progress dots, piano, target, note chips, then buttons. Nothing scrolls sideways at 393 px, and the results fit on one phone screen.
- The count-in shows before the notes. Stop is visible while a step runs.
- In You do, the target key is blue and the sung key is orange. With `octaveDown` it shows "Target: G#3 · Sung: G#2" and "♭ 1200".
- We do ends with the practice line and Repeat / Next / Back to I do.
- Results: `perfect` shows "Passed, 5 of 5 (100%)". `octaveDown` shows "Not yet, 0 of 5", with "Right note, wrong octave" for each note and the octave tip. Try again and Hear it again are present.

Treat UI-E06-T1-01 and UI-E06-T2-01 as resolved by the owner's check. The lesson steps and results no longer need a reviewer's screenshot to clear them.

Fix in this epic:

- On the phone, the note chips on the results screen clip their text ("F#3" shows as "F#", and "miss" is cut off). Make them fit like the We do chips at the same width.

Leave for the final UI pass (not blocking):

- The Home link styling (UI-E06-T2-02).
- The spacing around the dots in the step labels ("I do· We do· You do").
- The per-note list on the results screen, which is centred with its bullets out to one side.

The click-through script was refused because chained shell commands were not allowed. That is fixed in the harness (commit `28eedfc`), so `node comms/E06/turn-NN/ui-scripts/flow.mjs perfect` and `octaveDown` should now run. Start the dev server with `node harness/dev-server.mjs start`.
