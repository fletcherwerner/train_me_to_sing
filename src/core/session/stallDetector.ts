/**
 * Decides whether a clock has stopped. Pure: feed it (audio seconds, wall ms) samples.
 * Returns true once the audio time has not increased for `stallMs` of wall time.
 */
export interface StallDetector {
  sample(audioSec: number, wallMs: number): boolean;
}

export function createStallDetector(stallMs: number): StallDetector {
  let lastAudio: number | null = null;
  let lastAdvanceWall = 0;
  return {
    sample(audioSec, wallMs) {
      if (lastAudio === null || audioSec > lastAudio) {
        lastAudio = audioSec;
        lastAdvanceWall = wallMs;
        return false;
      }
      return wallMs - lastAdvanceWall >= stallMs;
    },
  };
}
