import { useEffect, useState } from 'react';
import type { ResolvedExercise } from '../../core/exercise/types';
import type { ToleranceProfile } from '../../core/scoring/types';
import type { PlaybackHandle } from '../../audio/exercisePlayer';
import type { PitchSource } from '../../audio/pitch/PitchSource';
import { centsBetween } from '../../core/music/notes';
import { usePlaybackPosition, type PlaybackPosition } from './usePlaybackPosition';

export interface LiveAttempt {
  position: PlaybackPosition;
  currentNoteIndex: number | null;
  sungMidi: number | null;
  /** Cents against the current target note, or null when there is no target or no pitch. */
  cents: number | null;
  targetMidi: number | null;
}

export function useLiveAttempt(
  source: PitchSource | null,
  handle: PlaybackHandle | null,
  exercise: ResolvedExercise | null,
  tolerance: ToleranceProfile,
): LiveAttempt {
  const position = usePlaybackPosition(handle, exercise, true);
  const [sungMidi, setSungMidi] = useState<number | null>(null);
  const active = handle !== null && position.phase !== 'done';

  useEffect(() => {
    if (!source || !active) {
      setSungMidi(null);
      return;
    }
    return source.subscribe((f) => setSungMidi((prev) => (prev === f.midi ? prev : f.midi)));
  }, [source, active]);

  const idx = active ? position.currentNoteIndex : null;
  const targetMidi = exercise && idx !== null ? exercise.notes[idx].midi : null;
  const shown = active ? sungMidi : null;
  const cents = shown !== null && targetMidi !== null ? centsBetween(shown, targetMidi) : null;
  void tolerance; // the profile is applied by the CentsMeter's zone; kept in the signature per spec
  return { position, currentNoteIndex: idx, sungMidi: shown, cents, targetMidi };
}
