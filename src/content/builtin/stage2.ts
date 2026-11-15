import { makeLesson } from '../makeLesson';
import type { Lesson } from '../types';

const s2 = (
  order: number,
  title: string,
  goal: string,
  tempoBpm: number,
  toleranceId: 't2' | 't3',
  notation: string,
): Lesson => makeLesson({ id: `s2-0${order}`, stage: 2, order, title, goal, tempoBpm, notation, toleranceId });

export const stage2Lessons: Lesson[] = [
  s2(1, 'Five-note scale, up and down', 'Climb five scale notes and come back down, keeping each note steady.', 60, 't2', '0 2 4 5 7 5 4 2 0:2'),
  s2(2, 'Major arpeggio', 'Sing the notes of a major chord: up to the top and back.', 60, 't2', '0 4 7 4 0:2'),
  s2(3, 'Major scale up', 'Sing a full major scale up an octave.', 60, 't2', '0 2 4 5 7 9 11 12:2'),
  s2(4, 'Major scale down', 'Sing a full major scale down an octave.', 60, 't2', '12 11 9 7 5 4 2 0:2'),
  s2(5, 'Major scale up and down', 'Sing the whole major scale up and back down, a little faster.', 72, 't3', '0 2 4 5 7 9 11 12 11 9 7 5 4 2 0:2'),
  s2(6, 'Octave arpeggio', 'Leap through the chord notes up a full octave and back.', 72, 't3', '0 4 7 12 7 4 0:2'),
  s2(7, 'Five-note scale in eighths', 'Sing the five-note scale in quick half-beat notes.', 72, 't3', '0:.5 2:.5 4:.5 5:.5 7:.5 5:.5 4:.5 2:.5 0:2'),
  s2(8, 'Natural minor scale up and down', 'Sing the minor scale up and back, listening for its darker colour.', 72, 't3', '0 2 3 5 7 8 10 12 10 8 7 5 3 2 0:2'),
];
