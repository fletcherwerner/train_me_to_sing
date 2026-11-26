import { describe, expect, it } from 'vitest';
import type { ResolvedExercise } from '../../core/exercise/types';
import { simPitchAt } from './simSinger';

const ex: ResolvedExercise = {
  templateId: 't',
  tonicMidi: 60,
  tempoBpm: 60,
  beatsPerBar: 4,
  notes: [{ index: 0, midi: 64, startSec: 0, durationSec: 3 }],
  totalSec: 3,
};

describe('simPitchAt weDoMiss and the call', () => {
  const two: ResolvedExercise = {
    ...ex,
    notes: [
      { index: 0, midi: 60, startSec: 0, durationSec: 2 },
      { index: 1, midi: 64, startSec: 2, durationSec: 2 },
    ],
    totalSec: 4,
  };
  it('misses only the last note in We do, and is perfect in You do', () => {
    expect(simPitchAt(two, 'weDoMiss', 1, true)).toBe(60);
    expect(simPitchAt(two, 'weDoMiss', 3, true)).toBeNull();
    expect(simPitchAt(two, 'weDoMiss', 3, false)).toBe(64);
  });
  it('sings nothing before the student beat 0 (during the piano call)', () => {
    for (const b of ['perfect', 'flat70', 'weDoMiss'] as const) expect(simPitchAt(two, b, -3)).toBeNull();
  });
});

describe('simPitchAt findLate', () => {
  it('starts two semitones low, glides up and sits on the target after 1.5 s', () => {
    expect(simPitchAt(ex, 'findLate', 0)).toBeCloseTo(62);
    expect(simPitchAt(ex, 'findLate', 0.75)).toBeCloseTo(63);
    expect(simPitchAt(ex, 'findLate', 1.5)).toBe(64);
    expect(simPitchAt(ex, 'findLate', 2.5)).toBe(64);
  });
});
