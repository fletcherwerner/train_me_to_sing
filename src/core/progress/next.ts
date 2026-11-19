import { fit } from '../exercise/fit';
import type { ExerciseTemplate, StudentRange } from '../exercise/types';

/** The part of a lesson that "what comes next" needs. `Lesson` from content satisfies it. */
export interface NextLessonInfo {
  id: string;
  source: 'builtin' | 'imported';
  exercise: ExerciseTemplate;
}

/** A lesson counts as done once it is passed (for mastery lessons, `passed` is set when mastered). */
export type NextProgress = Record<string, { passed: boolean } | undefined>;

const onPath = (l: NextLessonInfo, progress: NextProgress, range: StudentRange): boolean =>
  l.source === 'builtin' && !progress[l.id]?.passed && fit(l.exercise, range).ok;

/** The first built-in lesson, in catalog order, that is not mastered and fits the range. Home's "Next" tag. */
export function nextLesson<T extends NextLessonInfo>(
  lessons: T[],
  progress: NextProgress,
  range: StudentRange,
): T | null {
  return lessons.find((l) => onPath(l, progress, range)) ?? null;
}

/**
 * The lesson to go to after `currentId`: the first later one that is not mastered and fits the range, wrapping
 * round to earlier unmastered lessons. `null` when there are none. Imported songs are not part of the path.
 */
export function nextLessonAfter<T extends NextLessonInfo>(
  lessons: T[],
  progress: NextProgress,
  currentId: string,
  range: StudentRange,
): T | null {
  const i = lessons.findIndex((l) => l.id === currentId);
  const ordered = i < 0 ? lessons : [...lessons.slice(i + 1), ...lessons.slice(0, i)];
  return ordered.find((l) => l.id !== currentId && onPath(l, progress, range)) ?? null;
}
