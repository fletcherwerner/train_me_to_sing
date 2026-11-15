# Owner notes — E05

## 2026-11-15

I reviewed the running and result states of `/dev/attempt` myself, at laptop and phone width, with `sim=perfect` and `sim=octaveDown`. They passed as expected:

- The target key is blue. For `octaveDown` the sung key is a different colour and an octave away.
- The strip chips are coloured and labelled.
- The result table fits at 393 px.
- The score and Pass/Fail are visible.

Treat UI-E05-T1-01 and UI-E05-T2-01 as resolved by the owner's check. The count-in, running and result states no longer need a reviewer's screenshot to clear them.

For future reviews: start the dev server with `node harness/dev-server.mjs start` and read the address with `appUrl()` (`harness/lib/app-url.mjs`). Do not assume port 5173.
