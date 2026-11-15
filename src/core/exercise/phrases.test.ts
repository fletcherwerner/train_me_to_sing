import { describe, expect, it } from 'vitest';
import { fit } from './fit';
import { linesFromLengths, phraseFor, slicePhrase } from './phrases';
import { parseNotation } from './notation';

const template = {
  id: 't',
  title: 't',
  tempoBpm: 60,
  beatsPerBar: 4,
  notes: parseNotation('0 2 r 4:2 5 7:.5 9:.5'),
};

function resolved() {
  const f = fit(template, { lowMidi: 40, highMidi: 60 });
  if (!f.ok) throw new Error('fit');
  return f.exercise;
}

describe('slicePhrase', () => {
  it('rebases to 0, keeps pitches, totalSec equals phrase length', () => {
    const ex = resolved();
    const s = slicePhrase(ex, { startNote: 2, endNote: 3, label: 'x' });
    expect(s.notes[0].startSec).toBe(0);
    expect(s.notes.map((n) => n.midi)).toEqual(ex.notes.slice(2, 4).map((n) => n.midi));
    expect(s.notes.map((n) => n.index)).toEqual([0, 1]);
    expect(s.totalSec).toBe(3); // 2 beats + 1 beat at 60 bpm
    expect(s.tempoBpm).toBe(ex.tempoBpm);
  });
  it('keeps a rest inside the phrase but drops the leading one', () => {
    const ex = resolved();
    const s = slicePhrase(ex, { startNote: 1, endNote: 2, label: 'x' });
    expect(s.notes.map((n) => n.startSec)).toEqual([0, 2]);
  });
  it('phraseFor finds the containing phrase', () => {
    const ph = linesFromLengths([3, 3]);
    expect(ph.map((p) => p.label)).toEqual(['Line 1', 'Line 2']);
    expect(phraseFor(ph, 3)?.label).toBe('Line 2');
    expect(phraseFor(ph, 99)).toBeUndefined();
  });
});
