import { describe, expect, it } from 'vitest';
import { evaluateAttempt, type ScoredFrame } from './evaluate';
import { getTolerance } from './tolerance';
import { pickTip, SCOOP_TIP } from './tips';
import { isScooped } from './onsets';
import { parseNotation } from '../exercise/notation';
import { fit } from '../exercise/fit';
import type { ResolvedExercise } from '../exercise/types';

const t1 = getTolerance('t1');

function make(notation: string): ResolvedExercise {
  const r = fit({ id: 't', title: 't', tempoBpm: 60, beatsPerBar: 4, notes: parseNotation(notation) }, { lowMidi: 48, highMidi: 72 });
  if (!r.ok) throw new Error('fit');
  return r.exercise;
}

/** Frames at 60 fps. `fn(note, into)` is the pitch `into` seconds after the note starts; null = silence. */
function sing(ex: ResolvedExercise, fn: (target: number, into: number, dur: number) => number | null): ScoredFrame[] {
  const out: ScoredFrame[] = [];
  const end = ex.totalSec + 0.5;
  for (let t = -1; t < end; t += 1 / 60) {
    const n = ex.notes.find((x) => t >= x.startSec && t < x.startSec + x.durationSec);
    out.push({ tSec: t, midi: n ? fn(n.midi, t - n.startSec, n.durationSec) : null });
  }
  return out;
}

/** Starts `from` semitones below, reaches the target after `rise` seconds, a breath at the end of each note. */
const scoop = (from: number, rise: number) => (target: number, into: number, dur: number) =>
  into > dur - 0.05 ? null : into < rise ? target - from + (from * into) / rise : target;

describe('scoop detection', () => {
  const ex = make('0:2 4:2 7:2');

  it('a clean start is not scooped', () => {
    const r = evaluateAttempt(ex, sing(ex, (m, _i, d) => (_i > d - 0.05 ? null : m)), t1, 0.8);
    expect(r.notes.every((n) => n.hit && !n.scooped)).toBe(true);
  });

  it('a slide of 1 semitone over 120 ms is flagged and the note still counts', () => {
    const r = evaluateAttempt(ex, sing(ex, scoop(1, 0.12)), t1, 0.8);
    expect(r.notes.every((n) => n.hit && n.scooped)).toBe(true);
    expect(r.passed).toBe(true);
  });

  it('with scoopIsMiss the scooped notes are misses with reason scooped', () => {
    const r = evaluateAttempt(ex, sing(ex, scoop(1, 0.12)), t1, 0.8, { scoopIsMiss: true });
    expect(r.notes.every((n) => !n.hit && n.reason === 'scooped')).toBe(true);
    expect(r.score).toBe(0);
  });

  it('a start 50 cents away is under the 70 cent threshold', () => {
    const r = evaluateAttempt(ex, sing(ex, scoop(0.5, 0.12)), t1, 0.8, { scoopIsMiss: true });
    expect(r.notes.every((n) => n.hit && !n.scooped)).toBe(true);
  });

  it('a start 90 cents away counts', () => {
    const r = evaluateAttempt(ex, sing(ex, scoop(0.9, 0.12)), t1, 0.8, { scoopIsMiss: true });
    expect(r.notes.every((n) => n.reason === 'scooped')).toBe(true);
  });

  it('the threshold is exactly 70 cents at the first frame', () => {
    const at = (cents: number) => {
      const f = [
        { tSec: 0, midi: 60 - cents / 100 },
        { tSec: 0.05, midi: 60 },
        { tSec: 0.1, midi: 60 },
      ];
      return isScooped(f, 0, 1, 60, 0.5);
    };
    expect(at(69)).toBe(false);
    expect(at(70)).toBe(true);
  });

  it('a slide from above counts too', () => {
    const r = evaluateAttempt(ex, sing(ex, scoop(-1, 0.12)), t1, 0.8);
    expect(r.notes.every((n) => n.scooped)).toBe(true);
  });

  it('settling after the 150 ms window is not a scoop', () => {
    const r = evaluateAttempt(ex, sing(ex, scoop(1, 0.4)), t1, 0.8, { scoopIsMiss: true });
    expect(r.notes.some((n) => n.reason === 'scooped')).toBe(false);
  });

  it('a voice that carries on from the previous note (a leap, no gap) is not a scoop', () => {
    const r = evaluateAttempt(ex, sing(ex, (m, i) => (i < 0.02 ? m - 4 : m)), t1, 0.8, { scoopIsMiss: true });
    // The first note starts from silence; the next two carry on from the note before.
    expect(r.notes.slice(1).some((n) => n.reason === 'scooped' || n.scooped)).toBe(false);
  });

  it('a note that is missed for another reason keeps that reason', () => {
    const r = evaluateAttempt(ex, sing(ex, (m) => m - 0.9), t1, 0.8, { scoopIsMiss: true });
    expect(r.notes.every((n) => n.reason === 'wrong-note')).toBe(true);
  });

  it('isScooped needs the settle inside the window', () => {
    const frames = [
      { tSec: 0, midi: 59 },
      { tSec: 0.05, midi: 59.6 },
      { tSec: 0.1, midi: 60 },
    ];
    expect(isScooped(frames, 0, 1, 60, 0.5)).toBe(true);
    // The same slide continuing from sound that was already there is a leap.
    const before = Array.from({ length: 15 }, (_, k) => ({ tSec: -0.32 + k * 0.02, midi: 59 }));
    expect(isScooped([...before, ...frames], 0, 1, 60, 0.5)).toBe(false);
  });

  it('a voice that starts a little before the note still counts as its start', () => {
    const frames = [
      { tSec: -0.03, midi: 59 },
      { tSec: 0.02, midi: 59.6 },
      { tSec: 0.07, midi: 60 },
    ];
    expect(isScooped(frames, 0, 1, 60, 0.5)).toBe(true);
    // ...but not one that started more than 100 ms early.
    expect(isScooped(frames.map((f) => ({ ...f, tSec: f.tSec - 0.2 })), 0, 1, 60, 0.5)).toBe(false);
  });
});

describe('scooped tips', () => {
  const ex = make('0:2 4:2');
  it('a pass with scooped notes gets the slide tip', () => {
    const r = evaluateAttempt(ex, sing(ex, scoop(1, 0.12)), t1, 0.8);
    expect(pickTip(r)).toBe(SCOOP_TIP);
    expect(SCOOP_TIP).toBe('You slid into this note. Try to start right on it.');
  });
  it('scooped misses give the slide tip', () => {
    const r = evaluateAttempt(ex, sing(ex, scoop(1, 0.12)), t1, 0.8, { scoopIsMiss: true });
    expect(pickTip(r)).toBe(SCOOP_TIP);
  });
});
