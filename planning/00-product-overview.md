# Product Overview

## Purpose

Teach one adult beginner, who cannot currently sing in tune, to match pitch — starting from single notes and building up to simple songs. The app plays and shows what to sing, listens through the microphone, and shows in real time how the sung note compares with the target.

## Decisions made with the owner

| Topic | Decision |
|-------|----------|
| Platform | Web app (PWA) first: laptop browser and iPhone Safari. Capacitor iOS wrapper later (E12). Audio code sits behind interfaces so the wrapper is not a rewrite. |
| Visualization | Piano keyboard only. Target key in one colour, sung key in another, plus a sharp/flat cents readout. No scrolling piano roll. |
| What counts as a missed note | Wrong octave; wavering off the note; landing on a neighbouring note; entering late or early. |
| Practice setup | Headphones. The mic hears only the singer, so "We do" can be measured. |
| Progression | Open: every lesson is available. A tracker shows what is passed. |
| Passing | One "You do" attempt at 80% or more notes hit passes the lesson. |
| Tolerances | Tighten as lessons advance, with a floor that allows for mic and latency limits. |
| Range test | Guided. Hold your lowest note during an announced recording window, then your highest. The held note is shown live. No ascending or descending guide tones. |
| Songs | Built-in public-domain set. MIDI import is a later epic (E11); the lesson model must accept imported lessons without changes. |
| Lead-in | 4 clicks at the lesson tempo before every run, in I do, We do and You do. The exercise starts on the next beat. |
| Storage | On each device, with export/import of a file to move progress between devices. No server, no accounts. |

## User flow

1. **First launch → range setup.** The student holds their lowest comfortable note, then their highest. The app stores the two notes as the *student range*. It can be redone at any time from Settings.
2. **Home / tracker.** Lessons are listed in three stages. Each shows not started, attempted (best score), or passed. Lessons whose notes span more than the student range are disabled with an explanation.
3. **Lesson session.** Every lesson, whatever its content, runs the same three steps. Every run of every step starts with a lead-in of 4 clicks that sets the tempo; the exercise begins on the next beat.
   - **I do** — the app plays the exercise and lights each key. The student listens. They can repeat it as often as they like.
   - **We do** — the app plays the exercise again while the student sings along. The mic is live and the keyboard shows both target and sung notes. A score is shown but not recorded. Repeatable.
   - **You do** — the app plays the first note, gives the 4-click lead-in, then stays silent except for the metronome. The target key is still lit. This attempt is graded.
4. **Results.** Per-note outcome (hit, or the reason for the miss), the overall score, and pass/fail. Options: retry "You do", go back to "I do", or return home.

## The three stages

| Stage | Content | Example |
|-------|---------|---------|
| 1. Note matching | 3–5 notes, quarter notes at 60 bpm | Same note three times; three notes stepping up |
| 2. Scales | Five-note runs, full major scale, arpeggios; some at faster tempo | Major scale up and down |
| 3. Songs | Public-domain melodies with lyrics | Hot Cross Buns → Twinkle Twinkle → Frère Jacques |

The full list is in [02-lesson-catalog.md](02-lesson-catalog.md).

## How pitch range drives everything

- Exercises are written *relative to a tonic* (semitone offsets), never as fixed notes.
- When a lesson starts, the exercise is transposed so that every note falls inside the student range, centred in it.
- The piano shows the student range (padded to whole octaves) with the range limits marked.
- Singing the right note name in the wrong octave is a miss, and the piano shows it: the sung key lights an octave away from the target, or an arrow shows at the keyboard edge if it is off-screen.

## What the student sees during a lesson

- **Piano keyboard.** Target key highlighted. Sung key highlighted in "match" colour when it is the target and in "off" colour otherwise.
- **Cents readout.** How flat or sharp the voice is against the target, e.g. `♭ 30`.
- **Sequence strip.** One chip per note in order, showing note name (and lyric for songs). The current chip is highlighted; finished chips turn green or red.
- **Beat indicator.** Count-in and the current beat.
- **Step header.** Which of I do / We do / You do is active, with Repeat and Continue controls.

## Out of scope for this plan

Accounts, cloud sync, multiple student profiles, harmony or polyphonic detection, breath or tone-quality coaching, Android-specific work, App Store submission.

## Main risks

| Risk | Handling |
|------|----------|
| iOS Safari audio rules (audio only starts after a tap; mic needs HTTPS) | Every epic from E02 on is reviewed on the iPhone over the local network with HTTPS. One "Start" tap unlocks audio. |
| Pitch detection errors on low or breathy notes (octave jumps in the detector itself) | Clarity threshold, median smoothing, volume gate; debug tuner screen kept permanently for diagnosis. |
| Latency (especially Bluetooth) makes timing grading unfair | Generous timing tolerance in Stage 1; stored latency offset; calibration screen in E08. |
| Builders cannot sing into a mic | A synthetic pitch source drives the same pipeline for automated tests and a `?sim=` URL option. |
