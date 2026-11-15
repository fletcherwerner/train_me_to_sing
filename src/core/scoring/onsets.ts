/** Structural frame type so core does not import from audio. PitchFrame satisfies it. */
export interface RmsFrame {
  tSec: number;
  rms: number;
}

/** Quiet time required before a rise counts as a new onset. */
export const ONSET_QUIET_SEC = 0.3;

/**
 * Times of onsets: frames where `rms` rises above `thresholdRms` after at least
 * 300 ms with no frame above it. A signal that stays loud gives one onset.
 */
export function detectOnsets(frames: RmsFrame[], thresholdRms: number): number[] {
  const sorted = [...frames].sort((a, b) => a.tSec - b.tSec);
  const onsets: number[] = [];
  let lastLoud = -Infinity;
  for (const f of sorted) {
    if (f.rms > thresholdRms) {
      if (f.tSec - lastLoud >= ONSET_QUIET_SEC) onsets.push(f.tSec);
      lastLoud = f.tSec;
    }
  }
  return onsets;
}
