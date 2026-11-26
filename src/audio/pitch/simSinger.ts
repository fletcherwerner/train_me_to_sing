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
  'scoop',
  'sharp300',
  'findLate',
  'weDoMiss',
  'step300',
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

/**
 * Pure: pitch a simulated singer produces at time `rel` (seconds from the student's beat 0; the piano's call before it
 * is never sung over). `weDo`: this is a sing-along; `weDoMiss` skips the last note there and is perfect in You do.
 */
export function simPitchAt(ex: ResolvedExercise, behaviour: SimBehaviour, rel: number, weDo = false): number | null {
  if (behaviour === 'silent') return null;
  if (behaviour === 'weDoMiss') {
    const last = ex.notes[ex.notes.length - 1];
    const inLast = last !== undefined && rel >= last.startSec && rel < last.startSec + last.durationSec;
    if (weDo && inLast) return null;
    behaviour = 'perfect';
  }
  if (behaviour === 'bleed' || behaviour === 'bleedSing') behaviour = 'perfect';
  const t = behaviour === 'late300' ? rel - 0.3 : rel;
  const note = ex.notes.find((n) => t >= n.startSec && t < n.startSec + n.durationSec);
  if (!note) return null;
  if (note.glideToMidi !== undefined) {
    // A glide: the singer follows the line.
    return note.midi + ((note.glideToMidi - note.midi) * (t - note.startSec)) / note.durationSec;
  }
  switch (behaviour) {
    case 'scoop': {
      // Each note starts a semitone below and reaches the target after 120 ms. A short breath ends the note,
      // so the next one is a fresh start.
      const rel = t - note.startSec;
      if (rel > note.durationSec - 0.05) return null;
      return rel < 0.12 ? note.midi - 1 + rel / 0.12 : note.midi;
    }
    case 'step300':
      // On the note, then a step 300 cents high after 0.9 s (the guide response-time test).
      return t - note.startSec >= STEP_AT_SEC ? note.midi + 3 : note.midi;
    case 'flat40':
      return note.midi - 0.4;
    case 'sharp300':
      return note.midi + 3;
    case 'findLate': {
      // Starts two semitones low and glides to the target over 1.5 s.
      const r = t - note.startSec;
      return r >= 1.5 ? note.midi : note.midi - 2 + (2 * r) / 1.5;
    }
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

const STEP_AT_SEC = 0.9;

export function simBehaviour(behaviour: SimBehaviour): SynthBehaviour {
  return (tSec) => {
    if (!active) return null;
    if (behaviour === 'step300' && active.sings) {
      // Test instrumentation only (not musical timing): when the stepped pitch is first produced, in page time.
      const rel = tSec - active.startSec;
      const first = active.ex.notes[0];
      const w = window as unknown as { __tmtsStepAt?: number };
      if (first && rel >= first.startSec + STEP_AT_SEC && rel < first.startSec + first.durationSec && w.__tmtsStepAt === undefined) {
        w.__tmtsStepAt = performance.now();
      }
    }
    // bleed: the piano only, so nothing once the melody stops (You do). bleedSing adds a singer in We do and You do.
    if (behaviour === 'bleed' && !active.melodyPlaying) return null;
    return simPitchAt(active.ex, behaviour, tSec - active.startSec, active.melodyPlaying && active.sings);
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
