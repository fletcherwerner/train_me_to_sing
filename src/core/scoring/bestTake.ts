import type { AttemptResult } from './types';

export const ECHO_MAX_MEDIAN_CENTS = 25;

/** A melody run worth echoing: every note a hit and every note's median within 25 cents. */
export function qualifiesForEcho(result: AttemptResult): boolean {
  return (
    result.notes.length > 0 &&
    result.notes.every((n) => n.hit && n.medianCents !== null && Math.abs(n.medianCents) <= ECHO_MAX_MEDIAN_CENTS)
  );
}
