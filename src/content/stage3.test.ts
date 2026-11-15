import { describe, expect, it } from 'vitest';
import { getLesson } from './registry';
import { fit } from '../core/exercise/fit';
import { slicePhrase } from '../core/exercise/phrases';

const IDS = ['s3-01', 's3-02', 's3-03', 's3-04', 's3-05'];
const BEATS: Record<string, number> = { 's3-01': 16, 's3-02': 32, 's3-03': 32, 's3-04': 48, 's3-05': 32 };

describe('stage 3 content', () => {
  it('has five songs with the listed tolerances and tempi', () => {
    expect(IDS.map((i) => getLesson(i)?.toleranceId)).toEqual(['t3', 't3', 't3', 't4', 't4']);
    expect(IDS.map((i) => getLesson(i)?.exercise.tempoBpm)).toEqual([72, 80, 80, 80, 88]);
  });
  it('note counts match the catalog and every note has a lyric', () => {
    expect(IDS.map((i) => getLesson(i)!.exercise.notes.length)).toEqual([17, 26, 30, 42, 32]);
    for (const i of IDS) expect(getLesson(i)!.exercise.notes.every((n) => n.lyric !== undefined)).toBe(true);
  });
  for (const id of IDS) {
    it(`${id} total beats`, () => {
      const ns = getLesson(id)!.exercise.notes;
      const last = ns[ns.length - 1];
      expect(last.startBeat + last.durationBeats).toBe(BEATS[id]);
    });
    it(`${id} phrases cover every note exactly once, in order`, () => {
      const ex = getLesson(id)!.exercise;
      const covered: number[] = [];
      for (const p of ex.phrases!) for (let i = p.startNote; i <= p.endNote; i++) covered.push(i);
      expect(covered).toEqual(ex.notes.map((_, i) => i));
    });
  }
  it('Twinkle has six phrases of seven notes', () => {
    const ph = getLesson('s3-04')!.exercise.phrases!;
    expect(ph).toHaveLength(6);
    expect(ph.every((p) => p.endNote - p.startNote === 6)).toBe(true);
  });
  it('spans: Twinkle 9, Frère Jacques 14 (does not fit 13)', () => {
    const span = (id: string) => {
      const o = getLesson(id)!.exercise.notes.map((n) => n.offset);
      return Math.max(...o) - Math.min(...o);
    };
    expect(span('s3-04')).toBe(9);
    expect(span('s3-05')).toBe(14);
    expect(fit(getLesson('s3-05')!.exercise, { lowMidi: 45, highMidi: 58 }).ok).toBe(false);
  });
  it('slicing a real phrase gives its length', () => {
    const lesson = getLesson('s3-01')!;
    const f = fit(lesson.exercise, { lowMidi: 40, highMidi: 60 });
    if (!f.ok) throw new Error('fit');
    const s = slicePhrase(f.exercise, lesson.exercise.phrases![2]);
    expect(s.notes).toHaveLength(8);
    expect(s.totalSec).toBeCloseTo(4 * (60 / 72));
  });
});
