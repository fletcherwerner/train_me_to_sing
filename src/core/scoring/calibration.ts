import { detectOnsets, type RmsFrame } from './onsets';

export const MATCH_WINDOW_SEC = 0.6;
export const MIN_MATCHED = 5;
export const MAX_LATENCY_MS = 500;
export const THRESHOLD_FACTOR = 3;
/** Floor so a dead-silent count-in does not make the threshold zero. */
export const MIN_THRESHOLD = 0.005;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** 3 × the median rms of the count-in frames. */
export function calibrationThreshold(countInFrames: RmsFrame[]): number {
  if (countInFrames.length === 0) return MIN_THRESHOLD;
  return Math.max(MIN_THRESHOLD, THRESHOLD_FACTOR * median(countInFrames.map((f) => f.rms)));
}

/** For each click, the nearest onset within ±600 ms, as `onset − click` in ms. Unmatched clicks are skipped. */
export function matchOnsets(clickTimes: number[], onsets: number[]): number[] {
  const errors: number[] = [];
  for (const c of clickTimes) {
    let best: number | null = null;
    for (const o of onsets) {
      if (Math.abs(o - c) <= MATCH_WINDOW_SEC && (best === null || Math.abs(o - c) < Math.abs(best - c))) best = o;
    }
    if (best !== null) errors.push((best - c) * 1000);
  }
  return errors;
}

/** Median error rounded (half up) to 10 ms and clamped to 0–500; null with fewer than 5 matches. */
export function latencyFromErrors(errorsMs: number[]): number | null {
  if (errorsMs.length < MIN_MATCHED) return null;
  const rounded = Math.round(median(errorsMs) / 10) * 10;
  return Math.min(MAX_LATENCY_MS, Math.max(0, rounded));
}

/** Whole calibration analysis. `frames` cover the count-in and the measured clicks. */
export function measureLatency(
  frames: RmsFrame[],
  countInStartSec: number,
  measuredClickTimes: number[],
): number | null {
  const firstMeasured = measuredClickTimes[0];
  const countIn = frames.filter((f) => f.tSec >= countInStartSec && f.tSec < firstMeasured);
  const onsets = detectOnsets(
    frames.filter((f) => f.tSec >= countInStartSec),
    calibrationThreshold(countIn),
  );
  return latencyFromErrors(matchOnsets(measuredClickTimes, onsets));
}
