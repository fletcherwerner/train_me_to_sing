import { useEffect, useRef, useState } from 'react';
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
  /** When set, frames quieter than this count as no voice while a note is playing (piano bleed). */
  gateRms: number | null = null,
): LiveAttempt {
  const position = usePlaybackPosition(handle, exercise, true);
  const [sungMidi, setSungMidi] = useState<number | null>(null);
  const active = handle !== null && position.phase !== 'done';

  const idx = active ? position.currentNoteIndex : null;
  const idxRef = useRef<number | null>(null);
  idxRef.current = idx;
  const gateRef = useRef<number | null>(gateRms);
  gateRef.current = gateRms;

  useEffect(() => {
    if (!source || !active) {
      setSungMidi(null);
      return;
    }
    return source.subscribe((f) => {
      const g = gateRef.current;
      const raw = f.midiFast !== undefined ? f.midiFast : f.midi;
      const midi = g !== null && idxRef.current !== null && f.rms < g ? null : raw;
      setSungMidi((prev) => (prev === midi ? prev : midi));
    });
  }, [source, active]);

  const targetMidi = exercise && idx !== null ? exercise.notes[idx].midi : null;
  // While the piano plays the call nobody is expected to sing, so there is no sung pitch to show.
  const shown = active && position.phase !== 'call' ? sungMidi : null;
  const cents = shown !== null && targetMidi !== null ? centsBetween(shown, targetMidi) : null;
  void tolerance; // the profile is applied by the CentsMeter's zone; kept in the signature per spec
  return { position, currentNoteIndex: idx, sungMidi: shown, cents, targetMidi };
}
