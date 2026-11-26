import { describe, expect, it } from 'vitest';
import { smoothDisplay, smoothPitch } from './smoothing';

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

describe('smoothDisplay (the live display uses a 3-frame median)', () => {
  it('is the median of the last 3 frames', () => {
    expect(smoothDisplay([50, 50, 50, 60, 60.2, 60.1], 3)).toBeCloseTo(60.1);
    expect(smoothDisplay([60, 60, 72], 3)).toBe(60); // one outlier is rejected
  });

  it('follows a step in 2 frames where the 5-frame value needs 3', () => {
    const raw = [60, 60, 60, 63, 63];
    expect(smoothDisplay(raw, 3)).toBe(63);
    expect(smoothPitch(raw)).toBe(60);
  });

  it('needs 2 of 3 frames voiced', () => {
    expect(smoothDisplay([null, 60, null], 3)).toBeNull();
    expect(smoothDisplay([60, null, 60.2], 3)).not.toBeNull();
  });
});
