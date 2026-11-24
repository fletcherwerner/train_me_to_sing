/** Practise rescue: how long a student must be off the note before the guide fades in. Pure. */

export const RESCUE_SEC = 1.0;
export const RESCUE_NOTE_FRACTION = 0.6;
export const RESCUE_MIN_SEC = 0.5;

/** 1.0 s, or 60% of the note's length if that is shorter (never under 0.5 s). */
export function rescueThresholdSec(noteDurationSec: number): number {
  return Math.max(RESCUE_MIN_SEC, Math.min(RESCUE_SEC, RESCUE_NOTE_FRACTION * noteDurationSec));
}
