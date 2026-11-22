import { describe, expect, it } from 'vitest';
import { describeMatch, describeMatchMiss, matchTarget, placeTarget, scoreMatch, SLID_TIP, type MatchFrame } from './matchScoring';
import { qualifiesForEcho } from './bestTake';
import { getTolerance } from './tolerance';
import type { AttemptResult } from './types';

const t1 = getTolerance('t1'); // 50 cents
const STEP = 0.02;

/** Frames every 20 ms from `from` to `to`; `midi(t)` gives the pitch. */
const frames = (from: number, to: number, midi: (t: number) => number | null): MatchFrame[] => {
  const out: MatchFrame[] = [];
  for (let t = from; t < to - 1e-9; t += STEP) out.push({ tSec: Number(t.toFixed(3)), midi: midi(t) });
  return out;
};

describe('matchTarget', () => {
  it('matches after a continuous hold, reporting when the hold started', () => {
    const f = frames(0, 3, (t) => (t < 0.5 ? null : 60.1));
    const r = matchTarget(f, 60, t1, 1);
    expect(r.matched).toBe(true);
    expect(r.timeToMatchSec).toBeCloseTo(0.5, 2);
  });

  it('does not match a hold shorter than holdSec', () => {
    const f = frames(0, 3, (t) => (t >= 0.5 && t < 1.3 ? 60 : null));
    expect(matchTarget(f, 60, t1, 1).matched).toBe(false);
  });

  it('restarts the hold when the voice wobbles off the note', () => {
    // on 0-0.7, off 0.7-0.9, on again from 0.9: the second run reaches 1 s at 1.9 s.
    const f = frames(0, 4, (t) => (t >= 0.7 && t < 0.9 ? 62 : 60));
    const r = matchTarget(f, 60, t1, 1);
    expect(r.matched).toBe(true);
    expect(r.timeToMatchSec).toBeCloseTo(0.9, 2);
  });

  it('is not matched within 8 s if the hold never completes', () => {
    const f = frames(0, 12, (t) => (Math.floor(t / 0.6) % 2 === 0 ? 60 : 63)); // never 1 s on the note
    expect(matchTarget(f, 60, t1, 1)).toMatchObject({ matched: false, timeToMatchSec: null, reason: 'wrong-note' });
  });

  it('ignores a hold that only completes after the 8 s window', () => {
    const f = frames(0, 12, (t) => (t >= 7.5 ? 60 : null));
    expect(matchTarget(f, 60, t1, 1).matched).toBe(false);
  });

  it('reports silence, and the wrong octave', () => {
    expect(matchTarget(frames(0, 9, () => null), 60, t1, 1)).toEqual({ matched: false, timeToMatchSec: null, reason: 'silent' });
    expect(matchTarget(frames(0, 3, () => 48), 60, t1, 1).reason).toBe('wrong-octave');
  });

  it('lets a very short gap in the pitch through but not a long one', () => {
    const short = frames(0, 3, (t) => (t >= 0.5 && t < 0.56 ? null : 60));
    expect(matchTarget(short, 60, t1, 1).matched).toBe(true);
    const long = frames(0, 3, (t) => (t >= 0.5 && t < 0.9 ? null : 60));
    expect(matchTarget(long, 60, t1, 1).timeToMatchSec).toBeCloseTo(0.9, 2);
  });

  it('landWithinSec: sliding into the note is `slid`; starting on it matches', () => {
    // First sound at 0.2 s, 3 semitones low, sliding up and landing at 1.0 s.
    const slide = frames(0, 4, (t) => (t < 0.2 ? null : t < 1.0 ? 57 + ((t - 0.2) / 0.8) * 3 : 60));
    const slid = matchTarget(slide, 60, t1, 1, 0.4);
    expect(slid.matched).toBe(false);
    expect(slid.reason).toBe('slid');
    expect(describeMatchMiss(slid.reason)).toBe(SLID_TIP);
    expect(SLID_TIP).toBe('You found it by sliding. Try to start right on the note.');
    // Without the landing rule the same take matches.
    expect(matchTarget(slide, 60, t1, 1, null).matched).toBe(true);
    // Starting right on the note, 0.2 s after the piano stops, is fine.
    const clean = frames(0, 4, (t) => (t < 0.2 ? null : 60));
    expect(matchTarget(clean, 60, t1, 1, 0.4)).toMatchObject({ matched: true });
  });
});

