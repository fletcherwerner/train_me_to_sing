import { expect, it } from 'vitest';
import { rescueThresholdSec } from './rescue';

it('is 1 s for long notes, 60% for short ones, never under 0.5 s', () => {
  expect(rescueThresholdSec(4)).toBe(1);
  expect(rescueThresholdSec(1.5)).toBeCloseTo(0.9);
  expect(rescueThresholdSec(0.5)).toBe(0.5);
});
