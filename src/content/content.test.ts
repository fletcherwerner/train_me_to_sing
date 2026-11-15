import { describe, expect, it } from 'vitest';
import { getAllLessons, getLesson } from './registry';
import { getTolerance } from '../core/scoring/tolerance';
import { fit } from '../core/exercise/fit';

describe('built-in lessons', () => {
  const lessons = getAllLessons();

  it('has the eight Stage 1 lessons in order', () => {
    expect(lessons.filter((l) => l.stage === 1).map((l) => l.id)).toEqual(['s1-01', 's1-02', 's1-03', 's1-04', 's1-05', 's1-06', 's1-07', 's1-08']);
  });

  it('has the eight Stage 2 lessons in order, t2 then t3', () => {
    const s2 = lessons.filter((l) => l.stage === 2);
    expect(s2.map((l) => l.id)).toEqual(['s2-01', 's2-02', 's2-03', 's2-04', 's2-05', 's2-06', 's2-07', 's2-08']);
    expect(s2.map((l) => l.toleranceId)).toEqual(['t2', 't2', 't2', 't2', 't3', 't3', 't3', 't3']);
    expect(s2.map((l) => l.exercise.tempoBpm)).toEqual([60, 60, 60, 60, 72, 72, 72, 72]);
  });

  it('has unique ids', () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
  });

  it('getLesson finds by id and returns undefined for unknown', () => {
    expect(getLesson('s1-03')?.title).toBe('Three notes up');
    expect(getLesson('nope')).toBeUndefined();
  });

  for (const l of getAllLessons()) {
    describe(l.id, () => {
      it('parses and has a goal', () => {
        expect(l.exercise.notes.length).toBeGreaterThan(0);
        expect(l.goal.length).toBeGreaterThan(0);
        expect(l.passScore).toBe(0.8);
        expect(l.source).toBe('builtin');
      });
      it('has a known tolerance', () => {
        expect(() => getTolerance(l.toleranceId)).not.toThrow();
      });
      it('lyrics match note count when present', () => {
        const lyrics = l.exercise.notes.filter((n) => n.lyric !== undefined);
        if (lyrics.length > 0) expect(lyrics.length).toBe(l.exercise.notes.length);
      });
      it('fits a 12-semitone range when span <= 12', () => {
        const offs = l.exercise.notes.map((n) => n.offset);
        const span = Math.max(...offs) - Math.min(...offs);
        if (span <= 12) expect(fit(l.exercise, { lowMidi: 48, highMidi: 60 }).ok).toBe(true);
      });
    });
  }
});