describe('describeMatch', () => {
  const run = (f: MatchFrame[], hold = 1, land: number | null = null) => {
    const o = matchTarget(f, 60, t1, hold, land);
    return { o, d: describeMatch(f, 60, t1, o, 8) };
  };

  it('dead on: found at once, fully on the note, right on, accuracy 1', () => {
    const { o, d } = run(frames(0, 8, () => 60));
    expect(o.matched).toBe(true);
    expect(d.foundInSec).toBeCloseTo(0, 2);
    expect(d.onAfterFound).toBeCloseTo(1, 2);
    expect(d.typicalCents).toBeCloseTo(0, 5);
    expect(d.wrongOctave).toBe(false);
    expect(d.accuracy).toBeCloseTo(1, 5);
  });

  it('slightly flat: still matched, typical cents negative', () => {
    const { o, d } = run(frames(0, 8, () => 59.85));
    expect(o.matched).toBe(true);
    expect(d.typicalCents).toBeCloseTo(-15, 3);
    expect(d.accuracy).toBeCloseTo(85 / 90, 3); // 15 cents off is a little under perfect
  });

  it('found late: onAfterFound counts the frames from the find to the end', () => {
    // Silent to 1 s, 70 cents sharp to 3 s, on the note from 3 s; the last 2 s drift off again.
    const f = frames(0, 8, (t) => (t < 1 ? null : t < 3 ? 60.7 : t < 6 ? 60 : 60.7));
    const { o, d } = run(f);
    expect(o.matched).toBe(true);
    expect(d.foundInSec).toBeCloseTo(3, 1);
    expect(d.onAfterFound).toBeCloseTo(3 / 5, 1);
  });

  it('never found: no foundInSec or onAfterFound, but a typical sharpness', () => {
    const { o, d } = run(frames(0, 8, () => 60.7));
    expect(o.matched).toBe(false);
    expect(d.foundInSec).toBeNull();
    expect(d.onAfterFound).toBeNull();
    expect(d.typicalCents).toBeCloseTo(70, 3);
  });

  it('silent: nothing to report and accuracy 0', () => {
    const { o, d } = run(frames(0, 8, () => null));
    expect(o.reason).toBe('silent');
    expect(d).toEqual({ foundInSec: null, onAfterFound: null, typicalCents: null, wrongOctave: false, accuracy: 0 });
  });

  it('wrong octave: cents are folded to the nearest octave and the octave is flagged', () => {
    const { o, d } = run(frames(0, 8, () => 48.3)); // 30 cents sharp of the octave below
    expect(o.reason).toBe('wrong-octave');
    expect(d.wrongOctave).toBe(true);
    expect(d.typicalCents).toBeCloseTo(30, 3);
  });

  it('slid: not matched by the rule, but still described', () => {
    // Voice starts at 0 on the wrong note, lands on 60 at 2 s; landing within 0.4 s is required.
    const { o, d } = run(frames(0, 8, (t) => (t < 2 ? 62 : 60)), 1, 0.4);
    expect(o).toMatchObject({ matched: false, reason: 'slid' });
    expect(d.foundInSec).toBeNull();
    expect(d.typicalCents).toBeCloseTo(0, 3);
  });
});

describe('scoreMatch', () => {
  it('is matched / targets and passes at the pass mark', () => {
    const m = { matched: true, timeToMatchSec: 0 };
    const x = { matched: false, timeToMatchSec: null };
    expect(scoreMatch([m, m, m, m, x], 0.8)).toEqual({ matched: 4, total: 5, score: 0.8, passed: true, accuracy: 0 });
    expect(scoreMatch([m, x], 0.8, [1, 0.5]).accuracy).toBeCloseTo(0.75, 5);
    expect(scoreMatch([m, m, x, x, x, x], 0.8)).toMatchObject({ matched: 2, score: 2 / 6, passed: false });
    expect(scoreMatch([], 0.8)).toMatchObject({ score: 0, passed: false });
  });
});

describe('placeTarget', () => {
  const range = { lowMidi: 48, highMidi: 67 };
  const lo = () => 0; // -1
  const mid = () => 0.5; // 0
  const hi = () => 0.99; // +1
  it('puts low at range low + 2, mid in the middle, high at range high - 2', () => {
    expect(placeTarget({ placement: 'low' }, range, mid)).toBe(50);
    expect(placeTarget({ placement: 'mid' }, range, mid)).toBe(57); // floor((48 + 67) / 2)
    expect(placeTarget({ placement: 'high' }, range, mid)).toBe(65);
  });
  it('varies by one semitone either way and applies the offset', () => {
    expect(placeTarget({ placement: 'mid' }, range, lo)).toBe(56);
    expect(placeTarget({ placement: 'mid' }, range, hi)).toBe(58);
    expect(placeTarget({ placement: 'mid', offset: 2 }, range, mid)).toBe(59);
  });
  it('stays inside a small range', () => {
    const small = { lowMidi: 60, highMidi: 62 };
    for (const p of ['low', 'mid', 'high'] as const) {
      for (const r of [lo, mid, hi]) {
        const m = placeTarget({ placement: p }, small, r);
        expect(m).toBeGreaterThanOrEqual(60);
        expect(m).toBeLessThanOrEqual(62);
      }
    }
  });
});

describe('qualifiesForEcho', () => {
  const note = (hit: boolean, medianCents: number | null) => ({
    index: 0,
    targetMidi: 60,
    hit,
    medianCents,
    heldFraction: 1,
    onsetErrorMs: 0,
  });
  const result = (notes: ReturnType<typeof note>[]): AttemptResult => ({ notes, score: 1, passed: true });
  it('needs every note a hit with a median within 25 cents', () => {
    expect(qualifiesForEcho(result([note(true, 10), note(true, -25)]))).toBe(true);
    expect(qualifiesForEcho(result([note(true, 10), note(true, 30)]))).toBe(false);
    expect(qualifiesForEcho(result([note(true, 10), note(false, 5)]))).toBe(false);
    expect(qualifiesForEcho(result([]))).toBe(false);
  });
});
