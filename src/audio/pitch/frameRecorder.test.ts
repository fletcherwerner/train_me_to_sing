import { describe, expect, it } from 'vitest';
import { recordFrames } from './frameRecorder';
import { simPitchAt } from './simSinger';
import type { PitchFrame, PitchSource } from './PitchSource';
import type { ResolvedExercise } from '../../core/exercise/types';

function fakeSource() {
  const cbs = new Set<(f: PitchFrame) => void>();
  const src: PitchSource = {
    start: async () => {},
    stop: () => {},
    subscribe: (cb) => {
      cbs.add(cb);
      return () => cbs.delete(cb);
    },
  };
  return { src, emit: (tSec: number) => cbs.forEach((cb) => cb({ tSec, midi: 60, clarity: 1, rms: 0.1 })) };
}

describe('recordFrames', () => {
  it('filters to the window and rewrites time', () => {
    const { src, emit } = fakeSource();
    const rec = recordFrames(src, 10, 14, 0.1);
    for (const t of [8.9, 9.0, 10, 14.5, 14.6]) emit(t);
    expect(rec.frames.map((f) => f.tSec)).toEqual([-1.1, -0.1, 4.4].map((x) => expect.closeTo(x, 6)));
    rec.stop();
    emit(11);
    expect(rec.frames).toHaveLength(3);
  });
});

describe('simPitchAt', () => {
  const ex: ResolvedExercise = {
    templateId: 't',
    tonicMidi: 60,
    tempoBpm: 60,
    beatsPerBar: 4,
    totalSec: 2,
    notes: [
      { index: 0, midi: 60, startSec: 0, durationSec: 1 },
      { index: 1, midi: 62, startSec: 1, durationSec: 1 },
    ],
  };
  it('follows the exercise', () => {
    expect(simPitchAt(ex, 'perfect', 0.5)).toBe(60);
    expect(simPitchAt(ex, 'perfect', -0.5)).toBeNull();
    expect(simPitchAt(ex, 'flat70', 1.5)).toBeCloseTo(61.3);
    expect(simPitchAt(ex, 'octaveDown', 0.5)).toBe(48);
    expect(simPitchAt(ex, 'late300', 0.2)).toBeNull();
    expect(simPitchAt(ex, 'late300', 0.4)).toBe(60);
    expect(simPitchAt(ex, 'wobble', 0.1)).toBe(60);
    expect(simPitchAt(ex, 'wobble', 0.6)).toBe(61.5);
    expect(simPitchAt(ex, 'silent', 0.5)).toBeNull();
  });
});
