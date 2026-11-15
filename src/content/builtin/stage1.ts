import { makeLesson } from '../makeLesson';
import type { Lesson } from '../types';

const s1 = (order: number, title: string, goal: string, notation: string): Lesson =>
  makeLesson({
    id: `s1-0${order}`,
    stage: 1,
    order,
    title,
    goal,
    tempoBpm: 60,
    notation,
    toleranceId: 't1',
  });

export const stage1Lessons: Lesson[] = [
  s1(1, 'One note, three times', 'Find one note and hit it three times in a row.', '0 0 0'),
  s1(2, 'Step up and back', 'Sing a note, step up to the next one, and come back.', '0 2 0'),
  s1(3, 'Three notes up', 'Climb three notes, one step at a time.', '0 2 4'),
  s1(4, 'Three notes down', 'Walk three notes down, one step at a time.', '4 2 0'),
  s1(5, 'Up and back down', 'Climb three notes and come back down again.', '0 2 4 2 0'),
  s1(6, 'A small leap', 'Jump up to a higher note and land back where you started.', '0 4 0'),
  s1(7, 'Leaps up', 'Leap up twice, landing cleanly on each note.', '0 4 7'),
  s1(8, 'Five notes up', 'Climb five notes in a row without slipping.', '0 2 4 5 7'),
];
