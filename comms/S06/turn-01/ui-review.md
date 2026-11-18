# S06 — Turn 1 — UI Review

**Verdict:** CHANGES REQUIRED

**Blocking open:** 1 · **Non-blocking open:** 2

## Summary

The results side works. With `sim=bleed` the practice line says 0 of 5 notes, the results graph has no red line, and the headphones notice shows. With `sim=perfect` there is no notice and scoring is unchanged. The live display is still wrong. While the piano plays in We do, the piano keyboard shows the piano's note as "Sung" in green and the cents meter reads 0. This is the same false match the epic sets out to remove, and the coder lists it as a known gap.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| We do ready, sim=bleed (notice) | OK | OK | `screenshots/laptop-bleed-wedo-ready.png`, `screenshots/iphone-bleed-wedo-ready.png` |
| We do running, sim=bleed | Issue | Issue | `screenshots/laptop-bleed-wedo-running.png`, `screenshots/iphone-bleed-wedo-running.png` |
| We do finished, sim=bleed | OK | Issue (minor) | `screenshots/laptop-bleed-wedo-done.png`, `screenshots/iphone-bleed-wedo-done.png` |
| We do finished, sim=bleedSing | OK | OK | `screenshots/laptop-bleedSing-wedo-done.png`, `screenshots/iphone-bleedSing-wedo-done.png` |
| We do finished, sim=perfect (no notice) | OK | OK | `screenshots/laptop-perfect-wedo-done.png`, `screenshots/iphone-perfect-wedo-done.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-02 | Partial | UI-S06-T1-01 |
| UR-03 | Partial | UI-S06-T1-01 |
| UR-12 | Yes | — |
| UR-21 | Yes | — |
| UR-22 | Yes | — |
| UR-24 | Partial | UI-S06-T1-03 |
| UR-25 | Yes | — |

## Findings

### UI-S06-T1-01 — Live keys and meter still show the piano as the student's voice

- **Severity:** Blocking
- **Status:** Open
- **Where:** We do, running, `sim=bleed`, both sizes; `screenshots/iphone-bleed-wedo-running.png`
- **Requirement:** UR-02 and UR-03 (the sung note and match colour must be true to what the student is doing). Epic goal: "a student who sings quietly (or not at all) is credited with the piano's notes".
- **Problem:** The student is silent. The keyboard shows a green "Sung: G#3" key, and the meter shows a green "0" (perfect match). The red line on the graph is correctly gone, so the screen contradicts itself. The student is told "on target" while doing nothing, and the final result says 0 of 5. The coder confirms `useLiveAttempt` reads the ungated source. The epic names only the graph, but the epic's own goal and UR-03 cover this.
- **Change needed:** Apply the same gate to the live sung note, keys and cents meter in We do, so Sung shows "—" and no sung key lights while the piano is the only sound.

### UI-S06-T1-02 — Notice shifts the layout and uses error red

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** We do, `screenshots/laptop-bleed-wedo-ready.png`
- **Requirement:** UR-24 (same meaning, same colour)
- **Problem:** The notice appears after I do and pushes the content down. It is in the same red as miss results, but it is advice, not a failure. The wording is plain and gives the next action, which is good.
- **Change needed:** Optional. Reserve the space, or use a neutral/warning style if the existing notice style allows.

### UI-S06-T1-03 — iPhone finished view, lower graph looks cut off

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** We do finished, `sim=bleed`, iPhone; `screenshots/iphone-bleed-wedo-done.png`
- **Requirement:** UR-21 and UR-22
- **Problem:** With the notice shown, the results graph is cut off by the button bar. This may be an artefact of the full-page capture, since the page should scroll. The notice adds about 60 px of height that was not there before.
- **Change needed:** Check that the graph is fully reachable by scrolling on a phone with the notice visible.

## Previous findings

Turn 1: none.

## Not verified

Review script steps 1 to 5 need real speakers and a microphone. The following are left for the owner: whether the gate level suits their laptop's real leak, whether quiet singing still counts, and the no-notice behaviour with headphones. I used only the simulator.

## Proposed requirement changes

None
