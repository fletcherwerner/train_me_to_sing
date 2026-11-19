import { describe, expect, it } from 'vitest';
import { nextLesson, nextLessonAfter, type NextLessonInfo } from './next';
import { parseNotation } from '../exercise/notation';

const tpl = (notation: string) => ({
  id: 't',
  title: 't',
  tempoBpm: 60,
  beatsPerBar: 4,
  notes: parseNotation(notation),
});
const mk = (id: string, notation = '0 2', source: 'builtin' | 'imported' = 'builtin'): NextLessonInfo => ({
  id,
  source,
  exercise: tpl(notation),
});
const range = { lowMidi: 48, highMidi: 60 }; // 12 semitones
const done = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, { passed: true }]));

describe('nextLessonAfter', () => {
  const lessons = [mk('a'), mk('b'), mk('c'), mk('d')];
  it('returns the following lesson', () => {
    expect(nextLessonAfter(lessons, {}, 'a', range)?.id).toBe('b');
  });
  it('skips mastered lessons', () => {
    expect(nextLessonAfter(lessons, done('b'), 'a', range)?.id).toBe('c');
  });
  it('skips lessons that do not fit the range', () => {
    const l = [mk('a'), mk('wide', '0 24'), mk('c')];
    expect(nextLessonAfter(l, {}, 'a', range)?.id).toBe('c');
  });
  it('wraps round to earlier unmastered lessons', () => {
    expect(nextLessonAfter(lessons, done('d'), 'd', range)?.id).toBe('a');
    expect(nextLessonAfter(lessons, done('c', 'd'), 'c', range)?.id).toBe('a');
  });
  it('returns null when everything else is mastered', () => {
    expect(nextLessonAfter(lessons, done('a', 'b', 'c', 'd'), 'b', range)).toBeNull();
  });
  it('does not return the current lesson even if it is unmastered', () => {
    expect(nextLessonAfter([mk('a')], {}, 'a', range)).toBeNull();
  });
  it('skips imported songs', () => {
    const l = [mk('a'), mk('song', '0 2', 'imported'), mk('c')];
    expect(nextLessonAfter(l, {}, 'a', range)?.id).toBe('c');
    expect(nextLessonAfter([mk('a'), mk('song', '0 2', 'imported')], {}, 'a', range)).toBeNull();
  });
});

describe('nextLesson', () => {
  it('is the first unmastered lesson that fits', () => {
    const l = [mk('a'), mk('wide', '0 24'), mk('c')];
    expect(nextLesson(l, done('a'), range)?.id).toBe('c');
    expect(nextLesson(l, {}, range)?.id).toBe('a');
  });
  it('skips imported songs and returns null when all are mastered', () => {
    expect(nextLesson([mk('song', '0', 'imported')], {}, range)).toBeNull();
    expect(nextLesson([mk('a')], done('a'), range)).toBeNull();
  });
});
