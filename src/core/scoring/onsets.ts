/** Structural frame type so core does not import from audio. PitchFrame satisfies it. */
export interface RmsFrame {
  tSec: number;
  rms: number;
}

/** Window after the voice starts in which a slide into the note is looked for. */
export const SCOOP_WINDOW_SEC = 0.15;
/** Smallest approach, in semitones, that counts as a slide into the note. */
export const SCOOP_MIN_SEMITONES = 0.7;
/** Silence before the first sound that makes it a fresh start rather than a continuation. */
const SCOOP_GAP_SEC = 0.1;

export interface PitchedFrame {
  tSec: number;
  midi: number | null;
}

/** A voice that starts this long before the note still belongs to it (a little early). */
const SCOOP_EARLY_SEC = 0.1;

/**
 * True when the voice starts for this note already `SCOOP_MIN_SEMITONES` or more away from the target,
 * inside the first 150 ms of the voice, and then settles within `tolSemitones` of it.
 * `all` is every frame sorted by time; the note runs from `startSec` to `endSec`. The voice must start
 * from silence (a null frame, or a gap of 100 ms) at most 100 ms before the note or inside it. A voice that
 * carries on from the previous note is a leap, not a slide, and never counts.
 */
export function isScooped(
  all: PitchedFrame[],
  startSec: number,
  endSec: number,
  target: number,
  tolSemitones: number,
): boolean {
  const i = all.findIndex((f, k) => {
    if (f.midi === null || f.tSec < startSec - SCOOP_EARLY_SEC || f.tSec >= endSec) return false;
    const prev = k > 0 ? all[k - 1] : null;
    return prev === null || prev.midi === null || f.tSec - prev.tSec > SCOOP_GAP_SEC;
  });
  if (i < 0) return false;
  const first = all[i];
  const firstMidi = first.midi as number;
  const startDev = target - firstMidi;
  if (Math.abs(startDev) < SCOOP_MIN_SEMITONES - 1e-9) return false;
  const after = all.slice(i).filter((f) => f.tSec < endSec);
  const settled = after.find((f) => f.midi !== null && f.tSec > first.tSec && Math.abs(f.midi - target) <= tolSemitones + 1e-9);
  if (!settled || settled.tSec - first.tSec > SCOOP_WINDOW_SEC + 1e-9) return false;
  // The pitch must travel toward the target, not wander off and come back.
  const dir = Math.sign(startDev);
  return after
    .filter((f) => f.midi !== null && f.tSec <= settled.tSec)
    .every((f) => (f.midi as number) * dir <= target * dir + tolSemitones + 1e-9);
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
