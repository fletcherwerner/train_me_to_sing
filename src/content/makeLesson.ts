import { parseNotation } from '../core/exercise/notation';
import type { Phrase } from '../core/exercise/types';
import type { Lesson, LessonKind, LessonUnit, MatchTargetSpec } from './types';

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
  phrases?: Phrase[];
  toleranceId: string;
  kind?: LessonKind;
  unit?: LessonUnit;
  levels?: boolean;
  echo?: boolean;
  matchTargets?: MatchTargetSpec[];
  holdSec?: number;
  landWithinSec?: number | null;
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
      ...(input.phrases ? { phrases: input.phrases } : {}),
    },
    toleranceId: input.toleranceId,
    passScore: 0.8,
    source: 'builtin',
    kind: input.kind ?? 'melody',
    ...(input.unit ? { unit: input.unit } : {}),
    levels: input.levels ?? false,
    echo: input.echo ?? false,
    ...(input.matchTargets ? { matchTargets: input.matchTargets } : {}),
    ...(input.holdSec !== undefined ? { holdSec: input.holdSec } : {}),
    ...(input.landWithinSec !== undefined ? { landWithinSec: input.landWithinSec } : {}),
  };
}
