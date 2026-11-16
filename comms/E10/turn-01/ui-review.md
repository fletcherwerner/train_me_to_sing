# E10 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 2

## Summary

The only screen this epic changes is Settings, which gains "Move progress between devices" with Export and Import. It works at both sizes with no horizontal scroll (scrollWidth 1280 and 393). The invalid-file error, the Replace/Merge summary and the "Merged" confirmation all appear in plain words. The two non-blocking issues are that Replace is easy to hit by mistake and that the import prompt is hard to notice. Install, offline, AirDrop, wake lock and the background-pause message could not be checked here.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Settings (default) | OK | OK | `screenshots/settings-laptop.png`, `screenshots/settings-phone.png` |
| Export done | OK | OK | `screenshots/export-done-laptop.png`, `screenshots/export-done-phone.png` |
| Import invalid file | OK | OK | `screenshots/import-invalid-laptop.png`, `screenshots/import-invalid-phone.png` |
| Import summary (Replace / Merge / Cancel) | OK | Issue | `screenshots/import-summary-laptop.png`, `screenshots/import-summary-phone.png` |
| Import merged | OK | OK | `screenshots/import-merged-laptop.png`, `screenshots/import-merged-phone.png` |
| Home (unchanged) | OK | OK | `screenshots/home-laptop.png`, `screenshots/home-phone.png` |

The script is `ui-scripts/import.mjs`. It uses a fresh browser profile, so the summary and merged screenshots start from an empty device.

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-21 | Yes | — |
| UR-23 | Yes | Export, Import, Replace, Merge and Cancel measure about 47 px tall on the phone. |
| UR-24 | Yes | The error is red and also has a sentence saying so. |
| UR-25 | Yes | "That file is not a Train Me To Sing export, so nothing was changed." |
| UR-26 | Yes | "Home" link at the top of Settings. |
| UR-27 | Not checked | Dark mode was not captured. The Settings page is unstyled apart from the error colour. |
| UR-05 | N/A | No piano is shown on Settings. |

## Findings

### UI-E10-T1-01 — Replace has no confirmation and sits next to Merge

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Settings, import summary, iPhone; `screenshots/import-summary-phone.png`
- **Requirement:** Epic E10, "Export / import" (Replace or Merge)
- **Problem:** "Replace", "Merge" and "Cancel" are three similar grey buttons in a row. Replace is first and overwrites everything on the device. A mis-tap could wipe the phone's progress. The dialog text only says "Replace everything on this device, or merge it with what you have?".
- **Change needed:** Make Merge the visually primary option, or put Replace last or apart from the others. Consider a one-line warning that Replace cannot be undone.

### UI-E10-T1-02 — Import summary is easy to miss

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Settings, import summary, iPhone; `screenshots/import-summary-phone.png`
- **Requirement:** UR-25 (the next action is clear)
- **Problem:** The summary is plain text below the Import button, with no border or heading. On the phone it can land near the bottom of the screen, and the page does not scroll to it. The summary also says "1 lesson passed" but not how many lessons were attempted.
- **Change needed:** Give the prompt a visible box and scroll or focus it into view when it appears.

## Previous findings

Turn 1: none.

## Not verified

The following steps need an iPhone or hosted URL, so they are left for the owner:
- Review-script steps 1–3: hosted HTTPS URL, Add to Home Screen, full-screen standalone launch and the icon, offline launch in Airplane Mode.
- Step 4: the AirDrop/share sheet. Only the download path was exercised, and it showed "Export downloaded."
- Step 5: importing on the phone, and checking that the phone's calibration is unchanged. I confirmed the on-screen messages only.
- Steps 6–7: the "Paused — tap to restart" message after locking mid-lesson, and the screen wake lock during a song.
- The "Update ready — reload" banner, which did not appear.
- Safe-area insets on a notched phone.
- Dark mode on Settings.

## Proposed requirement changes

None
