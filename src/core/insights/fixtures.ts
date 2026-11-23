import type { NoteRecord, RunRecord } from './types';

let counter = 0;

/** Test helper: a run record with sensible defaults. */
export function run(over: Partial<RunRecord> & { date: string }): RunRecord {
  counter++;
  return {
    id: `r${counter}`,
    lessonId: 's1b-04',
    kind: 'melody',
    endedAt: `${over.date}T10:00:${String(counter % 60).padStart(2, '0')}.000Z`,
    durationSec: 30,
    inPractice: false,
    range: { lowMidi: 48, highMidi: 72 },
    ...over,
  };
}

/** Test helper: a voiced melody note `cents` off, steady and on time. */
export function note(cents: number | null, over: Partial<NoteRecord> = {}): NoteRecord {
  return { t: 60, c: cents, h: 1, o: 0, ...over };
}

/** Test helper: `n` notes with the given cents. */
export function notes(cents: (number | null)[], over: Partial<NoteRecord> = {}): NoteRecord[] {
  return cents.map((c) => note(c, over));
}

/** Test helper: `n` copies of the cents value. */
export const times = (n: number, c: number | null, over: Partial<NoteRecord> = {}): NoteRecord[] =>
  Array.from({ length: n }, () => note(c, over));
