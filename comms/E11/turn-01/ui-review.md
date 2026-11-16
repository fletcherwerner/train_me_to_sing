# E11 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The owner can import a MIDI file, pick a track, see the chord warning, check whether it fits their range, add it, find it under "My songs" and delete it with confirmation. All of this works at laptop and iPhone size, in light and dark, with no horizontal scrolling. Only small layout polish is left.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Import, empty | OK | OK | `screenshots/laptop-2-import-empty.png`, `screenshots/phone-2-import-empty.png` |
| Import, two tracks, chord warning | OK | OK | `screenshots/laptop-7-chords-selected.png`, `screenshots/phone-7-chords-selected.png` |
| Import, melody selected, fits | OK | OK | `screenshots/laptop-8-melody-narrow-range.png`, `screenshots/phone-8-melody-narrow-range.png` |
| Import, melody selected, does not fit | OK | OK | `screenshots/phone-9-nofit-import.png` |
| Import, dark mode | OK | OK | `screenshots/phone-dark-8-melody-narrow-range.png` |
| Home, My songs and import link | OK | OK | `screenshots/laptop-5-home-mysongs.png`, `screenshots/phone-5-home-mysongs.png` |
| Home, imported lesson that does not fit | OK | OK | `screenshots/phone-10-nofit-home.png` |
| Home, delete confirmation | OK | OK | `screenshots/laptop-6-delete-confirm.png`, `screenshots/phone-6-delete-confirm.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-18 | Yes (imported rows show status like built-in rows) | — |
| UR-19 | Yes (greyed, dashed row says "Needs 12 semitones; your range is 4"; import screen shows the same) | — |
| UR-21 | Yes (scrollWidth equals viewport width at 1280 and 393) | UI-E11-T1-01 |
| UR-23 | Yes (buttons and inputs measured at 44 px or taller on the phone) | — |
| UR-24 | Yes (chord warning has an icon and text; selected track has a label and a border) | — |
| UR-25 | Yes (unreadable file and empty file give plain messages; code and e2e cover them; I did not capture the error state) | — |
| UR-26 | Yes ("← Home" link on the import screen) | — |
| UR-27 | Yes (dark mode is legible) | — |

## Findings

### UI-E11-T1-01 — Option fields wrap awkwardly on the phone

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Import, options, iPhone; `screenshots/phone-8-melody-narrow-range.png`
- **Requirement:** UR-21 (nothing looks broken), taste
- **Problem:** "Last bar" and its box wrap onto a second line, away from the "First bar" box, and the labels sit inline with small inputs. It is usable but untidy.
- **Change needed:** Stack each label above its field, or put First bar and Last bar on separate rows.

### UI-E11-T1-02 — Delete button on the home screen is large and tall

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Home, My songs, iPhone; `screenshots/phone-5-home-mysongs.png`
- **Requirement:** UR-24 (consistency)
- **Problem:** The Delete button is much taller than the lesson row and takes a lot of the row width. It looks heavy next to the Stage rows.
- **Change needed:** Optional: make it the same height as the row, or use a smaller secondary style.

## Previous findings

Turn 1: none.

## Not verified

- Preview audio (needs speakers).
- Running an imported lesson by hand. I did not do this; the e2e test covers it.
- A real nursery-rhyme `.mid` file; I used the generated fixtures only.
- iPhone Safari, including the file picker.

## Proposed requirement changes

None
