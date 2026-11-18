import { describe, expect, it } from 'vitest';
import { parseNotation } from './notation';
import { fit, pickTonic } from './fit';
import type { ExerciseTemplate } from './types';

const tpl = (notation: string): ExerciseTemplate => ({
  id: 't',
  title: 't',
  tempoBpm: 60,
  beatsPerBar: 4,
  notes: parseNotation(notation),
});
const range = { lowMidi: 48, highMidi: 67 };

/** A seeded generator, so the tests are repeatable. */
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('fit opts.tonicMidi', () => {
  it('places the exercise on the given tonic', () => {
    const r = fit(tpl('0 2 4'), range, { tonicMidi: 55 });
    expect(r.ok && r.exercise.tonicMidi).toBe(55);
    expect(r.ok && r.exercise.notes.map((n) => n.midi)).toEqual([55, 57, 59]);
  });
  it('without opts is centred as before', () => {
    const centred = fit(tpl('0 2 4'), range);
    expect(centred).toEqual(fit(tpl('0 2 4'), range, {}));
    expect(centred.ok && centred.exercise.tonicMidi).toBe(48 + Math.floor((19 - 4) / 2));
  });
  it('falls back to the centred key if the tonic would leave the range', () => {
    const r = fit(tpl('0 2 4'), range, { tonicMidi: 66 });
    expect(r).toEqual(fit(tpl('0 2 4'), range));
  });
  it('handles negative offsets', () => {
    const r = fit(tpl('0 -3 0'), range, { tonicMidi: 52 });
    expect(r.ok && r.exercise.notes.map((n) => n.midi)).toEqual([52, 49, 52]);
  });
});

describe('pickTonic', () => {
  it('always returns a tonic that fits, and varies with the rng', () => {
    const t = tpl('7 9 7 4');
    const rng = lcg(7);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const tonic = pickTonic(t, range, rng)!;
      const r = fit(t, range, { tonicMidi: tonic });
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.exercise.tonicMidi).toBe(tonic);
        for (const n of r.exercise.notes) {
          expect(n.midi).toBeGreaterThanOrEqual(range.lowMidi);
          expect(n.midi).toBeLessThanOrEqual(range.highMidi);
        }
      }
      seen.add(tonic);
    }
    expect(seen.size).toBeGreaterThan(5);
  });
  it('covers the lowest and highest fitting tonics', () => {
    expect(pickTonic(tpl('0 2 4'), range, () => 0)).toBe(48);
    expect(pickTonic(tpl('0 2 4'), range, () => 0.999999)).toBe(63);
  });
  it('avoids the previous tonic when another fits', () => {
    const rng = lcg(3);
    for (let i = 0; i < 200; i++) expect(pickTonic(tpl('0 2 4'), range, rng, 55)).not.toBe(55);
    // A range with exactly two tonics: the other one every time.
    const tight = { lowMidi: 60, highMidi: 65 };
    for (let i = 0; i < 50; i++) expect(pickTonic(tpl('0 2 4'), tight, rng, 61)).toBe(60);
  });
  it('reuses the tonic when it is the only one that fits, and returns null when nothing fits', () => {
    expect(pickTonic(tpl('0 2 4'), { lowMidi: 60, highMidi: 64 }, () => 0.5, 60)).toBe(60);
    expect(pickTonic(tpl('0 2 4 5 7'), { lowMidi: 60, highMidi: 63 }, () => 0.5)).toBeNull();
  });
  it('is pure: the same rng sequence gives the same tonics', () => {
    const a = lcg(11);
    const b = lcg(11);
    for (let i = 0; i < 20; i++) expect(pickTonic(tpl('0 4 7'), range, a)).toBe(pickTonic(tpl('0 4 7'), range, b));
  });
});
