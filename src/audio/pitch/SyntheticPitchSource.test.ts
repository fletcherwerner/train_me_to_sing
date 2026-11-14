import { describe, expect, it, vi } from 'vitest';
import { createSyntheticPitchSource, constantPitch } from './SyntheticPitchSource';
import type { PitchFrame } from './PitchSource';

// Mock audioEngine so we don't need a real AudioContext in jsdom
let mockTime = 0;
vi.mock('../audioEngine', () => ({
  now: () => {
    mockTime += 0.016;
    return mockTime;
  },
}));

describe('SyntheticPitchSource', () => {
  it('emits frames with the configured pitch', () => {
    mockTime = 0;
    const frames: PitchFrame[] = [];
    const src = createSyntheticPitchSource(constantPitch(60.3));
    const unsub = src.subscribe((f) => frames.push(f));
    src.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        unsub();
        src.stop();
        expect(frames.length).toBeGreaterThan(0);
        // All frames should have midi ≈ 60.3
        for (const f of frames) {
          expect(f.midi).toBeCloseTo(60.3, 4);
          expect(f.clarity).toBe(1);
          expect(f.rms).toBe(0.1);
        }
        resolve();
      }, 200);
    });
  });

  it('emits null when behaviour returns null', () => {
    mockTime = 0;
    const frames: PitchFrame[] = [];
    const src = createSyntheticPitchSource(() => null);
    const unsub = src.subscribe((f) => frames.push(f));
    src.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        unsub();
        src.stop();
        expect(frames.length).toBeGreaterThan(0);
        for (const f of frames) {
          expect(f.midi).toBeNull();
        }
        resolve();
      }, 200);
    });
  });
});
