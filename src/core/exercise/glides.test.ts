import { describe, expect, it } from 'vitest';
import { fit, pickTonic, tonicCount } from './fit';
import { warmupGlides } from './glides';
import { targetSegments, graphPitchBounds } from './pitchGraph';

const range = { lowMidi: 45, highMidi: 69 };

describe('warm-up glides', () => {
  it('are three glides of 4, 4 and 6 seconds inside the range', () => {
    const glides = warmupGlides(range);
    expect(glides).toHaveLength(3);
    const lengths = glides.map((g) => {
      const r = fit(g.template, range, { tonicMidi: range.lowMidi });
      if (!r.ok) throw new Error('fit');
      for (const n of r.exercise.notes) {
        expect(n.midi).toBeGreaterThanOrEqual(range.lowMidi);
        expect(n.midi).toBeLessThanOrEqual(range.highMidi);
        expect(n.glideToMidi).toBeGreaterThanOrEqual(range.lowMidi);
        expect(n.glideToMidi).toBeLessThanOrEqual(range.highMidi);
      }
      return r.exercise.totalSec;
    });
    expect(lengths).toEqual([4, 4, 6]);
  });

  it('the siren goes low to high and back', () => {
    const r = fit(warmupGlides(range)[2].template, range, { tonicMidi: range.lowMidi });
    if (!r.ok) throw new Error('fit');
    expect(r.exercise.notes.map((n) => [n.midi, n.glideToMidi])).toEqual([
      [45, 69],
      [69, 45],
    ]);
  });

  it('draw as sloped target lines and widen the graph axis to both ends', () => {
    const r = fit(warmupGlides(range)[0].template, range, { tonicMidi: range.lowMidi });
    if (!r.ok) throw new Error('fit');
    const segs = targetSegments(r.exercise.notes);
    expect(segs[0].endMidi).toBeGreaterThan(segs[0].midi);
    expect(segs[1].endMidi).toBeLessThan(segs[1].midi);
    const b = graphPitchBounds(range, r.exercise.notes);
    expect(b.lowMidi).toBeLessThan(45);
    expect(b.highMidi).toBeGreaterThan(45 + 12 - 1);
  });
});

describe('fit with glides and keys', () => {
  it('counts glide ends in the span', () => {
    const tpl = { id: 'g', title: 'g', tempoBpm: 60, beatsPerBar: 4, notes: [{ offset: 0, glideToOffset: 30, startBeat: 0, durationBeats: 2 }] };
    expect(fit(tpl, range).ok).toBe(false);
  });
  it('tonicCount says how many keys fit', () => {
    const tpl = { id: 'g', title: 'g', tempoBpm: 60, beatsPerBar: 4, notes: [{ offset: 0, startBeat: 0, durationBeats: 1 }, { offset: 4, startBeat: 1, durationBeats: 1 }] };
    expect(tonicCount(tpl, { lowMidi: 50, highMidi: 54 })).toBe(1);
    expect(tonicCount(tpl, { lowMidi: 50, highMidi: 56 })).toBe(3);
    expect(tonicCount(tpl, { lowMidi: 50, highMidi: 52 })).toBe(0);
  });
  it('pickTonic avoids every given key, and falls back when none are left', () => {
    const tpl = { id: 'g', title: 'g', tempoBpm: 60, beatsPerBar: 4, notes: [{ offset: 0, startBeat: 0, durationBeats: 1 }] };
    const r = { lowMidi: 50, highMidi: 52 };
    for (let i = 0; i < 20; i++) expect(pickTonic(tpl, r, () => i / 20, [50, 51])).toBe(52);
    expect(pickTonic(tpl, r, () => 0, [50, 51, 52])).toBe(50);
  });
});
