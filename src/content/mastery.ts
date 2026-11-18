import type { Lesson } from './types';

/**
 * Lessons mastered over two days and two keys: built-in melody lessons with feedback levels
 * (Stage 1 units B–D) and built-in Stages 2–3. Match lessons (Unit A) and imported songs keep a single pass.
 */
export function usesMastery(lesson: Pick<Lesson, 'kind' | 'source' | 'levels' | 'stage'>): boolean {
  return lesson.source === 'builtin' && lesson.kind === 'melody' && (lesson.levels || lesson.stage >= 2);
}

/** Units C and D at Prove: a note the voice slid into is a miss. Everywhere else it is only a tip. */
export function scoopCountsAsMiss(lesson: Pick<Lesson, 'source' | 'stage' | 'unit'>, level: string): boolean {
  return lesson.source === 'builtin' && lesson.stage === 1 && (lesson.unit?.id === 'C' || lesson.unit?.id === 'D') && level === 'prove';
}
