import type { PitchFrame, PitchSource } from './PitchSource';

/**
 * Records frames around an exercise, rewriting tSec so 0 = exercise beat 0.
 * `frames` is filled live; read it after the exercise ends.
 */
export function recordFrames(
  source: PitchSource,
  startSec: number,
  endSec: number,
  latencyOffsetSec: number,
): { frames: PitchFrame[]; stop(): void } {
  const frames: PitchFrame[] = [];
  const unsub = source.subscribe((f) => {
    if (f.tSec < startSec - 1 || f.tSec > endSec + 0.5) return;
    frames.push({ ...f, tSec: f.tSec - startSec - latencyOffsetSec });
  });
  return { frames, stop: unsub };
}
