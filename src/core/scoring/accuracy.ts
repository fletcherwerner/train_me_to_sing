import type { ResolvedExercise } from '../exercise/types';

/** Structural frame type so core does not import from audio. PitchFrame satisfies it. */
export interface AccuracyFrame {
  tSec: number;
  midi: number | null;
}

/** Within this many cents counts as perfect: too small to hear. Same at every stage and level. */
export const PERFECT_CENTS = 10;
/** A semitone or more (including the wrong octave) earns nothing. Same at every stage and level. */
export const ZERO_CENTS = 100;
/** The allowance at the start of a note, as in evaluateAttempt (a slide into the note is not punished). */
const SCOOP_SEC = 0.15;

/** 1 within PERFECT_CENTS, falling linearly to 0 at ZERO_CENTS; 0 with no pitch. */
export function closeness(midi: number | null, targetMidi: number): number {
  if (midi === null) return 0;
  const d = Math.abs(midi - targetMidi) * 100;
  if (d <= PERFECT_CENTS + 1e-9) return 1;
  if (d >= ZERO_CENTS) return 0;
  return (ZERO_CENTS - d) / (ZERO_CENTS - PERFECT_CENTS);
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Mean closeness over some frames; no frames means 0. */
export function meanCloseness(frames: AccuracyFrame[], targetMidi: number): number {
  return mean(frames.map((f) => closeness(f.midi, targetMidi)));
}

export interface Accuracy {
  overall: number; // 0..1
  perNote: number[];
}

/** How closely the sung pitch followed each note of the exercise. Every note counts equally. Pure. */
export function accuracyOf(ex: ResolvedExercise, frames: AccuracyFrame[]): Accuracy {
  const perNote = ex.notes.map((n) => {
    const s = n.startSec;
    const e = s + n.durationSec;
    const skip = Math.min(SCOOP_SEC, 0.25 * n.durationSec);
    const W = frames.filter((f) => f.tSec >= s + skip && f.tSec < e);
    return meanCloseness(W, n.midi);
  });
  return { overall: mean(perNote), perNote };
}

/**
 * Accuracy for one match target: the frames from the moment the voice starts to the end of the sing time.
 * Silence before the first voice is free; silence after it counts against. Times are seconds from the start of listening.
 */
export function matchAccuracy(frames: AccuracyFrame[], targetMidi: number, singSec: number): number {
  const inTime = frames.filter((f) => f.tSec >= 0 && f.tSec <= singSec).sort((a, b) => a.tSec - b.tSec);
  const first = inTime.find((f) => f.midi !== null);
  if (!first) return 0;
  return meanCloseness(
    inTime.filter((f) => f.tSec >= first.tSec),
    targetMidi,
  );
}
