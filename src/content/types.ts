import type { ExerciseTemplate } from '../core/exercise/types';

export type LessonKind = 'melody' | 'match';
export type Placement = 'low' | 'mid' | 'high';
export interface MatchTargetSpec {
  placement: Placement;
  /** Semitones added to the placed note, before clamping to the range. */
  offset?: number;
}
export interface LessonUnit {
  id: 'A' | 'B' | 'C' | 'D';
  title: string;
}

export interface Lesson {
  id: string; // stable, e.g. "s1b-03"
  stage: 1 | 2 | 3;
  order: number;
  title: string;
  goal: string; // one sentence shown to the student
  /** A melody lesson's notes. For a match lesson, a one-note placeholder the Home screen can fit. */
  exercise: ExerciseTemplate;
  toleranceId: string;
  passScore: number; // 0.8
  source: 'builtin' | 'imported';
  /** 'melody' (default) is the I do / We do / You do flow; 'match' is one note at a time. */
  kind: LessonKind;
  /** Stage 1 unit, for Home grouping. */
  unit?: LessonUnit;
  /** True: Learn / Practise / Prove feedback levels, passed at Prove. False: one You do flow. */
  levels: boolean;
  /** Offers "Echo yourself" after a good run. */
  echo: boolean;
  /** Match lessons only. */
  matchTargets?: MatchTargetSpec[];
  /** Match lessons: seconds the note must be held. */
  holdSec?: number;
  /** Match lessons: max seconds from first sound to the start of the matching hold; null = no limit. */
  landWithinSec?: number | null;
  /** Match lessons: seconds each target runs (default MATCH_SING_SEC, 8). */
  singSec?: number;
}

export interface LessonSource {
  list(): Lesson[];
}
