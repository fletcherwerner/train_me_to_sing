import { parseNotation } from '../core/exercise/notation';
import type { Lesson } from './types';

export interface MakeLessonInput {
  id: string;
  stage: 1 | 2 | 3;
  order: number;
  title: string;
  goal: string;
  tempoBpm: number;
  beatsPerBar?: number;
  notation: string;
  lyrics?: string[];
  toleranceId: string;
}

export function makeLesson(input: MakeLessonInput): Lesson {
  return {
    id: input.id,
    stage: input.stage,
    order: input.order,
    title: input.title,
    goal: input.goal,
    exercise: {
      id: input.id,
      title: input.title,
      tempoBpm: input.tempoBpm,
      beatsPerBar: input.beatsPerBar ?? 4,
      notes: parseNotation(input.notation, input.lyrics),
    },
    toleranceId: input.toleranceId,
    passScore: 0.8,
    source: 'builtin',
  };
}
