import { describe, expect, it } from 'vitest';
import { createNoteCatcher } from './noteCatcher';

const feed = (midis: (number | null)[], step = 0.05) => {
  const c = createNoteCatcher({ holdSec: 0.3 });
  const out: number[] = [];
  midis.forEach((m, i) => {
    const r = c.push({ tSec: i * step, midi: m });
    if (r) out.push(r.midi);
  });
  return out;
};

describe('createNoteCatcher', () => {
  it('catches a note held for the hold time, once', () => {
    expect(feed(Array(20).fill(60.2))).toEqual([60]);
  });

  it('ignores a note shorter than the hold time', () => {
    expect(feed([60, 60, 60, null, 62, 62])).toEqual([]);
  });

  it('catches each note of a held sequence', () => {
    expect(feed([...Array(8).fill(60), ...Array(8).fill(62), ...Array(8).fill(64)])).toEqual([60, 62, 64]);
  });

  it('catches the same note again after a gap', () => {
    expect(feed([...Array(8).fill(57), null, null, ...Array(8).fill(57)])).toEqual([57, 57]);
  });

  it('never catches silence', () => {
    expect(feed(Array(20).fill(null))).toEqual([]);
  });

  it('starts over after reset', () => {
    const c = createNoteCatcher({ holdSec: 0.3 });
    for (let i = 0; i < 4; i++) c.push({ tSec: i * 0.1, midi: 60 });
    c.reset();
    expect(c.push({ tSec: 0.5, midi: 60 })).toBeNull();
    expect(c.push({ tSec: 0.9, midi: 60 })).toEqual({ midi: 60, tSec: 0.9 });
  });
});
