import { describe, expect, it } from 'vitest';
import { accuracyOf, closeness, matchAccuracy, type AccuracyFrame } from './accuracy';
import { matchTarget } from './matchScoring';
import { getTolerance } from './tolerance';
import type { ResolvedExercise } from '../exercise/types';

function ex(notes: { midi: number; startSec: number; durationSec: number }[]): ResolvedExercise {
  return {
    templateId: 't',
    tonicMidi: 60,
    tempoBpm: 60,
    beatsPerBar: 4,
    notes: notes.map((n, index) => ({ index, ...n })),
    totalSec: Math.max(...notes.map((n) => n.startSec + n.durationSec)),
  };
}

/** Frames every 20 ms from `from` to `to`. */
function frames(from: number, to: number, midi: (t: number) => number | null): AccuracyFrame[] {
  const out: AccuracyFrame[] = [];
  for (let t = from; t < to - 1e-9; t += 0.02) out.push({ tSec: Number(t.toFixed(3)), midi: midi(t) });
  return out;
}

describe('closeness', () => {
  it('is 1 on target and up to 10 cents away', () => {
    expect(closeness(60, 60)).toBe(1);
    expect(closeness(60.1, 60)).toBe(1);
    expect(closeness(59.9, 60)).toBe(1);
  });
  it('falls linearly between 10 and 100 cents', () => {
    expect(closeness(60.55, 60)).toBeCloseTo(0.5, 5);
    expect(closeness(59.45, 60)).toBeCloseTo(0.5, 5);
  });
  it('is 0 at a semitone, an octave, or with no pitch', () => {
    expect(closeness(61, 60)).toBe(0);
    expect(closeness(48, 60)).toBe(0);
    expect(closeness(null, 60)).toBe(0);
  });
});

describe('accuracyOf', () => {
  const one = ex([{ midi: 60, startSec: 0, durationSec: 2 }]);

  it('is 1 when dead on', () => {
    expect(accuracyOf(one, frames(0, 2, () => 60)).overall).toBeCloseTo(1, 5);
  });
  it('is 55 cents -> 0.5', () => {
    expect(accuracyOf(one, frames(0, 2, () => 60.55)).overall).toBeCloseTo(0.5, 5);
  });
  it('is 0 a semitone away and an octave away', () => {
    expect(accuracyOf(one, frames(0, 2, () => 61)).overall).toBe(0);
    expect(accuracyOf(one, frames(0, 2, () => 48)).overall).toBe(0);
  });
  it('counts silence against the note: silent half -> 0.5', () => {
    const half = ex([{ midi: 60, startSec: 0, durationSec: 2 }]);
    // The scoop allowance skips the first 0.15 s, so judge the second half silent exactly.
    const a = accuracyOf(half, frames(0, 2, (t) => (t < 1.075 ? 60 : null))).overall;
    expect(a).toBeCloseTo(0.5, 1);
  });
  it('no frames -> 0', () => {
    expect(accuracyOf(one, []).overall).toBe(0);
  });
  it('weighs notes equally whatever their length', () => {
    const two = ex([
      { midi: 60, startSec: 0, durationSec: 1 },
      { midi: 62, startSec: 1, durationSec: 4 },
    ]);
    const r = accuracyOf(two, frames(0, 5, (t) => (t < 1 ? 60 : null)));
    expect(r.perNote[0]).toBeCloseTo(1, 5);
    expect(r.perNote[1]).toBe(0);
    expect(r.overall).toBeCloseTo(0.5, 5);
  });
  it('skips the scoop allowance at the start of a note', () => {
    // Wrong for the first 0.15 s (the allowance), then dead on.
    const a = accuracyOf(one, frames(0, 2, (t) => (t < 0.15 ? 58 : 60)));
    expect(a.overall).toBeCloseTo(1, 5);
    // A slide that lasts longer than the allowance is counted.
    const b = accuracyOf(one, frames(0, 2, (t) => (t < 0.5 ? 58 : 60)));
    expect(b.overall).toBeLessThan(1);
  });
});

describe('matchAccuracy', () => {
  const t1 = getTolerance('t1');
  it('starts at the voice and stops at the end of the matching hold', () => {
    // Silent to 1 s, 70 cents sharp 1..2 s, then dead on; hold 1 s. Later junk must not count.
    const f = frames(0, 8, (t) => (t < 1 ? null : t < 2 ? 60.7 : t < 4 ? 60 : 70));
    const o = matchTarget(f, 60, t1, 1);
    expect(o.matched).toBe(true);
    const a = matchAccuracy(f, 60, o, 1, 8);
    // 1 s at closeness (100-70)/90 = 1/3, then 1 s at 1 -> about 2/3.
    expect(a).toBeCloseTo(2 / 3, 1);
  });
  it('is 0 when the voice never starts', () => {
    const f = frames(0, 8, () => null);
    expect(matchAccuracy(f, 60, matchTarget(f, 60, t1, 1), 1, 8)).toBe(0);
  });
  it('runs to the end of the window when never matched', () => {
    const f = frames(0, 8, () => 60.55);
    const o = matchTarget(f, 60, getTolerance('t1'), 100);
    expect(matchAccuracy(f, 60, o, 100, 8)).toBeCloseTo(0.5, 5);
  });
});
