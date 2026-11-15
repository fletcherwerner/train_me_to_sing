import { describe, expect, it } from 'vitest';
import { evaluateAttempt, type ScoredFrame } from './evaluate';
import { TOLERANCES, TOLERANCE_FLOOR, getTolerance } from './tolerance';
import { parseNotation } from '../exercise/notation';
import { fit } from '../exercise/fit';
import type { ResolvedExercise } from '../exercise/types';

function make(notation: string, tempo = 60): ResolvedExercise {
  const r = fit(
    { id: 't', title: 't', tempoBpm: tempo, beatsPerBar: 4, notes: parseNotation(notation) },
    { lowMidi: 48, highMidi: 72 },
  );
  if (!r.ok) throw new Error('fit');
  return r.exercise;
}

/** Frames at 60 fps from -1 s to totalSec + 0.5 s. fn gets time relative to exercise start. */
function framesFor(ex: ResolvedExercise, fn: (rel: number) => number | null): ScoredFrame[] {
  const out: ScoredFrame[] = [];
  const n = Math.round((ex.totalSec + 1.5) * 60);
  for (let i = 0; i <= n; i++) {
    const t = -1 + i / 60;
    out.push({ tSec: t, midi: fn(t) });
  }
  return out;
}

const noteAt = (ex: ResolvedExercise, t: number) =>
  ex.notes.find((n) => t >= n.startSec && t < n.startSec + n.durationSec);
const sing = (ex: ResolvedExercise, f: (midi: number, into: number, frac: number) => number | null) => (t: number) => {
  const n = noteAt(ex, t);
  return n ? f(n.midi, t - n.startSec, (t - n.startSec) / n.durationSec) : null;
};

const t1 = getTolerance('t1');

describe('tolerance', () => {
  it('no profile is below the floor', () => {
    for (const p of TOLERANCES) {
      expect(p.cents).toBeGreaterThanOrEqual(TOLERANCE_FLOOR.cents);
      expect(p.timingMs).toBeGreaterThanOrEqual(TOLERANCE_FLOOR.timingMs);
    }
  });
  it('has t1-t4 and throws on unknown', () => {
    expect(TOLERANCES.map((p) => p.id)).toEqual(['t1', 't2', 't3', 't4']);
    expect(() => getTolerance('x')).toThrow();
  });
});

describe('evaluateAttempt', () => {
  const ex = make('0 2 4');

  it('perfect', () => {
    const r = evaluateAttempt(ex, framesFor(ex, sing(ex, (m) => m)), t1, 0.8);
    expect(r.notes.every((n) => n.hit)).toBe(true);
    expect(r.score).toBe(1);
    expect(r.passed).toBe(true);
  });
  it('40 cents flat hits', () => {
    const r = evaluateAttempt(ex, framesFor(ex, sing(ex, (m) => m - 0.4)), t1, 0.8);
    expect(r.notes.every((n) => n.hit)).toBe(true);
  });
  it('70 cents flat is wrong-note', () => {
    const r = evaluateAttempt(ex, framesFor(ex, sing(ex, (m) => m - 0.7)), t1, 0.8);
    for (const n of r.notes) {
      expect(n.reason).toBe('wrong-note');
      expect(n.medianCents).toBeCloseTo(-70, 3);
    }
  });
  it('octave down is wrong-octave', () => {
    const r = evaluateAttempt(ex, framesFor(ex, sing(ex, (m) => m - 12)), t1, 0.8);
    expect(r.notes.every((n) => n.reason === 'wrong-octave')).toBe(true);
    expect(r.passed).toBe(false);
  });
  it('late 300 ms: hit under t1, late under t4', () => {
    const frames = framesFor(ex, (t) => sing(ex, (m) => m)(t - 0.3));
    expect(evaluateAttempt(ex, frames, t1, 0.8).notes.every((n) => n.hit)).toBe(true);
    const r4 = evaluateAttempt(ex, frames, getTolerance('t4'), 0.8);
    expect(r4.notes.every((n) => n.reason === 'late')).toBe(true);
    expect(r4.notes[1].onsetErrorMs).toBeGreaterThan(250);
  });
  it('early onset is flagged', () => {
    const frames = framesFor(ex, (t) => sing(ex, (m) => m)(t + 0.22));
    const r = evaluateAttempt(ex, frames, getTolerance('t4'), 0.8);
    expect(r.notes[1].reason).toBe('early');
  });
  it('on target 30% then +1.5 semitones misses', () => {
    const r = evaluateAttempt(ex, framesFor(ex, sing(ex, (m, _i, f) => (f < 0.3 ? m : m + 1.5))), t1, 0.8);
    for (const n of r.notes) {
      expect(n.hit).toBe(false);
      expect(['wrong-note', 'wavered']).toContain(n.reason);
    }
  });
  it('on target 80% then silent hits', () => {
    const r = evaluateAttempt(ex, framesFor(ex, sing(ex, (m, _i, f) => (f < 0.8 ? m : null))), t1, 0.8);
    expect(r.notes.every((n) => n.hit)).toBe(true);
  });
  it('silent', () => {
    const r = evaluateAttempt(ex, framesFor(ex, () => null), t1, 0.8);
    expect(r.notes.every((n) => n.reason === 'silent' && n.medianCents === null)).toBe(true);
    expect(r.score).toBe(0);
  });
  it('repeated notes with continuous pitch skip timing', () => {
    const rep = make('0 0 0');
    const r = evaluateAttempt(rep, framesFor(rep, (t) => (t >= 0 && t < rep.totalSec ? rep.notes[0].midi : null)), getTolerance('t4'), 0.8);
    expect(r.notes.every((n) => n.hit)).toBe(true);
    expect(r.notes[1].onsetErrorMs).toBeNull();
    expect(r.notes[2].onsetErrorMs).toBeNull();
  });
  it('4 of 5 perfect, one silent: 0.8 and passed', () => {
    const five = make('0 2 4 2 0');
    const r = evaluateAttempt(five, framesFor(five, sing(five, (m) => m)).map((f) => (f.tSec >= 2 && f.tSec < 3 ? { ...f, midi: null } : f)), t1, 0.8);
    expect(r.notes.filter((n) => !n.hit)).toHaveLength(1);
    expect(r.notes[2].reason).toBe('silent');
    expect(r.score).toBeCloseTo(0.8);
    expect(r.passed).toBe(true);
  });
});
