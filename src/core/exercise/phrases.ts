import type { Phrase, ResolvedExercise } from './types';

/** Phrases from consecutive lengths, labelled "Line 1", "Line 2", ... */
export function linesFromLengths(lengths: number[]): Phrase[] {
  let start = 0;
  return lengths.map((len, i) => {
    const p = { startNote: start, endNote: start + len - 1, label: `Line ${i + 1}` };
    start += len;
    return p;
  });
}

/**
 * Cut one phrase out of a resolved exercise. Pitches are unchanged, notes are
 * re-indexed from 0 and times are re-based so the first note starts at 0.
 */
export function slicePhrase(ex: ResolvedExercise, phrase: Phrase): ResolvedExercise {
  const picked = ex.notes.slice(phrase.startNote, phrase.endNote + 1);
  const base = picked.length > 0 ? picked[0].startSec : 0;
  const notes = picked.map((n, i) => ({ ...n, index: i, startSec: n.startSec - base }));
  const totalSec = notes.reduce((m, n) => Math.max(m, n.startSec + n.durationSec), 0);
  return { ...ex, notes, totalSec };
}

/** Phrase for an original note index, or undefined if none covers it. */
export function phraseFor(phrases: Phrase[], noteIndex: number): Phrase | undefined {
  return phrases.find((p) => noteIndex >= p.startNote && noteIndex <= p.endNote);
}
