import { describe, expect, it } from 'vitest';
import { detectOnsets } from './onsets';
import { latencyFromErrors, matchOnsets, measureLatency } from './calibration';

const DT = 1 / 60;

/** rms frames at 60 fps: loud for 100 ms after each burst start, else quiet. */
function burstFrames(starts: number[], end: number, quiet = 0.01, loud = 0.2) {
  const frames: { tSec: number; rms: number }[] = [];
  for (let t = 0; t < end; t += DT) {
    frames.push({ tSec: t, rms: starts.some((s) => t >= s && t < s + 0.1) ? loud : quiet });
  }
  return frames;
}

describe('detectOnsets', () => {
  it('finds bursts at known times within one frame', () => {
    const starts = [1, 2, 3.5, 5];
    const onsets = detectOnsets(burstFrames(starts, 7), 0.05);
    expect(onsets).toHaveLength(4);
    onsets.forEach((o, i) => expect(Math.abs(o - starts[i])).toBeLessThanOrEqual(DT));
  });

  it('gives one onset for a continuous loud signal', () => {
    const frames = Array.from({ length: 300 }, (_, i) => ({ tSec: i * DT, rms: 0.3 }));
    expect(detectOnsets(frames, 0.05)).toHaveLength(1);
  });

  it('ignores a re-rise within 300 ms of the last loud frame', () => {
    expect(detectOnsets(burstFrames([1, 1.25], 3), 0.05)).toHaveLength(1);
  });
});

describe('latency maths', () => {
  it('errors [170,180,185,190,400] give median 185, stored as 190', () => {
    expect(latencyFromErrors([170, 180, 185, 190, 400])).toBe(190);
    expect(latencyFromErrors([170, 180, 185, 190, 20000])).toBe(190);
  });
  it('needs at least 5 matches', () => {
    expect(latencyFromErrors([100, 100, 100, 100])).toBeNull();
  });
  it('clamps to 0–500', () => {
    expect(latencyFromErrors([-50, -60, -70, -80, -90])).toBe(0);
    expect(latencyFromErrors([590, 590, 590, 590, 590])).toBe(500);
  });
  it('matches the nearest onset within ±600 ms only', () => {
    expect(matchOnsets([10, 11], [10.18, 12])).toEqual([expect.closeTo(180, 3)]);
  });
  it('measures a full simulated run with a 180 ms delay', () => {
    const t0 = 2;
    const clicks = Array.from({ length: 8 }, (_, i) => t0 + 4 + i);
    const allClicks = Array.from({ length: 12 }, (_, i) => t0 + i);
    const frames = burstFrames(
      allClicks.map((c) => c + 0.18),
      t0 + 14,
    );
    const r = measureLatency(frames, t0, clicks);
    expect(r).not.toBeNull();
    expect(Math.abs((r as number) - 180)).toBeLessThanOrEqual(20);
  });
  it('fails on silence', () => {
    const clicks = Array.from({ length: 8 }, (_, i) => 6 + i);
    expect(measureLatency(burstFrames([], 16), 2, clicks)).toBeNull();
  });
});
