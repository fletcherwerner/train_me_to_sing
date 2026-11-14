import { describe, expect, it } from 'vitest';
import { smoothPitch } from './smoothing';

describe('smoothPitch', () => {
  it('returns median of 3+ non-null values', () => {
    expect(smoothPitch([60, null, 60.2, 60.1, null])).toBeCloseTo(60.1);
    expect(smoothPitch([60, 60.2, 60.1, 59.9, 60.3])).toBeCloseTo(60.1);
  });

  it('returns null when fewer than 3 non-null', () => {
    expect(smoothPitch([null, null, 60, null, null])).toBeNull();
    expect(smoothPitch([null, null, null, null, null])).toBeNull();
    expect(smoothPitch([60, null, null, null, null])).toBeNull();
    expect(smoothPitch([60, 60.2, null, null, null])).toBeNull();
  });

  it('handles all non-null', () => {
    expect(smoothPitch([60, 61, 62, 63, 64])).toBe(62);
  });

  it('handles all null', () => {
    expect(smoothPitch([null, null, null, null, null])).toBeNull();
  });
});
