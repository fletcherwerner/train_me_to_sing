import type { ExerciseTemplate } from '../core/exercise/types';

export interface Lesson {
  id: string; // stable, e.g. "s1-03"
  stage: 1 | 2 | 3;
  order: number;
  title: string;
  goal: string; // one sentence shown to the student
  exercise: ExerciseTemplate;
  toleranceId: string;
  passScore: number; // 0.8
  source: 'builtin' | 'imported';
}

export interface LessonSource {
  list(): Lesson[];
}
