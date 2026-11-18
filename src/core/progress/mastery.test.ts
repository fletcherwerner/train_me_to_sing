import { describe, expect, it } from 'vitest';
import { addProof, isMastered, proofTonics } from './mastery';
import type { Proof } from './types';

const proof = (date: string, tonicMidi: number, score = 1): Proof => ({ date, tonicMidi, score });

describe('isMastered', () => {
  it('two proofs on the same day are not mastered', () => {
    expect(isMastered({ proofs: [proof('2026-11-20', 50), proof('2026-11-20', 52)] })).toBe(false);
  });
  it('two days in the same key are not mastered, unless only one key fits', () => {
    const proofs = [proof('2026-11-20', 50), proof('2026-11-21', 50)];
    expect(isMastered({ proofs })).toBe(false);
    expect(isMastered({ proofs }, true)).toBe(true);
  });
  it('two days in two keys is mastered', () => {
    expect(isMastered({ proofs: [proof('2026-11-20', 50), proof('2026-11-21', 52)] })).toBe(true);
  });
  it('a legacy -1 proof plus a new-key proof on a later day is mastered', () => {
    expect(isMastered({ proofs: [proof('2026-11-20', -1), proof('2026-11-21', 52)] })).toBe(true);
  });
  it('a legacy -1 proof plus a proof the same day is not mastered', () => {
    expect(isMastered({ proofs: [proof('2026-11-20', -1), proof('2026-11-20', 52)] })).toBe(false);
  });
  it('no proofs and one proof are not mastered', () => {
    expect(isMastered({ proofs: [] })).toBe(false);
    expect(isMastered({ proofs: [proof('2026-11-20', 50)] })).toBe(false);
    expect(isMastered({ proofs: [] }, true)).toBe(false);
  });
});

describe('proofs', () => {
  it('keeps the best score for the same day and key', () => {
    const a = addProof([proof('2026-11-20', 50, 0.8)], proof('2026-11-20', 50, 0.95));
    expect(a).toEqual([proof('2026-11-20', 50, 0.95)]);
    expect(addProof(a, proof('2026-11-20', 50, 0.7))).toEqual([proof('2026-11-20', 50, 0.95)]);
  });
  it('lists known keys to avoid, never -1', () => {
    expect(proofTonics({ proofs: [proof('a', -1), proof('b', 50), proof('c', 50), proof('d', 52)] })).toEqual([50, 52]);
    expect(proofTonics(undefined)).toEqual([]);
  });
});
