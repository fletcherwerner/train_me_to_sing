/**
 * Minimal interface for pitch frame data needed by range analysis.
 * Defined here to avoid importing from audio/ (core must not import from outside core/).
 */
interface PitchFrameLike {
  midi: number | null;
  tSec: number;
}

export type FindResult =
  | { ok: true; midi: number }
  | { ok: false; reason: 'no-voice' | 'unstable' };

interface Segment {
  values: number[];
  startSec: number;
  endSec: number;
}

/**
 * Analyze pitch frames to find the held note (lowest or highest).
 *
 * 1. If fewer than 30% of frames have a non-null midi, return no-voice.
 * 2. Find every stable segment: a run of consecutive non-null frames lasting
 *    at least 0.5 s in which every value is within ±0.5 semitones of the
 *    run's median. (Scan forward; extend the run while the next frame is
 *    within ±0.5 of the running median; close the run otherwise.)
 * 3. If there are none, return unstable.
 * 4. Take the median of each segment. Return the lowest (or highest) median,
 *    rounded to the nearest integer.
 */
export function findHeldNote(
  frames: PitchFrameLike[],
  pick: 'lowest' | 'highest',
): FindResult {
  // Step 1: check if enough frames have pitch
  const nonNullCount = frames.filter((f) => f.midi != null).length;
  if (nonNullCount < frames.length * 0.3) {
    return { ok: false, reason: 'no-voice' };
  }

  // Step 2: find stable segments with time spans
  const segments: Segment[] = [];
  let currentValues: number[] = [];
  let currentStartSec: number | null = null;
  let currentEndSec: number | null = null;

  function closeSegment() {
    if (currentValues.length > 0 && currentStartSec != null && currentEndSec != null) {
      const duration = currentEndSec - currentStartSec;
      if (duration >= 0.5) {
        segments.push({
          values: [...currentValues],
          startSec: currentStartSec,
          endSec: currentEndSec,
        });
      }
    }
    currentValues = [];
    currentStartSec = null;
    currentEndSec = null;
  }

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    if (frame.midi == null) {
      closeSegment();
      continue;
    }

    if (currentValues.length === 0) {
      currentValues.push(frame.midi);
      currentStartSec = frame.tSec;
      currentEndSec = frame.tSec;
      continue;
    }

    // Calculate the median of the current segment
    const sorted = [...currentValues].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Check if this frame is within ±0.5 of the median
    if (Math.abs(frame.midi - median) <= 0.5) {
      currentValues.push(frame.midi);
      currentEndSec = frame.tSec;
    } else {
      closeSegment();
      currentValues = [frame.midi];
      currentStartSec = frame.tSec;
      currentEndSec = frame.tSec;
    }
  }

  // Close the last segment
  closeSegment();

  // Step 3: if no stable segments, return unstable
  if (segments.length === 0) {
    return { ok: false, reason: 'unstable' };
  }

  // Step 4: take the median of each segment, then pick lowest or highest
  const medians = segments.map((seg) => {
    const sorted = [...seg.values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  });

  const chosen =
    pick === 'lowest' ? Math.min(...medians) : Math.max(...medians);

  return { ok: true, midi: Math.round(chosen) };
}
