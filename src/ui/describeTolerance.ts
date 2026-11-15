import type { ToleranceProfile } from '../core/scoring/types';

/** Plain-words tolerance line shown on the lesson intro. */
export function describeTolerance(t: ToleranceProfile): string {
  return `Pitch: within ${t.cents} cents · Hold: ${Math.round(t.holdFraction * 100)}% of each note · Timing: within ${t.timingMs / 1000} s`;
}
