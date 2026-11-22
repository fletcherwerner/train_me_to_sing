import type { ToleranceProfile } from './types';

/** Structural frame type so core does not import from audio. PitchFrame satisfies it. */
export interface MatchFrame {
  tSec: number;
  midi: number | null;
}

export type MatchMissReason = 'silent' | 'wrong-note' | 'wrong-octave' | 'slid';

export interface MatchOutcome {
  matched: boolean;
  /** Seconds from the start of listening to the start of the matching hold. Null when never on the note. */
  timeToMatchSec: number | null;
  reason?: MatchMissReason;
}

export const MATCH_WINDOW_SEC = 8;
/** A gap in the pitch this short does not break a hold (the detector drops a frame now and then). */
export const MATCH_GAP_SEC = 0.15;
export const SLID_TIP = 'You found it by sliding. Try to start right on the note.';

/**
 * Did the voice stay within the tolerance's cents of the target for `holdSec` continuously?
 * Frame times are seconds from the start of listening. Only the first `windowSec` count.
 * `landWithinSec`: the time from the first voiced frame to the start of the matching hold must be at most
 * this, otherwise the result is `slid`. Pure.
 */
export function matchTarget(
  frames: MatchFrame[],
  targetMidi: number,
  tol: ToleranceProfile,
  holdSec: number,
  landWithinSec: number | null = null,
  windowSec: number = MATCH_WINDOW_SEC,
): MatchOutcome {
  const tolSemi = tol.cents / 100 + 1e-9;
  const sorted = frames.filter((f) => f.tSec >= 0 && f.tSec <= windowSec).sort((a, b) => a.tSec - b.tSec);
  let firstVoiced: number | null = null;
  let runStart: number | null = null;
  let lastOn = 0;
  let sawOctave = false;
  for (const f of sorted) {
    if (f.midi === null) continue;
    firstVoiced ??= f.tSec;
    const d = Math.abs(f.midi - targetMidi);
    if (Math.abs(d - 12) <= tolSemi || Math.abs(d - 24) <= tolSemi) sawOctave = true;
    if (d <= tolSemi) {
      if (runStart === null || f.tSec - lastOn > MATCH_GAP_SEC) runStart = f.tSec;
      lastOn = f.tSec;
      if (f.tSec - runStart >= holdSec - 1e-9) {
        if (landWithinSec !== null && firstVoiced !== null && runStart - firstVoiced > landWithinSec + 1e-9) {
          return { matched: false, timeToMatchSec: runStart, reason: 'slid' };
        }
        return { matched: true, timeToMatchSec: runStart };
      }
    } else {
      runStart = null;
    }
  }
  if (firstVoiced === null) return { matched: false, timeToMatchSec: null, reason: 'silent' };
  return { matched: false, timeToMatchSec: null, reason: sawOctave ? 'wrong-octave' : 'wrong-note' };
}

export interface MatchScore {
  matched: number;
  total: number;
  score: number; // matched / total, 0..1
  passed: boolean;
  accuracy: number; // mean of the targets' accuracies, 0..1
}

export function scoreMatch(outcomes: MatchOutcome[], passScore: number, accuracies: number[] = []): MatchScore {
  const matched = outcomes.filter((o) => o.matched).length;
  const total = outcomes.length;
  const score = total === 0 ? 0 : matched / total;
  const accuracy = accuracies.length === 0 ? 0 : accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  return { matched, total, score, passed: score >= passScore, accuracy };
}

export function describeMatchMiss(reason: MatchMissReason | undefined): string {
  switch (reason) {
    case 'slid':
      return SLID_TIP;
    case 'silent':
      return 'We did not hear you sing.';
    case 'wrong-octave':
      return 'Right note, wrong octave.';
    default:
      return 'Not quite on the note. Listen again and hold steady.';
  }
}

/** Where a target note goes in the student's range. Pure; `rng` returns [0, 1). */
export function placeTarget(
  spec: { placement: 'low' | 'mid' | 'high'; offset?: number },
  range: { lowMidi: number; highMidi: number },
  rng: () => number,
): number {
  const base =
    spec.placement === 'low'
      ? range.lowMidi + 2
      : spec.placement === 'high'
        ? range.highMidi - 2
        : Math.floor((range.lowMidi + range.highMidi) / 2);
  const jitter = Math.min(1, Math.floor(rng() * 3) - 1); // -1, 0 or +1
  const midi = base + jitter + (spec.offset ?? 0);
  return Math.max(range.lowMidi, Math.min(range.highMidi, midi));
}
