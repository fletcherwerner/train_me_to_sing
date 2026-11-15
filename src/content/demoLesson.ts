import { parseNotation } from '../core/exercise/notation';
import type { Lesson } from './types';

export const demoLesson: Lesson = {
  id: 'demo',
  stage: 1,
  order: 0,
  title: 'Demo: five-note step',
  goal: 'Match five notes that step up and back down.',
  exercise: {
    id: 'demo',
    title: 'Demo: five-note step',
    tempoBpm: 60,
    beatsPerBar: 4,
    notes: parseNotation('0 2 4 2 0'),
  },
  toleranceId: 't1',
  passScore: 0.8,
  source: 'builtin',
};
