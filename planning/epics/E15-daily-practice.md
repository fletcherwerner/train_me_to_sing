# E15 — Daily practice: session, spaced mastery, review, onset coaching

## Goal

Turn the beginner path (E14) into a short daily routine shaped by motor-learning research:

1. **Spacing beats cramming.** Practice spread over days is retained better than one long session. So a lesson is mastered only when passed at Prove on **two different days**, in **two different keys**, and passed lessons come back for review after 1, 3 and 7 days.
2. **Mixed practice transfers better** once a skill is acquired. So review mixes 2–3 earlier patterns in new keys.
3. **Warm up with glides first.** Teachers and voice clinicians start with glides and sirens before fixed notes.
4. **Short sessions.** 15–20 minutes for beginners, stopping when the voice tires.
5. **Landing on the note.** Sliding into a note helps find it but hides an inaccurate start; once the student can find notes, the app coaches a clean start.

## Research basis

Gathered on 2026-11-17 for the owner's proposal. E14's "Research basis" covers the findings it shares (visual feedback, wide range, sliding into notes, Kodály order).

| Finding | Strength | Used in this epic | Sources |
|---------|----------|-------------------|---------|
| Distributed practice (spread over time) maintains voice gains better than massed practice. Longer rest between attempts helped retention in a 2026 vocal motor study, though not necessarily within the session. | Moderate in voice therapy and motor learning; thin for singing | Mastery over two different days; the 1, 3, 7, 14-day review schedule | [Motor learning in voice therapy (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC13152083/); [Aaron et al. 2026: practice parameters in vocal motor adaptation](https://sites.bu.edu/stepplab/files/2026/02/aaron-et-al-2026-practice-parameters-that-influence-vocal-motor-adaptation-in-altered-auditory-feedback-paradigms.pdf); [Miami University thesis: vocalise training schedules](https://etd.ohiolink.edu/acprod/odb_etd/ws/send_file/send?accession=miami1122580181&disposition=inline) |
| Blocked practice helps early acquisition; varied practice (pitch, loudness, context) supports transfer beyond practice. | Pilot studies in singing; consistent with limb motor learning | New patterns practised blocked; review mixes patterns in new keys | [Crocco, McCabe & Madill: motor learning in classical singing teaching](https://www.sciencedirect.com/science/article/abs/pii/S0892199717306094); [NATS: Motor learning and teaching singing](https://www.nats.org/_Library/JOS_On_Point/JOS_077_5_2021_693.pdf); [Voice Foundation newsletter 2019](https://voicefoundation.org/wp-content/uploads/2019/06/2019_Vol24_Issue1.pdf) |
| Warm-ups move from breath and semi-occluded work (lip trill, straw, "ng") to glides and sirens before fixed-pitch scales; glides cross the register changes. Stop if the throat tightens. | Teacher and clinician consensus (Titze 2006 is the usual reference) | Warm-up glides open each session; never scored | [Trinity College: effective warm-ups](https://www.trinitycollege.com/qualifications/music/teachers-guide-to-singing/effective-warm-ups); [MSHA 2023 voice therapy toolbox](https://www.michiganspeechhearing.org/docs/Voice_Therapy_Toolbox_MSHA_2023_Handout.pdf); [Straw phonation and SOVT](https://www.torontospeechtherapy.com/blog/2024/the-power-of-straw-phonation-exploring-sovt-exercises/); [Journal of Singing 2019: vehicular vocalizing](https://kariragan.com/wp-content/uploads/2013/03/Vehicular-Vocalizing-to-Start-Your-Day-JOS-2019.pdf) |
| Beginners do best with about 15–20 minutes a day, building up over weeks, and should stop at hoarseness or strain; focused short practice beats long unfocused practice. | Teacher consensus, not research | 12–15 minute session; "Stop for today"; the 20-minute note | [Dummies: practising your singing](https://www.dummies.com/article/academics-the-arts/music/voice/practicing-your-singing-getting-started-199684/); [Gettysburg: vocal health](https://www.gettysburg.edu/academic-programs/sunderman-conservatory/current-students/health-and-wellness/vocal-health-and-wellness.dot); [30 Day Singer: vocal stamina](https://www.30daysinger.com/blog/how-to-build-vocal-stamina) |
| A scoop into the note can hide an inaccurate start and singing flat often comes from sliding up from below. | Teacher guidance | Scoop detection: a tip early, a miss in Units C–D at Prove | [How to improve pitch accuracy](https://voicerangetest.com/how-to-improve-pitch-accuracy/); [Chris Rowbury: learning to match pitch](https://blog.chrisrowbury.com/2009/10/learn-how-to-sing-in-tune-matching.html) |

Gaps: little singing-specific research on spacing or on blocked versus random practice; the review intervals (1, 3, 7, 14 days) follow general spaced-repetition practice, not a singing study.

## What you will review

Home has a "Today's practice" button. It runs about 12–15 minutes: a warm-up of glides, a few single notes across your range, your next new pattern, a short review of earlier patterns in new keys, and a summary. A lesson shows "Passed once — come back tomorrow in a new key" until the second day. If you slide into notes in later units, the results say so.

## Depends on

E14 (levels, `pickTonic`, match lessons, new Stage 1). Storage from E10/S01 (`src/storage/schema.ts`, `exportImport.ts`, `profiles.ts`).

## Scope

In: storage version 2; mastery rule; review schedule; the session screen; warm-up glides; onset (scoop) detection.
Out: changing Stages 2–3 content or tolerances; imported songs' pass rule (unchanged); notifications or reminders outside the app.

## Specification

### A. Storage version 2 (`src/storage/schema.ts`)

- `version: 2`. Per lesson, progress keeps today's fields plus:
  - `level` (from E14),
  - `proofs: { date: string; tonicMidi: number; score: number }[]` — Prove passes; `date` is the local calendar date `YYYY-MM-DD`,
  - `review: { step: number; dueOn: string } | null`.
- Migration from version 1 on load, import and profile load: a passed Stage 2–3 lesson becomes one proof with `tonicMidi: -1` (unknown), so it needs one more passing day; everything else gets `proofs: []`, `review: null`. Export writes version 2; importing a version-1 file migrates it.
- Profiles (S01) read and write version 2 the same way.

### B. Mastery rule (`src/core/progress/mastery.ts`, pure)

- `isMastered(p)`: at least 2 proofs on distinct dates **and** at least 2 distinct known tonics (`-1` counts as distinct from any known tonic). Applies to lessons with `levels: true` and to Stages 2–3. Match lessons (Unit A) and imported songs keep a single pass.
- `passed` in storage and on Home means mastered. A lesson with one proof shows "Passed once — come back tomorrow in a new key".
- A Prove pass on a day that already has a proof for that lesson is recorded (best score) but does not count as a second day.
- `pickTonic`'s `avoid` includes every proof tonic, so the second proof is in a new key when the range allows. If only one key fits, one key is enough (state it in the lesson).

### C. Review schedule (`src/core/progress/review.ts`, pure)

- On mastery, `review = { step: 0, dueOn: today + 1 day }`. Steps are +1, +3, +7, then +14 days repeating.
- A review attempt is at Prove level in a new key. Pass: next step. Fail: back to step 0 (due tomorrow); the lesson stays mastered but shows "Review due".
- `dueReviews(progress, today)`: due items, oldest first.

### D. Today's practice (`src/ui/screens/Practice.tsx`, route `/practice`; plan in `src/core/session/practicePlan.ts`, pure)

- `planToday(lessons, progress, today, rng)` returns ordered parts:
  1. **Warm-up** (about 2 min): 3 glides (D below). Never scored.
  2. **Pitch finding** (about 2 min): one round of the student's current Unit A lesson, or `s1a-03` once Unit A is passed, with 4 targets.
  3. **New pattern** (about 5 min): the first lesson that is not mastered and has no proof today, at its current level (E14). If every lesson has a proof today, skip.
  4. **Review** (about 3 min): up to 3 due reviews, interleaved, each at Prove in a new key. If none are due, up to 2 random mastered lessons from earlier units.
  5. **Wrap-up**: what was practised, what passed, what is due tomorrow, and the day's practice time.
- The screen runs the parts in order using the existing lesson components; the student can skip a part. Each part's results are saved exactly as if the lesson were opened from Home.
- A "Stop for today" button is always visible. After 20 minutes of practice time a note says: "That's a good session. Stop if your voice feels tired."
- Home's Continue card becomes "Today's practice" (with what it contains: "Warm-up, 4 notes, Sol–mi, 2 reviews"). The lesson list stays for free practice.

### E. Warm-up glides (`TemplateNote.glideToOffset?`, `PitchGraph.tsx`)

- A note with `glideToOffset` moves linearly from `offset` to `glideToOffset` over its duration. The piano plays it as a sliding tone (`OscillatorNode.frequency.linearRampToValueAtTime`). The graph draws a sloped black line.
- Glides are never scored and never recorded as progress.
- Three warm-up glides, each on "ng" or a lip trill (the instruction is on screen): low to mid and back (4 s), mid to high and back (4 s), a full siren low → high → low (6 s), all within the student's range.

### F. Onset coaching (`src/core/scoring/onsets.ts` or `evaluate.ts`)

- For each sung note, look at the first 150 ms after the voice starts in that note's window. If the pitch rises (or falls) by at least 70 cents into the target before settling within tolerance, the note is **scooped**.
- New `MissReason` `'scooped'` with the tip "You slid into this note. Try to start right on it."
- In Units A–B: a tip only (the note still counts). In Units C–D at Prove level: a scooped note is a miss. Stages 2–3 and imported songs: tip only.
- `sim=scoop`: each note starts 1 semitone below and reaches the target after 120 ms.

## Tests

- Migration: version-1 data (including an export file and a profile) loads as version 2 with proofs as specified.
- `mastery.test.ts`: two proofs same day — not mastered; two days same tonic — not mastered (unless only one tonic fits); two days two tonics — mastered; `-1` legacy proof plus a new-key proof — mastered.
- `review.test.ts`: schedule steps; fail resets to tomorrow; `dueReviews` ordering.
- `practicePlan.test.ts`: plan contents for a new student, mid-Unit B, a day with due reviews, and a day where everything has a proof today.
- `scoring.test.ts`: scooped detection threshold and window; tip vs miss by unit and level.
- Playwright (1280 and 393 px), with an injectable clock (`?today=2026-11-20`) for dates:
  - Today's practice runs every part with `sim=perfect` and saves progress; Stop for today ends it.
  - Passing a lesson at Prove on one day shows "Passed once"; passing again with `today` +1 shows Passed, and a review is due the day after.
  - `sim=scoop` in a Unit C Prove attempt gives scooped misses; in Unit B only tips.
  - Warm-up shows sloped target lines and no score.
  - No horizontal scroll; Stop visible during runs.

## Review script

1. Reset progress. Tap Today's practice. Warm up with the three glides; nothing is scored.
2. Pitch finding: four single notes around your range.
3. New pattern: Sol–mi at Learn. Keep going until Prove passes. Home says "Passed once — come back tomorrow in a new key".
4. Next day (or with `?today=` one day later): Today's practice brings Sol–mi back at Prove in a new key. Pass: Home shows Passed.
5. The day after: a review of Sol–mi appears in Today's practice.
6. In a Unit C lesson at Prove, slide into the notes on purpose: they count as misses with the "slid into this note" tip.
7. After 20 minutes the "good session" note appears. Stop for today works at any point.
8. Export, then import on another browser: proofs and reviews come across.
