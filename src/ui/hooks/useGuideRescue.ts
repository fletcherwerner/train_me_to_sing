import { useEffect, useRef, useState } from 'react';
import { now } from '../../audio/audioEngine';
import { rescueThresholdSec } from '../../core/feedback/rescue';

/**
 * The Practise rescue. While `active`, adds up the time the student is voiced and outside the tolerance within
 * the current note. Past the threshold the guide is shown for the rest of that note. Silence never counts.
 * `helped()` is the number of notes on which the guide appeared in this run.
 */
export function useGuideRescue(
  active: boolean,
  noteIndex: number | null,
  cents: number | null,
  toleranceCents: number,
  noteDurationSec: number | null,
): { visible: boolean; helped: () => number; reset: () => void } {
  const [shownFor, setShownFor] = useState<number | null>(null);
  const helpedSet = useRef(new Set<number>());
  const acc = useRef(0);
  const last = useRef(0);
  const inputs = useRef({ cents, toleranceCents, noteDurationSec, noteIndex });
  inputs.current = { cents, toleranceCents, noteDurationSec, noteIndex };

  // A new note starts the count again and hides the guide.
  useEffect(() => {
    acc.current = 0;
    last.current = now();
    setShownFor(null);
  }, [noteIndex, active]);

  useEffect(() => {
    if (!active) return;
    last.current = now();
    const id = setInterval(() => {
      const t = now();
      const dt = Math.min(0.25, t - last.current);
      last.current = t;
      const i = inputs.current;
      if (i.noteIndex === null || i.noteDurationSec === null) return;
      if (i.cents !== null && Math.abs(i.cents) > i.toleranceCents) acc.current += dt;
      if (acc.current >= rescueThresholdSec(i.noteDurationSec)) {
        helpedSet.current.add(i.noteIndex);
        setShownFor(i.noteIndex);
      }
    }, 50);
    return () => clearInterval(id);
  }, [active]);

  return {
    visible: active && noteIndex !== null && shownFor === noteIndex,
    helped: () => helpedSet.current.size,
    reset: () => {
      helpedSet.current = new Set();
    },
  };
}
