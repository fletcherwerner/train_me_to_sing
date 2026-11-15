import type { ResolvedExercise } from '../../core/exercise/types';
import type { SynthBehaviour } from './SyntheticPitchSource';

export const SIM_BEHAVIOURS = [
  'perfect',
  'flat40',
  'flat70',
  'octaveDown',
  'late300',
  'wobble',
  'silent',
] as const;
export type SimBehaviour = (typeof SIM_BEHAVIOURS)[number];

export function isSimBehaviour(s: string | null): s is SimBehaviour {
  return s !== null && (SIM_BEHAVIOURS as readonly string[]).includes(s);
}

// The attempt page registers the active exercise and its audio-clock start.
let active: { ex: ResolvedExercise; startSec: number } | null = null;

export function registerSimExercise(ex: ResolvedExercise, startSec: number): void {
  active = { ex, startSec };
}

export function clearSimExercise(): void {
  active = null;
}

/** Pure: pitch a simulated singer produces at time `rel` (seconds from exercise start). */
export function simPitchAt(ex: ResolvedExercise, behaviour: SimBehaviour, rel: number): number | null {
  if (behaviour === 'silent') return null;
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
    return simPitchAt(active.ex, behaviour, tSec - active.startSec);
  };
}
