import { describe, expect, it } from 'vitest';
import { createStallDetector } from './stallDetector';

describe('createStallDetector', () => {
  it('never stalls while the clock advances', () => {
    const d = createStallDetector(1000);
    for (let i = 0; i < 20; i++) expect(d.sample(i * 0.25, i * 250)).toBe(false);
  });
  it('stalls only after stallMs of a frozen clock', () => {
    const d = createStallDetector(1000);
    expect(d.sample(1, 0)).toBe(false);
    expect(d.sample(1, 500)).toBe(false);
    expect(d.sample(1, 999)).toBe(false);
    expect(d.sample(1, 1000)).toBe(true);
  });
  it('one late tick followed by progress does not stall', () => {
    const d = createStallDetector(1000);
    expect(d.sample(1, 0)).toBe(false);
    expect(d.sample(1, 600)).toBe(false);
    expect(d.sample(1.6, 850)).toBe(false);
    expect(d.sample(1.6, 1500)).toBe(false);
  });
});
