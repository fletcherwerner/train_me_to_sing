import { describe, expect, it } from 'vitest';
import { summariseTrack, toTemplate, type RawMidiTrack } from './fromMidi';

const o = { id: 'x', title: 'X', tempoBpm: 100, beatsPerBar: 4 };
const n = (midi: number, startBeat: number, durationBeats = 1) => ({ midi, startBeat, durationBeats });
const t = (notes: ReturnType<typeof n>[]): RawMidiTrack => ({ name: 't', notes });

describe('toTemplate', () => {
  it('keeps the top note of a chord', () => {
    const r = toTemplate(t([n(60, 0), n(64, 0), n(67, 0.01), n(62, 1), n(60, 2)]), o);
    expect(r.notes.map((x) => x.offset)).toEqual([7, 2, 0]);
  });
  it('trims overlapping notes', () => {
    const r = toTemplate(t([n(60, 0, 3), n(62, 1, 3), n(64, 2, 1)]), o);
    expect(r.notes.map((x) => x.durationBeats)).toEqual([1, 1, 1]);
  });
  it('quantises to sixteenths', () => {
    const r = toTemplate(t([n(60, 0), n(62, 1.02, 0.97), n(64, 2.1, 1)]), o);
    expect(r.notes.map((x) => x.startBeat)).toEqual([0, 1, 2]);
    expect(r.notes[1].durationBeats).toBe(1);
  });
  it('drops notes that quantise to zero length', () => {
    const r = toTemplate(t([n(60, 0), n(62, 1, 0.05), n(64, 2), n(65, 3)]), o);
    expect(r.notes).toHaveLength(3);
  });
  it('offsets are relative to the lowest note and start at beat 0', () => {
    const r = toTemplate(t([n(67, 4), n(60, 5), n(64, 6)]), o);
    expect(r.notes.map((x) => x.offset)).toEqual([7, 0, 4]);
    expect(r.notes[0].startBeat).toBe(0);
    expect(r.notes[2].startBeat).toBe(2);
  });
  it('respects [startBeat, endBeat)', () => {
    const notes = [0, 1, 2, 3, 4, 5].map((i) => n(60 + i, i));
    const r = toTemplate(t(notes), { ...o, startBeat: 1, endBeat: 4 });
    expect(r.notes.map((x) => x.offset)).toEqual([0, 1, 2]);
  });
  it('throws with fewer than 3 notes or more than 400', () => {
    expect(() => toTemplate(t([n(60, 0), n(62, 1)]), o)).toThrow();
    expect(() => toTemplate(t(Array.from({ length: 401 }, (_, i) => n(60, i))), o)).toThrow();
  });
});

describe('summariseTrack', () => {
  it('reports range and overlap', () => {
    const s = summariseTrack(t([n(60, 0), n(64, 0), n(67, 0), n(72, 2)]));
    expect(s).toMatchObject({ noteCount: 4, lowMidi: 60, highMidi: 72 });
    expect(s.overlapRatio).toBe(0.75);
    expect(summariseTrack(t([n(60, 0), n(62, 1)])).overlapRatio).toBe(0);
  });
});
