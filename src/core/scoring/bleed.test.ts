import { describe, expect, it } from 'vitest';
import type { ResolvedNote } from '../exercise/types';
import { applyGate, bleedGate, measureBleed, MIN_RMS } from './bleed';

const notes: ResolvedNote[] = [
  { index: 0, midi: 60, startSec: 0, durationSec: 1 },
  { index: 1, midi: 62, startSec: 2, durationSec: 1 },
];
const fr = (tSec: number, rms: number) => ({ tSec, midi: 60 as number | null, clarity: 1, rms });

describe('measureBleed', () => {
  it('skips attacks and frames outside notes', () => {
    const frames = [];
    for (let i = 0; i < 20; i++) frames.push(fr(0.5 + i * 0.02, 0.02)); // inside note 0, past attack
    frames.push(fr(0.05, 0.9), fr(2.05, 0.9)); // attacks
    frames.push(fr(1.5, 0.9), fr(-1, 0.9), fr(3.5, 0.9)); // outside
    expect(measureBleed(frames, notes)).toBeCloseTo(0.02);
  });
  it('returns the 75th percentile', () => {
    const frames = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((v, i) => fr(0.2 + i * 0.05, v / 100));
    // sorted index 0.75 * 10 = 7.5 -> between 0.08 and 0.09
    expect(measureBleed(frames, notes)).toBeCloseTo(0.085);
  });
  it('returns null with fewer than 10 qualifying frames', () => {
    const frames = [];
    for (let i = 0; i < 9; i++) frames.push(fr(0.5 + i * 0.02, 0.02));
    expect(measureBleed(frames, notes)).toBeNull();
  });
});

describe('bleedGate', () => {
  it('floors at MIN_RMS', () => {
    expect(bleedGate(null)).toBe(MIN_RMS);
    expect(bleedGate(0.001)).toBe(MIN_RMS);
    expect(bleedGate(0)).toBe(MIN_RMS);
  });
  it('scales by 2.5', () => {
    expect(bleedGate(0.012)).toBeCloseTo(0.03);
  });
  it('caps at 0.05', () => {
    expect(bleedGate(0.1)).toBe(0.05);
    expect(bleedGate(0.02)).toBe(0.05);
  });
});

describe('applyGate', () => {
  it('nulls only quiet frames inside notes', () => {
    const frames = [fr(0.5, 0.02), fr(0.6, 0.1), fr(1.5, 0.001), fr(2.5, 0.02)];
    const out = applyGate(frames, notes, 0.05);
    expect(out.map((f) => f.midi)).toEqual([null, 60, 60, null]);
    expect(frames[0].midi).toBe(60);
  });
});
