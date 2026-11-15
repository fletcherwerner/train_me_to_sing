import type { ExerciseTemplate, ResolvedExercise, StudentRange } from './types';

export type FitResult =
  | { ok: true; exercise: ResolvedExercise }
  | { ok: false; reason: 'range-too-small'; neededSemitones: number; haveSemitones: number };

export function fit(template: ExerciseTemplate, range: StudentRange): FitResult {
  const offsets = template.notes.map((n) => n.offset);
  const minOff = Math.min(...offsets);
  const maxOff = Math.max(...offsets);
  const span = maxOff - minOff;
  const size = range.highMidi - range.lowMidi;
  if (span > size) {
    return { ok: false, reason: 'range-too-small', neededSemitones: span, haveSemitones: size };
  }
  const lowestNote = range.lowMidi + Math.floor((size - span) / 2);
  const tonicMidi = lowestNote - minOff;
  const secPerBeat = 60 / template.tempoBpm;
  const notes = template.notes.map((n, index) => ({
    index,
    midi: tonicMidi + n.offset,
    startSec: n.startBeat * secPerBeat,
    durationSec: n.durationBeats * secPerBeat,
    ...(n.lyric !== undefined ? { lyric: n.lyric } : {}),
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
