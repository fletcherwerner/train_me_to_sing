import { linesFromLengths } from '../../core/exercise/phrases';
import type { Phrase } from '../../core/exercise/types';
import { makeLesson } from '../makeLesson';
import type { Lesson } from '../types';

const song = (
  order: number,
  title: string,
  goal: string,
  tempoBpm: number,
  toleranceId: 't3' | 't4',
  notation: string,
  lyrics: string[],
  phrases: Phrase[],
): Lesson => makeLesson({ id: `s3-0${order}`, stage: 3, order, title, goal, tempoBpm, notation, lyrics, toleranceId, phrases });

const words = (text: string): string[] => text.split('/').map((w) => w.trim());

export const stage3Lessons: Lesson[] = [
  song(
    1,
    'Hot Cross Buns',
    'Sing the nursery tune, one syllable on each note.',
    72,
    't3',
    '4 2 0:2 4 2 0:2 0:.5 0:.5 0:.5 0:.5 2:.5 2:.5 2:.5 2:.5 4 2 0:2',
    words('Hot / cross / buns / hot / cross / buns / one / a / pen / ny / two / a / pen / ny / hot / cross / buns'),
    linesFromLengths([3, 3, 8, 3]),
  ),
  song(
    2,
    'Mary Had a Little Lamb',
    'Sing the whole song with its words.',
    80,
    't3',
    '4 2 0 2 4 4 4:2 2 2 2:2 4 7 7:2 4 2 0 2 4 4 4 4 2 2 4 2 0:4',
    words(
      'Ma / ry / had / a / lit / tle / lamb / lit / tle / lamb / lit / tle / lamb / Ma / ry / had / a / lit / tle / lamb / its / fleece / was / white / as / snow',
    ),
    linesFromLengths([7, 6, 7, 6]),
  ),
  song(
    3,
    'Ode to Joy (first two phrases)',
    'Sing the famous tune on "la" for every note.',
    80,
    't3',
    '4 4 5 7 7 5 4 2 0 0 2 4 4:1.5 2:.5 2:2 4 4 5 7 7 5 4 2 0 0 2 4 2:1.5 0:.5 0:2',
    Array.from({ length: 30 }, () => 'la'),
    linesFromLengths([15, 15]),
  ),
  song(
    4,
    'Twinkle Twinkle Little Star',
    'Sing the whole song, a long one, with its words.',
    80,
    't4',
    '0 0 7 7 9 9 7:2 5 5 4 4 2 2 0:2 7 7 5 5 4 4 2:2 7 7 5 5 4 4 2:2 0 0 7 7 9 9 7:2 5 5 4 4 2 2 0:2',
    words(
      'Twin / kle / twin / kle / lit / tle / star / how / I / won / der / what / you / are / up / a / bove / the / world / so / high / like / a / dia / mond / in / the / sky / twin / kle / twin / kle / lit / tle / star / how / I / won / der / what / you / are',
    ),
    linesFromLengths([7, 7, 7, 7, 7, 7]),
  ),
  song(
    5,
    'Frère Jacques',
    'Sing the round with its words, including the low notes at the end.',
    88,
    't4',
    '0 2 4 0 0 2 4 0 4 5 7:2 4 5 7:2 7:.5 9:.5 7:.5 5:.5 4 0 7:.5 9:.5 7:.5 5:.5 4 0 0 -5 0:2 0 -5 0:2',
    words(
      'Frè / re / Jac / ques / Frè / re / Jac / ques / dor / mez / vous / dor / mez / vous / son / nez / les / ma / ti / nes / son / nez / les / ma / ti / nes / ding / dang / dong / ding / dang / dong',
    ),
    linesFromLengths([8, 6, 12, 6]),
  ),
];
