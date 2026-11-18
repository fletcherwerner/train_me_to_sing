import { makeLesson } from '../makeLesson';
import type { Lesson, LessonUnit, MatchTargetSpec, Placement } from '../types';

export const UNITS: Record<'A' | 'B' | 'C' | 'D', LessonUnit> = {
  A: { id: 'A', title: 'Find your voice' },
  B: { id: 'B', title: 'First intervals' },
  C: { id: 'C', title: 'Four-note patterns' },
  D: { id: 'D', title: 'Five-note scale' },
};

let order = 0;

const targets = (...ps: Placement[]): MatchTargetSpec[] => ps.map((placement) => ({ placement }));

/** A match lesson: sing each target note one at a time. The exercise is a one-note placeholder. */
const match = (
  id: string,
  title: string,
  goal: string,
  matchTargets: MatchTargetSpec[],
  landWithinSec: number | null,
): Lesson =>
  makeLesson({
    id,
    stage: 1,
    order: ++order,
    title,
    goal,
    tempoBpm: 60,
    notation: '0:2',
    toleranceId: 't1',
    kind: 'match',
    unit: UNITS.A,
    levels: false,
    echo: true,
    matchTargets,
    holdSec: 1.0,
    landWithinSec,
  });

/** A melody lesson with feedback levels. Unit B offers echo yourself. */
const melody = (unit: 'B' | 'C' | 'D', id: string, title: string, goal: string, notation: string): Lesson =>
  makeLesson({
    id,
    stage: 1,
    order: ++order,
    title,
    goal,
    tempoBpm: 60,
    notation: withBeats(notation, unit === 'C' ? 1 : 2),
    toleranceId: 't1',
    unit: UNITS[unit],
    levels: true,
    echo: unit === 'B',
  });

/** "0 2 4" -> "0:2 2:2 4:2". Every note gets `beats`, except the last, which is always held 2 beats. */
function withBeats(offsets: string, beats: number): string {
  const parts = offsets.split(' ');
  return parts.map((o, i) => `${o}:${i === parts.length - 1 ? 2 : beats}`).join(' ');
}

const A2 = targets('low', 'mid', 'high', 'mid', 'low', 'high');

export const stage1Lessons: Lesson[] = [
  match('s1a-01', 'Find one note', 'Listen to the note, then find it with your voice and hold it.', targets('mid', 'mid', 'mid', 'mid', 'mid'), null),
  match('s1a-02', 'Low, middle and high', 'Match notes in the low, middle and high parts of your range.', A2, null),
  match('s1a-03', 'Land right on it', 'Start right on the note instead of sliding up to it.', A2, 0.4),

  melody('B', 's1b-01', 'Sol–mi', 'Sing a high note, then step down to a lower one.', '7 4'),
  melody('B', 's1b-02', 'Mi–sol', 'Sing a low note, then step up to a higher one.', '4 7'),
  melody('B', 's1b-03', 'Sol–la–sol–mi', 'Visit a higher note and come back down to where you began.', '7 9 7 4'),
  melody('B', 's1b-04', 'Do–re–mi', 'Climb three notes, one step at a time.', '0 2 4'),
  melody('B', 's1b-05', 'Mi–re–do', 'Walk three notes down, one step at a time.', '4 2 0'),
  melody('B', 's1b-06', 'Do–mi–sol', 'Leap up twice, landing cleanly on each note.', '0 4 7'),
  melody('B', 's1b-07', 'Sol–mi–do', 'Leap down twice, landing cleanly on each note.', '7 4 0'),

  melody('C', 's1c-01', 'Do–re–mi–do', 'Climb three notes and come back to the first.', '0 2 4 0'),
  melody('C', 's1c-02', 'Mi–re–do–re', 'Step down two notes and bounce back up one.', '4 2 0 2'),
  melody('C', 's1c-03', 'Sol–mi–re–do', 'Start high and work your way down to the bottom.', '7 4 2 0'),
  melody('C', 's1c-04', 'Do–mi–sol–mi', 'Leap up to the top and step back down one.', '0 4 7 4'),
  melody('C', 's1c-05', 'La–sol–mi–do', 'Start on the highest note and step down to the lowest.', '9 7 4 0'),
  melody('C', 's1c-06', 'Do–re–mi–sol', 'Climb three steps, then leap to the top.', '0 2 4 7'),

  melody('D', 's1d-01', 'Five notes up', 'Climb five notes in a row without slipping.', '0 2 4 5 7'),
  melody('D', 's1d-02', 'Five notes down', 'Walk five notes down without slipping.', '7 5 4 2 0'),
  melody('D', 's1d-03', 'Up and back down', 'Climb five notes and come back down again.', '0 2 4 5 7 5 4 2 0'),
];
