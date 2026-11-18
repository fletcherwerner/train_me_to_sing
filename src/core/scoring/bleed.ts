import type { ResolvedNote } from '../exercise/types';

/** Minimal frame shape (exercise time) so core does not import from audio. */
export interface BleedFrame {
  tSec: number;
  midi: number | null;
  clarity: number;
  rms: number;
}

/** Same value as PITCH_CONFIG.MIN_RMS in the microphone source (core cannot import audio). */
export const MIN_RMS = 0.01;
const ATTACK_SEC = 0.1;
const MIN_FRAMES = 10;
const GATE_FACTOR = 2.5;
const GATE_CAP = 0.05;

function inNote(notes: readonly ResolvedNote[], t: number, skipSec: number): boolean {
  return notes.some((n) => t >= n.startSec + skipSec && t < n.startSec + n.durationSec);
}

/** 75th percentile of rms of frames inside notes, after each note's first 100 ms. null if under 10 frames. */
export function measureBleed(frames: readonly BleedFrame[], notes: readonly ResolvedNote[]): number | null {
  const levels = frames
    .filter((f) => inNote(notes, f.tSec, ATTACK_SEC))
    .map((f) => f.rms)
    .sort((a, b) => a - b);
  if (levels.length < MIN_FRAMES) return null;
  const pos = 0.75 * (levels.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return levels[lo] + (levels[hi] - levels[lo]) * (pos - lo);
}

/** Level a frame must reach to count as voice while the piano plays. */
export function bleedGate(bleedRms: number | null): number {
  if (bleedRms === null) return MIN_RMS;
  return Math.min(GATE_CAP, Math.max(MIN_RMS, GATE_FACTOR * bleedRms));
}

/** Copy of frames where quiet frames inside a note have midi null. */
export function applyGate<T extends BleedFrame>(
  frames: readonly T[],
  notes: readonly ResolvedNote[],
  gateRms: number,
): T[] {
  return frames.map((f) => (f.rms < gateRms && inNote(notes, f.tSec, 0) ? { ...f, midi: null } : f));
}
