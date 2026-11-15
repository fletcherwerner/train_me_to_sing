import { useEffect, useState } from 'react';
import type { ResolvedExercise } from '../../core/exercise/types';
import { LEAD_IN_CLICKS } from '../../core/exercise/timeline';
import type { PlaybackHandle } from '../../audio/exercisePlayer';
import { now } from '../../audio/audioEngine';

export interface PlaybackPosition {
  phase: 'startNote' | 'countIn' | 'playing' | 'done';
  currentNoteIndex: number | null;
  beatInBar: number;
  countInRemaining: number;
}

const IDLE: PlaybackPosition = {
  phase: 'done',
  currentNoteIndex: null,
  beatInBar: 0,
  countInRemaining: 0,
};

/** Pure position computation for a time t on the audio clock. */
export function positionAt(
  t: number,
  startSec: number,
  endSec: number,
  ex: ResolvedExercise,
  hasStartNote = true,
): PlaybackPosition {
  const beat = 60 / ex.tempoBpm;
  const countInStart = startSec - LEAD_IN_CLICKS * beat;
  if (t >= endSec) return IDLE;
  if (t < countInStart) {
    if (!hasStartNote) {
      return {
        phase: 'countIn',
        currentNoteIndex: null,
        beatInBar: 0,
        countInRemaining: LEAD_IN_CLICKS,
      };
    }
    return { phase: 'startNote', currentNoteIndex: null, beatInBar: 0, countInRemaining: 0 };
  }
  if (t < startSec) {
    const k = Math.min(LEAD_IN_CLICKS - 1, Math.floor((t - countInStart) / beat));
    return {
      phase: 'countIn',
      currentNoteIndex: null,
      beatInBar: 0,
      countInRemaining: LEAD_IN_CLICKS - k,
    };
  }
  const rel = t - startSec;
  const note = ex.notes.find((n) => rel >= n.startSec && rel < n.startSec + n.durationSec);
  return {
    phase: 'playing',
    currentNoteIndex: note ? note.index : null,
    beatInBar: Math.floor(rel / beat) % ex.beatsPerBar,
    countInRemaining: 0,
  };
}

export function usePlaybackPosition(
  handle: PlaybackHandle | null,
  ex: ResolvedExercise | null,
  hasStartNote = true,
): PlaybackPosition {
  const [pos, setPos] = useState<PlaybackPosition>(IDLE);

  useEffect(() => {
    if (!handle || !ex) {
      setPos(IDLE);
      return;
    }
    let raf = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const next = positionAt(now(), handle.startSec, handle.endSec, ex, hasStartNote);
      setPos((p) =>
        p.phase === next.phase &&
        p.currentNoteIndex === next.currentNoteIndex &&
        p.beatInBar === next.beatInBar &&
        p.countInRemaining === next.countInRemaining
          ? p
          : next,
      );
      if (next.phase === 'done') return;
      raf = requestAnimationFrame(tick);
    };
    tick();
    void handle.done.then(() => {
      if (!stopped) setPos(IDLE);
    });
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [handle, ex, hasStartNote]);

  return pos;
}
