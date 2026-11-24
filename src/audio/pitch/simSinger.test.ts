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

describe('simPitchAt findLate', () => {
  it('starts two semitones low, glides up and sits on the target after 1.5 s', () => {
    expect(simPitchAt(ex, 'findLate', 0)).toBeCloseTo(62);
    expect(simPitchAt(ex, 'findLate', 0.75)).toBeCloseTo(63);
    expect(simPitchAt(ex, 'findLate', 1.5)).toBe(64);
    expect(simPitchAt(ex, 'findLate', 2.5)).toBe(64);
  });
});
