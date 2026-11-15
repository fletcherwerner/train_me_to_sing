import { describe, expect, it } from 'vitest';
import { pickTip } from './tips';
import type { AttemptResult, MissReason, NoteResult } from './types';

const n = (i: number, reason?: MissReason, medianCents: number | null = 0): NoteResult => ({
  index: i,
  targetMidi: 60,
  hit: !reason,
  reason,
  medianCents,
  heldFraction: 1,
  onsetErrorMs: 0,
});
const res = (notes: NoteResult[]): AttemptResult => ({ notes, score: 0, passed: false });

describe('pickTip', () => {
  it('octave', () => {
    expect(pickTip(res([n(0, 'wrong-octave'), n(1, 'wrong-octave'), n(2)]))).toContain('different octave');
  });
  it('flat vs sharp', () => {
    expect(pickTip(res([n(0, 'wrong-note', -60), n(1, 'wrong-note', -70)]))).toContain('flat');
    expect(pickTip(res([n(0, 'wrong-note', 60)]))).toContain('sharp');
  });
  it('most common wins', () => {
    expect(pickTip(res([n(0, 'wavered'), n(1, 'wavered'), n(2, 'silent')]))).toContain('steady');
  });
  it('early and late share a tip', () => {
    expect(pickTip(res([n(0, 'early'), n(1, 'late')]))).toContain('on the click');
  });
  it('silent', () => {
    expect(pickTip(res([n(0, 'silent')]))).toContain("couldn't hear you");
  });
});
