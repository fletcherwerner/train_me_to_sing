# S01 — Turn 1 — UI Review

**Verdict:** APPROVED

**Blocking open:** 0 · **Non-blocking open:** 1

## Summary

The owner can use what this epic delivers. Settings → Profiles shows the active profile, a New profile form, and a Load profile list, and it works at laptop and iPhone widths. Home shows the profile name as a link. Both sizes have no horizontal scroll, and the Profiles controls are at least 44 px tall. The one issue is cosmetic.

## Screens reviewed

| Screen / state | Laptop | iPhone | Screenshot files |
|----------------|--------|--------|------------------|
| Settings, no profile, empty list | OK | OK | `screenshots/settings-noprofile-laptop.png`, `screenshots/settings-noprofile-phone.png` |
| Settings, profile active, list of two | OK | OK | `screenshots/settings-active-laptop.png`, `screenshots/settings-active-phone.png` |
| Duplicate-name error | OK | OK | `screenshots/duplicate-laptop.png`, `screenshots/duplicate-phone.png` |
| Empty name error | OK | OK | `screenshots/emptyname-laptop.png`, `screenshots/emptyname-phone.png` |
| Start fresh goes to range setup | OK | OK | `screenshots/after-create-fresh-laptop.png`, `screenshots/after-create-fresh-phone.png` |
| Home with the profile link (Copy mode, range kept) | OK | OK | `screenshots/copy-home-laptop.png`, `screenshots/copy-home-phone.png` |
| Dark mode, Settings and Home | n/a | OK | `screenshots/settings-dark-phone.png`, `screenshots/copy-home-phone-dark.png` |

## Requirements checked

| Requirement | Met? | Finding |
|-------------|------|---------|
| UR-21 | Yes | — scrollWidth equals viewport width at both sizes |
| UR-23 | Yes | — Create profile 150×48, profile rows 361×75, name field 48 tall, Home link 144×44. The radio inputs are 24 px but their labels span the full row width. |
| UR-24 | Yes | — "(active)" is a text label, not colour alone. The errors are red and also worded. |
| UR-25 | Yes | — empty name shows "Enter a name of 1–40 characters, using letters or numbers."; duplicate shows "A profile with that name already exists." |
| UR-26 | Yes | — "Home" link at the top of Settings |
| UR-27 | Yes | — dark-mode screenshots are legible |

## Findings

### UI-S01-T1-01 — No space after "Profile:" on Home

- **Severity:** Non-blocking
- **Status:** Open
- **Where:** Home with an active profile, laptop and iPhone; `screenshots/copy-home-phone.png`
- **Requirement:** Epic S01 UI: "the active profile's name near the title"
- **Problem:** The link reads "Profile:Copy phone-dark" with no gap between the label and the name.
- **Change needed:** Add a space after "Profile:".

## Previous findings

Turn 1: none.

## Not verified

- Review script steps 4–6 as a full run, meaning a real range test and passing a lesson. These need a microphone, and the Playwright e2e covers the same sequence. I only created profiles through the UI.
- Step 8, the `npm run build && npm run preview` view of the unavailable message. I did not run it.
- The non-blocking "Couldn't save to the profile file" notice. I could not trigger a save failure.
- Step 3, opening the JSON file in an editor.

## Proposed requirement changes

None
