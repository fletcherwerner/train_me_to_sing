import type { ResolvedExercise } from '../../core/exercise/types';
import type { SynthBehaviour, SynthRms } from './SyntheticPitchSource';

export const SIM_BEHAVIOURS = [
  'perfect',
  'flat40',
  'flat70',
  'octaveDown',
  'late300',
  'wobble',
  'silent',
  'bleed',
  'bleedSing',
] as const;
export type SimBehaviour = (typeof SIM_BEHAVIOURS)[number];

export function isSimBehaviour(s: string | null): s is SimBehaviour {
  return s !== null && (SIM_BEHAVIOURS as readonly string[]).includes(s);
}

// The attempt page registers the active exercise and its audio-clock start.
let active: { ex: ResolvedExercise; startSec: number; melodyPlaying: boolean; sings: boolean } | null = null;

/** `melodyPlaying`: the piano sounds (I do, We do). `sings`: a singer is meant to sing (false in I do). */
export function registerSimExercise(ex: ResolvedExercise, startSec: number, melodyPlaying = true, sings = true): void {
  active = { ex, startSec, melodyPlaying, sings };
}

export function clearSimExercise(): void {
  active = null;
}

/** Pure: pitch a simulated singer produces at time `rel` (seconds from exercise start). */
export function simPitchAt(ex: ResolvedExercise, behaviour: SimBehaviour, rel: number): number | null {
  if (behaviour === 'silent') return null;
  if (behaviour === 'bleed' || behaviour === 'bleedSing') behaviour = 'perfect';
  const t = behaviour === 'late300' ? rel - 0.3 : rel;
  const note = ex.notes.find((n) => t >= n.startSec && t < n.startSec + n.durationSec);
  if (!note) return null;
  switch (behaviour) {
    case 'flat40':
      return note.midi - 0.4;
    case 'flat70':
      return note.midi - 0.7;
    case 'octaveDown':
      return note.midi - 12;
    case 'wobble':
      return t - note.startSec < 0.3 * note.durationSec ? note.midi : note.midi + 1.5;
    default:
      return note.midi;
  }
}

export function simBehaviour(behaviour: SimBehaviour): SynthBehaviour {
  return (tSec) => {
    if (!active) return null;
    // bleed: the piano only, so nothing once the melody stops (You do). bleedSing adds a singer in We do and You do.
    if (behaviour === 'bleed' && !active.melodyPlaying) return null;
    return simPitchAt(active.ex, behaviour, tSec - active.startSec);
  };
}

/**
 * Input level per frame. 0.1 for a singer. In I do nobody sings: the piano leaks at 0.02 for the bleed
 * behaviours and not at all (headphones) for the others.
 */
export function simRms(behaviour: SimBehaviour): SynthRms {
  const leaks = behaviour === 'bleed' || behaviour === 'bleedSing';
  return () => {
    if (behaviour === 'bleed') return 0.02;
    if (active && !active.sings) return leaks ? 0.02 : 0;
    return 0.1;
  };
}
