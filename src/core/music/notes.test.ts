import { describe, expect, it } from 'vitest';
import { centsBetween, freqToMidi, isBlackKey, midiToFreq, midiToName, nameToMidi } from './notes';

describe('notes', () => {
  it('maps 69 and 440 Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 9);
    expect(freqToMidi(440)).toBeCloseTo(69, 9);
  });
  it('names notes', () => {
    expect(midiToName(60)).toBe('C4');
    expect(midiToName(61)).toBe('C#4');
    expect(midiToName(60.4)).toBe('C4');
    expect(midiToName(11)).toBe('B-1');
  });
  it('parses names and throws on invalid', () => {
    expect(nameToMidi('C4')).toBe(60);
    expect(nameToMidi('C#4')).toBe(61);
    expect(() => nameToMidi('H4')).toThrow();
    expect(() => nameToMidi('E#4')).toThrow();
    expect(() => nameToMidi('')).toThrow();
  });
  it('round trips freq and midi', () => {
    for (let m = 36; m <= 84; m++) expect(freqToMidi(midiToFreq(m))).toBeCloseTo(m, 9);
    for (let m = 36; m <= 84; m++) expect(nameToMidi(midiToName(m))).toBe(m);
  });
  it('computes cents', () => {
    expect(centsBetween(60.3, 60)).toBeCloseTo(30, 9);
  });
  it('identifies black keys', () => {
    expect([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71].map(isBlackKey)).toEqual([
      false, true, false, true, false, false, true, false, true, false, true, false,
    ]);
  });
});
