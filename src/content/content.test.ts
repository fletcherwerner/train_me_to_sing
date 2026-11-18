import { describe, expect, it } from 'vitest';
import { getAllLessons, getLesson } from './registry';
import { getTolerance } from '../core/scoring/tolerance';
import { fit } from '../core/exercise/fit';

describe('built-in lessons', () => {
  const lessons = getAllLessons();

  it('has the new Stage 1 in four units', () => {
    const s1 = lessons.filter((l) => l.stage === 1);
    expect(s1.map((l) => l.id)).toEqual([
      's1a-01', 's1a-02', 's1a-03',
      's1b-01', 's1b-02', 's1b-03', 's1b-04', 's1b-05', 's1b-06', 's1b-07',
      's1c-01', 's1c-02', 's1c-03', 's1c-04', 's1c-05', 's1c-06',
      's1d-01', 's1d-02', 's1d-03',
    ]);
    expect(s1.map((l) => l.unit?.id)).toEqual([...'AAA', ...'BBBBBBB', ...'CCCCCC', ...'DDD']);
    expect(new Set(s1.map((l) => l.unit?.title))).toEqual(
      new Set(['Find your voice', 'First intervals', 'Four-note patterns', 'Five-note scale']),
    );
    expect(s1.every((l) => l.toleranceId === 't1' && l.exercise.tempoBpm === 60 && l.passScore === 0.8)).toBe(true);
  });

  it('Stage 1 melody lessons have the planned notation, offsets and durations', () => {
    const offsets = (id: string) => getLesson(id)!.exercise.notes.map((n) => n.offset);
    const beats = (id: string) => getLesson(id)!.exercise.notes.map((n) => n.durationBeats);
    expect(offsets('s1b-01')).toEqual([7, 4]);
    expect(offsets('s1b-03')).toEqual([7, 9, 7, 4]);
    expect(offsets('s1b-07')).toEqual([7, 4, 0]);
    expect(offsets('s1c-05')).toEqual([9, 7, 4, 0]);
    expect(offsets('s1d-03')).toEqual([0, 2, 4, 5, 7, 5, 4, 2, 0]);
    expect(beats('s1b-04')).toEqual([2, 2, 2]);
    expect(beats('s1c-01')).toEqual([1, 1, 1, 2]);
    for (const l of lessons.filter((x) => x.kind === 'melody' && x.stage === 1)) {
      expect(l.levels).toBe(true);
      expect(l.echo).toBe(l.unit?.id === 'B');
      expect(l.exercise.notes.at(-1)!.durationBeats).toBe(2);
    }
  });

  it('Unit A are match lessons without levels', () => {
    const a = ['s1a-01', 's1a-02', 's1a-03'].map((id) => getLesson(id)!);
    expect(a.every((l) => l.kind === 'match' && !l.levels && l.echo && l.holdSec === 1)).toBe(true);
    expect(a[0].matchTargets).toEqual(Array(5).fill({ placement: 'mid' }));
    expect(a[1].matchTargets!.map((t) => t.placement)).toEqual(['low', 'mid', 'high', 'mid', 'low', 'high']);
    expect(a[2].matchTargets).toEqual(a[1].matchTargets);
    expect(a.map((l) => l.landWithinSec)).toEqual([null, null, 0.4]);
  });

  it('Stages 2 and 3 keep the single You do flow', () => {
    for (const l of lessons.filter((x) => x.stage > 1)) {
      expect(l).toMatchObject({ kind: 'melody', levels: false, echo: false });
    }
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
    expect(getLesson('s1b-04')?.title).toBe('Do–re–mi');
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
