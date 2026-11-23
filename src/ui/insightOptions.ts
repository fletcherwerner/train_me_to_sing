import { getLesson } from '../content/registry';
import { getTolerance } from '../core/scoring/tolerance';

/** A lesson's timing tolerance in ms, for the "Starting on time" category. */
export function timingMsOf(lessonId: string): number | undefined {
  const lesson = getLesson(lessonId);
  return lesson ? getTolerance(lesson.toleranceId).timingMs : undefined;
}

export const INSIGHT_OPTS = { timingMsOf } as const;
