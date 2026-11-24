import { describe, expect, it } from 'vitest';
import { guideOffset, guideState, guideStateOffset, guideText } from './noteGuide';

const tol = 50;

describe('guideState', () => {
  it('silent', () => {
    expect(guideState(null, tol)).toEqual({ kind: 'silent' });
    expect(guideText({ kind: 'silent' })).toBe('Sing to see your dot');
  });
  it('on it at 0 and at ±tol', () => {
    for (const c of [0, 50, -50]) expect(guideState(c, tol).kind).toBe('on');
    expect(guideText(guideState(0, tol))).toBe('On it');
  });
  it('hysteresis: tol+3 stays on after being on, not otherwise', () => {
    expect(guideState(53, tol, true).kind).toBe('on');
    expect(guideState(53, tol, false).kind).toBe('near');
    expect(guideState(56, tol, true).kind).toBe('near');
  });
  it('near, low and high, with cents', () => {
    const low = guideState(-35 - 30, 20);
    expect(low).toEqual({ kind: 'near', direction: 'up', cents: -65 });
    expect(guideText(guideState(-35, 20))).toBe('A little low: go up (−35 cents)');
    expect(guideText(guideState(70, 20))).toBe('A little high: come down (+70 cents)');
  });
  it('far at 100, 300, 700 with semitone counts and wording', () => {
    expect(guideState(-100, tol)).toEqual({ kind: 'far', direction: 'up', semitones: 1 });
    expect(guideText(guideState(-100, tol))).toBe('About 1 note too low: go up');
    expect(guideText(guideState(300, tol))).toBe('About 3 notes too high: come down');
    expect(guideState(-700, tol)).toEqual({ kind: 'far', direction: 'up', semitones: 7 });
    expect(guideText(guideState(-200, tol))).toBe('About 2 notes too low: go up');
  });
  it('octave below and above at ±1200 and ±1200±tol', () => {
    expect(guideState(-1200, tol)).toEqual({ kind: 'octave', direction: 'up' });
    expect(guideState(1200, tol)).toEqual({ kind: 'octave', direction: 'down' });
    for (const c of [-1250, -1150, 1150, 1250]) expect(guideState(c, tol).kind).toBe('octave');
    expect(guideText(guideState(-1200, tol))).toBe('Right note, but an octave too low: try higher');
    expect(guideText(guideState(1200, tol))).toBe('Right note, but an octave too high: try lower');
  });
  it('1150 is an octave when tol is 50', () => {
    expect(guideState(-1150, 50).kind).toBe('octave');
  });
  it('1300 is far, not octave', () => {
    expect(guideState(1300, tol)).toEqual({ kind: 'far', direction: 'down', semitones: 13 });
  });
});

describe('guideOffset', () => {
  it('maps cents piecewise, keeping sign', () => {
    expect(guideOffset(0)).toBe(0);
    expect(guideOffset(50)).toBeCloseTo(0.225);
    expect(guideOffset(100)).toBeCloseTo(0.45);
    expect(guideOffset(400)).toBeCloseTo(0.7);
    expect(guideOffset(700)).toBeCloseTo(0.95);
    expect(guideOffset(1500)).toBe(0.95);
    expect(guideOffset(-50)).toBeCloseTo(-0.225);
    expect(guideOffset(-1500)).toBe(-0.95);
  });
  it('octave sits at the edge on the octave side', () => {
    const s = guideState(-1200, tol);
    expect(guideStateOffset(s, -1200)).toBe(-0.95);
    expect(guideStateOffset(guideState(1200, tol), 1200)).toBe(0.95);
    expect(guideStateOffset({ kind: 'silent' }, null)).toBeNull();
  });
});
