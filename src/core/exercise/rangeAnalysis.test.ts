import { describe, expect, it } from 'vitest';
import { findHeldNote } from './rangeAnalysis';

interface TestFrame {
  midi: number | null;
  tSec: number;
}

function makeFrames(midiValues: (number | null)[], startSec = 0): TestFrame[] {
  return midiValues.map((midi, i) => ({
    tSec: startSec + i * 0.05,
    midi,
  }));
}

describe('findHeldNote', () => {
  it('returns the nearest integer for a steady pitch', () => {
    // 45.1 for 3 seconds (60 frames at 0.05s each)
    const frames = makeFrames(Array(60).fill(45.1));
    const result = findHeldNote(frames, 'lowest');
    expect(result).toEqual({ ok: true, midi: 45 });
  });

  it('returns lowest median when first note wobbles then steadies', () => {
    // First second at 47 (20 frames), then 2 seconds at 45 (40 frames)
    const frames = [
      ...makeFrames(Array(20).fill(47), 0),
      ...makeFrames(Array(40).fill(45), 1),
    ];
    const lowest = findHeldNote(frames, 'lowest');
    expect(lowest).toEqual({ ok: true, midi: 45 });

    const highest = findHeldNote(frames, 'highest');
    expect(highest).toEqual({ ok: true, midi: 47 });
  });

  it('returns no-voice when all frames are null', () => {
    const frames = makeFrames(Array(60).fill(null));
    const result = findHeldNote(frames, 'lowest');
    expect(result).toEqual({ ok: false, reason: 'no-voice' });
  });

  it('returns unstable for a continuous glide of 3 semitones per second', () => {
    // 3 semitones/sec = 0.15 semitones per 0.05s frame
    // Over 3 seconds, the pitch changes by 9 semitones total
    const frames: TestFrame[] = [];
    for (let i = 0; i < 120; i++) {
      const t = i * 0.05; // 0 to ~6 seconds
      const midi = 60 + (t * 3); // 3 semitones per second
      frames.push({
        tSec: t,
        midi,
      });
    }
    const result = findHeldNote(frames, 'lowest');
    expect(result).toEqual({ ok: false, reason: 'unstable' });
  });

  it('returns no-voice when fewer than 30% of frames have pitch', () => {
    // 60 frames, only 10 have pitch (16.7%)
    const frames = makeFrames([
      ...Array(50).fill(null),
      ...Array(10).fill(60),
    ]);
    const result = findHeldNote(frames, 'lowest');
    expect(result).toEqual({ ok: false, reason: 'no-voice' });
  });

  it('returns no-voice when exactly 30% have pitch (boundary)', () => {
    // 100 frames, 30 have pitch (exactly 30%)
    const frames = makeFrames([
      ...Array(70).fill(null),
      ...Array(30).fill(60),
    ]);
    const result = findHeldNote(frames, 'lowest');
    // 30/100 = 0.30, which is NOT less than 0.30, so it passes step 1
    // Then it finds a stable segment of 30 frames at 60, which is ≥ 0.5s
    expect(result).toEqual({ ok: true, midi: 60 });
  });

  it('returns no-voice when 29% have pitch', () => {
    // 100 frames, 29 have pitch (29%)
    const frames = makeFrames([
      ...Array(71).fill(null),
      ...Array(29).fill(60),
    ]);
    const result = findHeldNote(frames, 'lowest');
    expect(result).toEqual({ ok: false, reason: 'no-voice' });
  });

  it('handles a single stable segment', () => {
    const frames = makeFrames(Array(40).fill(72));
    const result = findHeldNote(frames, 'lowest');
    expect(result).toEqual({ ok: true, midi: 72 });
  });

  it('picks highest when there are multiple stable segments', () => {
    // Segment 1: 60 for 2 seconds, Segment 2: 72 for 2 seconds
    const frames = [
      ...makeFrames(Array(40).fill(60), 0),
      ...makeFrames(Array(40).fill(72), 2),
    ];
    const lowest = findHeldNote(frames, 'lowest');
    expect(lowest).toEqual({ ok: true, midi: 60 });

    const highest = findHeldNote(frames, 'highest');
    expect(highest).toEqual({ ok: true, midi: 72 });
  });

  it('returns no-voice for an empty frame list', () => {
    expect(findHeldNote([], 'lowest')).toEqual({ ok: false, reason: 'no-voice' });
  });

  it('ignores segments shorter than 0.5 seconds', () => {
    // Short segment at 80 (8 frames = 0.4s), then stable at 60 (40 frames = 2s)
    const frames = [
      ...makeFrames(Array(8).fill(80), 0),
      ...makeFrames(Array(40).fill(60), 0.4),
    ];
    const result = findHeldNote(frames, 'lowest');
    expect(result).toEqual({ ok: true, midi: 60 });
  });
});
