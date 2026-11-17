import { describe, expect, it } from 'vitest';
import {
  clampedMidiToY,
  graphPitchBounds,
  labelledMidis,
  midiToY,
  splitByBounds,
  sungSegments,
  targetSegments,
  timeToX,
} from './pitchGraph';
import type { ResolvedNote } from './types';

const note = (index: number, midi: number, startSec: number, durationSec = 1): ResolvedNote => ({
  index,
  midi,
  startSec,
  durationSec,
});

describe('graphPitchBounds', () => {
  it('is the lowest and highest target note plus 3 semitones, ignoring the wider range', () => {
    expect(graphPitchBounds({ lowMidi: 40, highMidi: 70 }, [note(0, 55, 0), note(1, 60, 1)])).toEqual({
      lowMidi: 52,
      highMidi: 63,
    });
  });
  it('covers notes outside the saved range', () => {
    expect(graphPitchBounds({ lowMidi: 48, highMidi: 60 }, [note(0, 44, 0), note(1, 65, 1)], 1)).toEqual({
      lowMidi: 43,
      highMidi: 66,
    });
  });
  it('falls back to the range when there are no notes', () => {
    expect(graphPitchBounds({ lowMidi: 48, highMidi: 60 }, [])).toEqual({ lowMidi: 45, highMidi: 63 });
  });
});

describe('mapping', () => {
  it('maps time: now line at 30%, 8 s window', () => {
    expect(timeToX(5, 5, 800)).toBe(240);
    expect(timeToX(5 + 5.6, 5, 800)).toBeCloseTo(800);
    expect(timeToX(5 - 2.4, 5, 800)).toBeCloseTo(0);
  });
  it('maps pitch: top is high, bottom is low, linear', () => {
    const b = { lowMidi: 40, highMidi: 60 };
    expect(midiToY(60, b, 200)).toBe(0);
    expect(midiToY(40, b, 200)).toBe(200);
    expect(midiToY(50, b, 200)).toBe(100);
    expect(midiToY(50.5, b, 200)).toBe(95);
  });
  it('pins out-of-range pitch to the edges', () => {
    const b = { lowMidi: 40, highMidi: 60 };
    expect(clampedMidiToY(70, b, 200)).toBe(0);
    expect(clampedMidiToY(10, b, 200)).toBe(200);
  });
});

describe('segments', () => {
  it('one target segment per note', () => {
    expect(targetSegments([note(0, 60, 1, 2)])).toEqual([{ startSec: 1, endSec: 3, midi: 60 }]);
  });
  it('splits sung frames on null and on time gaps', () => {
    const f = (tSec: number, midi: number | null) => ({ tSec, midi });
    const segs = sungSegments([f(0, 60), f(0.02, 60), f(0.04, null), f(0.06, 61), f(0.08, 61), f(0.5, 62), f(0.52, 62)]);
    expect(segs.map((s) => s.length)).toEqual([2, 2, 2]);
  });
  it('gives nothing for no frames or only silence', () => {
    expect(sungSegments([])).toEqual([]);
    expect(sungSegments([{ tSec: 0, midi: null }])).toEqual([]);
  });
});

describe('splitByBounds', () => {
  const bounds = { lowMidi: 50, highMidi: 60 };
  it('keeps a line that stays inside as one run', () => {
    expect(splitByBounds([{ tSec: 0, midi: 55 }, { tSec: 0.1, midi: 56 }], bounds)).toEqual([
      { inside: true, points: [{ tSec: 0, midi: 55 }, { tSec: 0.1, midi: 56 }] },
    ]);
  });
  it('splits where the voice leaves and re-enters the axis, joining the pieces', () => {
    const runs = splitByBounds(
      [
        { tSec: 0, midi: 55 },
        { tSec: 0.1, midi: 43 },
        { tSec: 0.2, midi: 43 },
        { tSec: 0.3, midi: 55 },
      ],
      bounds,
    );
    expect(runs.map((r) => r.inside)).toEqual([true, false, true]);
    expect(runs[1].points.map((p) => p.tSec)).toEqual([0, 0.1, 0.2]);
    expect(runs[2].points.map((p) => p.tSec)).toEqual([0.2, 0.3]);
  });
});

describe('labelledMidis', () => {
  it('labels every C and the range ends', () => {
    expect(labelledMidis({ lowMidi: 45, highMidi: 66 }, { lowMidi: 47, highMidi: 64 })).toEqual([47, 48, 60, 64]);
  });
  it('also labels the lowest and highest target notes', () => {
    expect(labelledMidis({ lowMidi: 50, highMidi: 59 }, { lowMidi: 40, highMidi: 70 }, [note(0, 53, 0), note(1, 56, 1)])).toEqual([
      53, 56,
    ]);
  });
});
