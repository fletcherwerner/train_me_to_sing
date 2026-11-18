# S06 — Turn 2 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The blocking finding is fixed. With `sim=bleed` in We do, the readout now says "Sung: —", no sung key lights, and the cents meter shows no green match. With `sim=perfect` the readout shows "Sung: G#3" with a green key and "0", so real singing is unaffected. Results still show 0 of 5 and the headphones notice. Two non-blocking items remain open, both deferred by the coder.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| We do running, sim=bleed | OK | OK | `screenshots/laptop-bleed-wedo-running.png`, `screenshots/iphone-bleed-wedo-running.png` |
| We do running, sim=perfect | OK | OK | `screenshots/laptop-perfect-wedo-running.png`, `screenshots/iphone-perfect-wedo-running.png` |
| We do finished, sim=bleed | OK | Minor | `screenshots/laptop-bleed-wedo-done.png`, `screenshots/iphone-bleed-wedo-done.png` |
| We do ready, sim=bleed (notice) | OK | OK | `screenshots/laptop-bleed-wedo-ready.png`, `screenshots/iphone-bleed-wedo-ready.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-02 | Yes | — |
| UR-03 | Yes | — |
| UR-12 | Yes | — |
| UR-21 | Yes | — |
| UR-22 | Yes | — |
| UR-24 | Partial | UI-S06-T1-02 (non-blocking) |
| UR-25 | Yes | — |

## Findings

No new findings. Two earlier non-blocking findings remain open; see below.

## Previous findings

| Finding | Status now | Evidence |
|---------|------------|----------|
| UI-S06-T1-01 | Fixed | `screenshots/iphone-bleed-wedo-running.png` shows "Sung: —" and no sung key. `screenshots/iphone-perfect-wedo-running.png` still shows the green match. |
| UI-S06-T1-02 | Open (deferred) | The notice is red like a miss (UR-24). The coder deferred it as a design choice. Optional: use a neutral or warning style. |
| UI-S06-T1-03 | Open (deferred) | In `screenshots/iphone-bleed-wedo-done.png` the practice graph looks cut off by the button bar. It may be a capture artefact. Check on a phone that it scrolls fully into view. |

## Not verified

Review script steps with real speakers and a microphone are left for the owner. These are whether the gate level suits the owner's laptop, whether quiet singing still counts, and the no-notice behaviour with headphones. I used only the simulator.

## Proposed requirement changes

None
