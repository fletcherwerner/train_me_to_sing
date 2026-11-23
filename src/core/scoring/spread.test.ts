import { describe, expect, it } from 'vitest';
import { evaluateAttempt, type ScoredFrame } from './evaluate';
import { spreadOf } from './spread';
import { getTolerance } from './tolerance';
import { describeMatch, matchTarget } from './matchScoring';
import { parseNotation } from '../exercise/notation';
import { fit } from '../exercise/fit';

const t1 = getTolerance('t1');
const ex = (() => {
  const r = fit({ id: 't', title: 't', tempoBpm: 60, beatsPerBar: 4, notes: parseNotation('0:4') }, { lowMidi: 48, highMidi: 72 });
  if (!r.ok) throw new Error('fit');
  return r.exercise;
})();
const frames = (fn: (i: number) => number | null): ScoredFrame[] =>
  Array.from({ length: 200 }, (_, i) => ({ tSec: (i / 200) * ex.totalSec, midi: fn(i) }));

describe('spreadOf', () => {
  it('is the interquartile range', () => {
    expect(spreadOf([1, 2, 3, 4, 5])).toBe(2);
    expect(spreadOf([5, 5, 5, 5])).toBe(0);
    expect(spreadOf([])).toBe(0);
  });
});

describe('spreadCents in scoring', () => {
  const target = ex.notes[0].midi;
  it('is about 0 for a steady note', () => {
    const r = evaluateAttempt(ex, frames(() => target + 0.1), t1, 0.8);
    expect(r.notes[0].spreadCents).toBeCloseTo(0, 5);
  });
  it('is large for a wobbling note and does not change hit or miss', () => {
    const wobble = frames((i) => target + (i % 2 === 0 ? 0.3 : -0.3));
    const steady = frames(() => target);
    const w = evaluateAttempt(ex, wobble, t1, 0.8);
    const s = evaluateAttempt(ex, steady, t1, 0.8);
    expect(w.notes[0].spreadCents).toBeGreaterThan(40);
    expect(w.notes[0].hit).toBe(s.notes[0].hit);
    expect(w.score).toBe(s.score);
  });
  it('is absent for a silent note', () => {
    const r = evaluateAttempt(ex, frames(() => null), t1, 0.8);
    expect(r.notes[0].reason).toBe('silent');
    expect(r.notes[0].spreadCents).toBeUndefined();
  });
});

describe('spreadCents in match descriptions', () => {
  const tol = getTolerance('t1');
  const mk = (fn: (i: number) => number | null) =>
    Array.from({ length: 200 }, (_, i) => ({ tSec: i * 0.04, midi: fn(i) }));
  it('is 0 for steady singing and large for a wobble; the outcome is the same', () => {
    const steady = mk(() => 60);
    const wobble = mk((i) => 60 + (i % 2 === 0 ? 0.3 : -0.3));
    const so = matchTarget(steady, 60, tol, 1);
    const wo = matchTarget(wobble, 60, tol, 1);
    expect(so.matched).toBe(wo.matched);
    expect(describeMatch(steady, 60, tol, so).spreadCents).toBeCloseTo(0, 5);
    expect(describeMatch(wobble, 60, tol, wo).spreadCents).toBeGreaterThan(40);
  });
  it('counts only the frames after the first voiced one', () => {
    const f = mk((i) => (i < 50 ? null : 60));
    const d = describeMatch(f, 60, tol, matchTarget(f, 60, tol, 1));
    expect(d.spreadCents).toBeCloseTo(0, 5);
  });
});
