# E16 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 0

## Summary

The only visible changes are a file-status block in Settings and a notice on Home for an unreadable progress file. Both are readable at laptop and iPhone sizes, in plain words, with no clipping or horizontal scrolling. The device-only parts (Files app, install, backups folder) can't be checked here and are left for the owner.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Settings, before first save ("Not saved to the file yet in this session.") | OK | OK | `screenshots/settings-filestore-memory-laptop.png`, `screenshots/settings-filestore-memory-phone.png` |
| Settings, after a change ("Last saved: 8:29 PM") | OK | OK | `screenshots/saved-laptop.png`, `screenshots/saved-phone.png` |
| Home, unreadable-file notice with OK button | OK | OK | `screenshots/unreadable-laptop.png`, `screenshots/unreadable-phone.png` |

Seen with `?filestore=memory`, the dev-only stand-in for the native file.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-21 | Yes | — |
| UR-23 | Yes (buttons and the notice's OK are about 46–48 px tall) | — |
| UR-24 | Yes (the notice is text with an OK button, no colour-only meaning) | — |
| UR-25 | Yes (the notice says what happened and where the file is kept) | — |
| UR-26 | Yes (the "‹ Lessons" button is on Settings) | — |
| UR-27 | Not checked in dark mode; the new text uses existing styles | — |

## Findings

None.

## Previous findings

Turn 1: none.

## Not verified

- Review script steps 1–8: the Xcode build, device install, Files app listing, `backups` folder, quit and reopen, re-install over the top, web Export and app Import, replacing the file with an older backup, and the E12 checks all need an iPhone.
- The wording "Saved on this iPhone in Files › On My iPhone…" appears in the browser because the dev stand-in uses it; on the device, check that it matches what the Files app shows.
- Dark mode was not captured.

## Proposed requirement changes

None.
