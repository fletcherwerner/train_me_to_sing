import type { ExerciseTemplate, StudentRange } from './types';

export interface WarmupGlide {
  template: ExerciseTemplate;
  /** What to do on screen. */
  instruction: string;
}

const HUM = 'Hum on "ng" (like the end of "sing") or buzz your lips, and slide your voice along the line.';

/**
 * The three warm-up glides, all inside the student's range. Offsets are semitones above `range.lowMidi`,
 * so fit them with `tonicMidi: range.lowMidi`. Tempo is 60, so a beat is a second.
 * 1. low to middle and back (4 s)  2. middle to high and back (4 s)  3. a siren, low to high to low (6 s).
 */
export function warmupGlides(range: StudentRange): WarmupGlide[] {
  const size = Math.max(2, range.highMidi - range.lowMidi);
  const mid = Math.floor(size / 2);
  const glide = (id: string, title: string, instruction: string, legs: [number, number, number][]): WarmupGlide => ({
    instruction,
    template: {
      id,
      title,
      tempoBpm: 60,
      beatsPerBar: 4,
      notes: legs.map(([from, to, beats], i, all) => ({
        offset: from,
        glideToOffset: to,
        startBeat: all.slice(0, i).reduce((t, l) => t + l[2], 0),
        durationBeats: beats,
      })),
    },
  });
  return [
    glide('warmup-1', 'Glide 1: low to middle and back', `${HUM} Start low, rise to the middle, come back.`, [
      [0, mid, 2],
      [mid, 0, 2],
    ]),
    glide('warmup-2', 'Glide 2: middle to high and back', `${HUM} Start in the middle, rise to the top, come back.`, [
      [mid, size, 2],
      [size, mid, 2],
    ]),
    glide('warmup-3', 'Glide 3: siren', `${HUM} A siren: low up to high and all the way down again.`, [
      [0, size, 3],
      [size, 0, 3],
    ]),
  ];
}
