import { describe, expect, it } from 'vitest';
import { parseNotation } from './notation';
import { displayRange, fit } from './fit';
import { buildTimeline } from './timeline';
import type { ExerciseTemplate, ResolvedExercise } from './types';

const tpl = (notation: string, tempoBpm = 60, beatsPerBar = 4): ExerciseTemplate => ({
  id: 't',
  title: 't',
  tempoBpm,
  beatsPerBar,
  notes: parseNotation(notation),
});

describe('parseNotation', () => {
  it('parses rests and durations', () => {
    const notes = parseNotation('0 2 4:2 r 4');
    expect(notes.map((n) => n.startBeat)).toEqual([0, 1, 2, 5]);
    expect(notes).toHaveLength(4);
    expect(notes[2].durationBeats).toBe(2);
  });
  it('accepts negative offsets and fractional beats', () => {
    const notes = parseNotation('-3:.5 2:1.5');
    expect(notes[0]).toMatchObject({ offset: -3, durationBeats: 0.5 });
    expect(notes[1]).toMatchObject({ startBeat: 0.5, durationBeats: 1.5 });
  });
  it('rejects bad tokens', () => {
    expect(() => parseNotation('x')).toThrow(/Invalid token "x"/);
    expect(() => parseNotation('0:0')).toThrow(/greater than 0/);
    expect(() => parseNotation('1.5')).toThrow();
    expect(() => parseNotation('0:-1')).toThrow();
  });
  it('assigns lyrics and checks the count', () => {
    expect(parseNotation('0 r 2', ['a', 'b'])[1].lyric).toBe('b');
    expect(() => parseNotation('0 2', ['a'])).toThrow(/Lyric count/);
  });
});

describe('fit', () => {
  it('centres offsets 0-4 in range 45-64', () => {
    const r = fit(tpl('0 2 4'), { lowMidi: 45, highMidi: 64 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.exercise.tonicMidi).toBe(52);
      expect(r.exercise.notes[0].midi).toBe(52);
    }
  });
  it('handles negative offsets', () => {
    const r = fit(tpl('-5 0 9'), { lowMidi: 40, highMidi: 60 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const lowest = Math.min(...r.exercise.notes.map((n) => n.midi));
      expect(r.exercise.tonicMidi).toBe(lowest + 5);
    }
  });
  it('fails when the range is too small', () => {
    const r = fit(tpl('0 12'), { lowMidi: 50, highMidi: 60 });
    expect(r).toEqual({ ok: false, reason: 'range-too-small', neededSemitones: 12, haveSemitones: 10 });
  });
  it('computes timing', () => {
    const r = fit(tpl('0 2 4'), { lowMidi: 45, highMidi: 64 });
    if (!r.ok) throw new Error('fit failed');
    expect(r.exercise.notes[2].startSec).toBe(2);
    expect(r.exercise.notes[2].durationSec).toBe(1);
    expect(r.exercise.totalSec).toBe(3);
  });
  it('keeps every note inside random ranges', () => {
    const templates = [
      tpl('0 2 4'),
      tpl('0 2 4 5 7 5 4 2 0:2'),
      tpl('4 2 0:2 4 2 0:2 0:.5 0:.5 2:.5 2:.5 4 2 0:2'),
      tpl('-5 0 9 r 3'),
    ];
    let seed = 12345;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    for (let i = 0; i < 500; i++) {
      const low = 30 + rand(40);
      const range = { lowMidi: low, highMidi: low + rand(30) };
      for (const t of templates) {
        const r = fit(t, range);
        if (!r.ok) continue;
        for (const n of r.exercise.notes) {
          expect(n.midi).toBeGreaterThanOrEqual(range.lowMidi);
          expect(n.midi).toBeLessThanOrEqual(range.highMidi);
        }
      }
    }
  });
});

describe('displayRange', () => {
  it('extends to C below and B above', () => {
    expect(displayRange({ lowMidi: 45, highMidi: 64 })).toEqual({ lowMidi: 36,highMidi: 71 });
    expect(displayRange({ lowMidi: 60, highMidi: 71 })).toEqual({ lowMidi: 60, highMidi: 71 });
  });
});

describe('buildTimeline', () => {
  const ex = (tempoBpm: number, beatsPerBar: number): ResolvedExercise => {
    const r = fit(tpl('0 2 4', tempoBpm, beatsPerBar), { lowMidi: 45, highMidi: 64 });
    if (!r.ok) throw new Error('fit failed');
    return r.exercise;
  };
  it('has 4 clicks 1 s apart at 60 bpm and starts one beat after the last', () => {
    const tl = buildTimeline(ex(60, 4), { playStartNote: false, metronome: false }, 10);
    expect(tl.leadInClicks.map((c) => c.tSec)).toEqual([10, 11, 12, 13]);
    expect(tl.leadInClicks.map((c) => c.accent)).toEqual([true, false, false, false]);
    expect(tl.startSec).toBe(14);
    expect(tl.endSec).toBe(17);
    expect(tl.exerciseClicks).toHaveLength(0);
  });
  it('spaces clicks 0.5 s apart at 120 bpm', () => {
    const tl = buildTimeline(ex(120, 4), { playStartNote: false, metronome: false }, 0);
    expect(tl.leadInClicks.map((c) => c.tSec)).toEqual([0, 0.5, 1, 1.5]);
    expect(tl.startSec).toBe(2);
  });
  it('still gives 4 clicks in 3/4 and accents bars during the exercise', () => {
    const tl = buildTimeline(ex(60, 3), { playStartNote: false, metronome: true }, 0);
    expect(tl.leadInClicks).toHaveLength(4);
    expect(tl.exerciseClicks.map((c) => c.accent)).toEqual([true, false, false]);
  });
  it('puts the start note and a beat of silence before the lead-in', () => {
    const tl = buildTimeline(ex(60, 4), { playStartNote: true, metronome: false }, 5);
    expect(tl.startNoteSec).toBe(5);
    expect(tl.leadInClicks[0].tSec).toBe(7);
    expect(tl.startSec).toBe(11);
  });
  it('plays the whole pattern, a beat of silence, then the lead-in; startSec stays the student beat 0', () => {
    const e = ex(60, 4); // three one-beat notes: 3 s
    const tl = buildTimeline(e, { playStartNote: true, playCall: true, metronome: false }, 5);
    expect(tl.callStartSec).toBe(5);
    expect(tl.callEndSec).toBe(5 + e.totalSec + 1);
    expect(tl.startNoteSec).toBeNull();
    expect(tl.leadInClicks.map((c) => c.tSec)).toEqual([9, 10, 11, 12]);
    expect(tl.startSec).toBe(13);
    expect(tl.endSec).toBe(13 + e.totalSec);
    const none = buildTimeline(e, { playStartNote: false, metronome: false }, 5);
    expect(none.callStartSec).toBeNull();
    expect(none.callEndSec).toBeNull();
  });
});
