/** A frame as the catcher needs it (core must not import from audio/). */
interface FrameLike {
  tSec: number;
  midi: number | null;
}

export interface CaughtNote {
  midi: number;
  tSec: number;
}

/**
 * Catches steady notes from a stream of pitch frames, for the mic check.
 *
 * A note is caught once the voice stays on the same key (rounded MIDI) for
 * `holdSec`. Each held note is caught once; a gap (no pitch) or a move to a
 * different key starts a new run.
 */
export function createNoteCatcher({ holdSec = 0.3 }: { holdSec?: number } = {}) {
  let key: number | null = null;
  let startSec = 0;
  let caught = false;

  return {
    /** Feeds one frame. Returns the note when this frame completes a hold, otherwise null. */
    push(f: FrameLike): CaughtNote | null {
      const k = f.midi == null ? null : Math.round(f.midi);
      if (k !== key) {
        key = k;
        startSec = f.tSec;
        caught = false;
        return null;
      }
      if (k == null || caught || f.tSec - startSec < holdSec) return null;
      caught = true;
      return { midi: k, tSec: f.tSec };
    },
    reset() {
      key = null;
      caught = false;
    },
  };
}
