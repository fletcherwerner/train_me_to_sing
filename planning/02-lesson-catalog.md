# Lesson Catalog

Lesson data for E07 (Stage 1), E08 (Stage 2) and E09 (Stage 3). Notation is defined in [01-architecture.md](01-architecture.md): `offset:beats`, beats default to 1, `r` is a rest. Offsets are semitones from the tonic.

All lessons: `passScore: 0.8`, `beatsPerBar: 4` unless stated.

## Tolerance profiles

| id | Used by | Pitch (± cents) | Hold fraction | Timing (± ms) |
|----|---------|-----------------|---------------|---------------|
| `t1` | Stage 1 | 50 | 0.50 | 400 |
| `t2` | Stage 2, first half | 40 | 0.60 | 300 |
| `t3` | Stage 2, second half; Stage 3, first half | 35 | 0.65 | 250 |
| `t4` | Stage 3, second half | 30 | 0.70 | 200 |

Floor: no profile may go below ±25 cents or ±150 ms. Phone mics and audio latency make tighter values unfair.

## Stage 1 — Note matching (60 bpm, `t1`)

| id | Title | Notes | Span (semitones) |
|----|-------|-------|------------------|
| s1-01 | One note, three times | `0 0 0` | 0 |
| s1-02 | Step up and back | `0 2 0` | 2 |
| s1-03 | Three notes up | `0 2 4` | 4 |
| s1-04 | Three notes down | `4 2 0` | 4 |
| s1-05 | Up and back down | `0 2 4 2 0` | 4 |
| s1-06 | A small leap | `0 4 0` | 4 |
| s1-07 | Leaps up | `0 4 7` | 7 |
| s1-08 | Five notes up | `0 2 4 5 7` | 7 |

## Stage 2 — Scales

| id | Title | Tempo | Tolerance | Notes | Span |
|----|-------|-------|-----------|-------|------|
| s2-01 | Five-note scale, up and down | 60 | t2 | `0 2 4 5 7 5 4 2 0:2` | 7 |
| s2-02 | Major arpeggio | 60 | t2 | `0 4 7 4 0:2` | 7 |
| s2-03 | Major scale up | 60 | t2 | `0 2 4 5 7 9 11 12:2` | 12 |
| s2-04 | Major scale down | 60 | t2 | `12 11 9 7 5 4 2 0:2` | 12 |
| s2-05 | Major scale up and down | 72 | t3 | `0 2 4 5 7 9 11 12 11 9 7 5 4 2 0:2` | 12 |
| s2-06 | Octave arpeggio | 72 | t3 | `0 4 7 12 7 4 0:2` | 12 |
| s2-07 | Five-note scale in eighths | 72 | t3 | `0:.5 2:.5 4:.5 5:.5 7:.5 5:.5 4:.5 2:.5 0:2` | 7 |
| s2-08 | Natural minor scale up and down | 72 | t3 | `0 2 3 5 7 8 10 12 10 8 7 5 3 2 0:2` | 12 |

## Stage 3 — Songs

Lyrics are split one syllable per note.

### s3-01 Hot Cross Buns — 72 bpm, `t3`, span 4

Notes: `4 2 0:2 4 2 0:2 0:.5 0:.5 0:.5 0:.5 2:.5 2:.5 2:.5 2:.5 4 2 0:2`

Lyrics: Hot / cross / buns / hot / cross / buns / one / a / pen / ny / two / a / pen / ny / hot / cross / buns

### s3-02 Mary Had a Little Lamb — 80 bpm, `t3`, span 7

Notes: `4 2 0 2 4 4 4:2 2 2 2:2 4 7 7:2 4 2 0 2 4 4 4 4 2 2 4 2 0:4`

Lyrics: Ma / ry / had / a / lit / tle / lamb / lit / tle / lamb / lit / tle / lamb / Ma / ry / had / a / lit / tle / lamb / its / fleece / was / white / as / snow

### s3-03 Ode to Joy (first two phrases) — 80 bpm, `t3`, span 7

Notes: `4 4 5 7 7 5 4 2 0 0 2 4 4:1.5 2:.5 2:2 4 4 5 7 7 5 4 2 0 0 2 4 2:1.5 0:.5 0:2`

Lyrics: sing on "la" for every note.

### s3-04 Twinkle Twinkle Little Star — 80 bpm, `t4`, span 9

Notes: `0 0 7 7 9 9 7:2 5 5 4 4 2 2 0:2 7 7 5 5 4 4 2:2 7 7 5 5 4 4 2:2 0 0 7 7 9 9 7:2 5 5 4 4 2 2 0:2`

Lyrics: Twin / kle / twin / kle / lit / tle / star / how / I / won / der / what / you / are / up / a / bove / the / world / so / high / like / a / dia / mond / in / the / sky / twin / kle / twin / kle / lit / tle / star / how / I / won / der / what / you / are

### s3-05 Frère Jacques — 88 bpm, `t4`, span 14

Notes: `0 2 4 0 0 2 4 0 4 5 7:2 4 5 7:2 7:.5 9:.5 7:.5 5:.5 4 0 7:.5 9:.5 7:.5 5:.5 4 0 0 -5 0:2 0 -5 0:2`

Lyrics: Frè / re / Jac / ques / Frè / re / Jac / ques / dor / mez / vous / dor / mez / vous / son / nez / les / ma / ti / nes / son / nez / les / ma / ti / nes / ding / dang / dong / ding / dang / dong

## Rules for adding lessons

- The number of lyric entries must equal the number of non-rest notes. A unit test enforces this for every lesson.
- Lesson ids are permanent. Progress is stored against them.
- Any new melody must be listened to by a person before it is accepted; a builder cannot verify a tune by reading numbers.
