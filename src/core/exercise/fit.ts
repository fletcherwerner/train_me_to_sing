import type { ExerciseTemplate, ResolvedExercise, StudentRange } from './types';

export type FitResult =
  | { ok: true; exercise: ResolvedExercise }
  | { ok: false; reason: 'range-too-small'; neededSemitones: number; haveSemitones: number };

export interface FitOptions {
  /** Use this tonic instead of centring the exercise in the range. */
  tonicMidi?: number;
}

function offsetSpan(template: ExerciseTemplate): { minOff: number; maxOff: number } {
  const offsets = template.notes.flatMap((n) => (n.glideToOffset !== undefined ? [n.offset, n.glideToOffset] : [n.offset]));
  return { minOff: Math.min(...offsets), maxOff: Math.max(...offsets) };
}

/** How many different tonics keep every note inside the range. */
export function tonicCount(template: ExerciseTemplate, range: StudentRange): number {
  const { minOff, maxOff } = offsetSpan(template);
  return Math.max(0, range.highMidi - maxOff - (range.lowMidi - minOff) + 1);
}

/**
 * A random tonic such that every note is inside the range. If `avoid` is given and another tonic fits,
 * it is not returned. Returns null when the template does not fit the range at all. `rng` returns [0, 1).
 */
export function pickTonic(
  template: ExerciseTemplate,
  range: StudentRange,
  rng: () => number,
  avoid?: number | number[] | null,
): number | null {
  const { minOff, maxOff } = offsetSpan(template);
  const lo = range.lowMidi - minOff;
  const hi = range.highMidi - maxOff;
  if (hi < lo) return null;
  const all: number[] = [];
  for (let t = lo; t <= hi; t++) all.push(t);
  const avoided = avoid == null ? [] : Array.isArray(avoid) ? avoid : [avoid];
  const kept = all.filter((t) => !avoided.includes(t));
  // When every key is avoided, a key that was used is better than none.
  const choices = kept.length > 0 ? kept : all;
  return choices[Math.min(choices.length - 1, Math.floor(rng() * choices.length))];
}

export function fit(template: ExerciseTemplate, range: StudentRange, opts?: FitOptions): FitResult {
  const { minOff, maxOff } = offsetSpan(template);
  const span = maxOff - minOff;
  const size = range.highMidi - range.lowMidi;
  if (span > size) {
    return { ok: false, reason: 'range-too-small', neededSemitones: span, haveSemitones: size };
  }
  const lowestNote = range.lowMidi + Math.floor((size - span) / 2);
  const tonicMidi =
    opts?.tonicMidi !== undefined && opts.tonicMidi + minOff >= range.lowMidi && opts.tonicMidi + maxOff <= range.highMidi
      ? opts.tonicMidi
      : lowestNote - minOff;
  const secPerBeat = 60 / template.tempoBpm;
  const notes = template.notes.map((n, index) => ({
    index,
    midi: tonicMidi + n.offset,
    startSec: n.startBeat * secPerBeat,
    durationSec: n.durationBeats * secPerBeat,
    ...(n.lyric !== undefined ? { lyric: n.lyric } : {}),
    ...(n.glideToOffset !== undefined ? { glideToMidi: tonicMidi + n.glideToOffset } : {}),
  }));
  const totalSec = notes.reduce((m, n) => Math.max(m, n.startSec + n.durationSec), 0);
  return {
    ok: true,
    exercise: {
      templateId: template.id,
      tonicMidi,
      tempoBpm: template.tempoBpm,
      beatsPerBar: template.beatsPerBar,
      notes,
      totalSec,
    },
  };
}

/** Keyboard span to draw: low extended down to a C, high extended up to a B. */
export function displayRange(range: StudentRange): { lowMidi: number; highMidi: number } {
  let low = range.lowMidi;
  while (((low % 12) + 12) % 12 !== 0) low -= 1;
  let high = range.highMidi;
  while (((high % 12) + 12) % 12 !== 11) high += 1;
  return { lowMidi: low, highMidi: high };
}
