import { describe, expect, it } from 'vitest';
import { describeCents, describeMatchLine } from './describeReason';
import type { MatchDescription } from '../core/scoring/matchScoring';

const d = (over: Partial<MatchDescription>): MatchDescription => ({
  foundInSec: null,
  onAfterFound: null,
  typicalCents: null,
  wrongOctave: false,
  accuracy: 0,
  ...over,
});

describe('describeCents', () => {
  it('uses the bands from S09', () => {
    expect(describeCents(5)).toBe('right on');
    expect(describeCents(-15)).toBe('a little flat');
    expect(describeCents(40)).toBe('sharp');
    expect(describeCents(-70)).toBe('far flat');
    expect(describeCents(100)).toBe('about a semitone sharp');
  });
});

describe('describeMatchLine', () => {
  it('matched', () => {
    expect(
      describeMatchLine(
        { matched: true, timeToMatchSec: 1.2 },
        d({ foundInSec: 1.2, onAfterFound: 0.85, typicalCents: -15 }),
      ),
    ).toBe('✓ Found in 1.2 s · on the note 85% after that · a little flat (−15 cents)');
  });
  it('not matched, wrong note', () => {
    expect(
      describeMatchLine({ matched: false, timeToMatchSec: null, reason: 'wrong-note' }, d({ typicalCents: 100 })),
    ).toBe('✗ Not found · mostly about a semitone sharp (+100 cents)');
  });
  it('not matched, silent', () => {
    expect(describeMatchLine({ matched: false, timeToMatchSec: null, reason: 'silent' }, d({}))).toBe(
      '✗ Not found · We did not hear you sing.',
    );
  });
});
