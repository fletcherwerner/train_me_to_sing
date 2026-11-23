import type { ToleranceProfile } from './types';
import { meanCloseness } from './accuracy';
import { spreadOf } from './spread';

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

/** Every target listens for exactly this long, matched or not (a lesson may override with `singSec`). */
export const MATCH_SING_SEC = 8;
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
  windowSec: number = MATCH_SING_SEC,
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

export interface MatchDescription {
  /** Seconds to the start of the matching hold; null when not matched. */
  foundInSec: number | null;
  /** Share (0..1) of the frames from `foundInSec` to the end that are within tolerance; null when not found. */
  onAfterFound: number | null;
  /** Median cents off over the voiced frames (+ sharp, - flat), octave folded; null when silent. */
  typicalCents: number | null;
  /** The voice was mostly an octave or more away; `typicalCents` is folded for that. */
  wrongOctave: boolean;
  /** Mean closeness from the first voiced frame to the end of the sing time (S08's rule). */
  accuracy: number;
  /** Interquartile range, in cents, of the voiced frames from the first voiced one (octave folded); null when silent. */
  spreadCents?: number | null;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** How well one target went, beyond whether it matched. Frame times are seconds from the start of listening. Pure. */
export function describeMatch(
  frames: MatchFrame[],
  targetMidi: number,
  tol: ToleranceProfile,
  outcome: MatchOutcome,
  singSec: number = MATCH_SING_SEC,
): MatchDescription {
  const tolSemi = tol.cents / 100 + 1e-9;
  const inTime = frames.filter((f) => f.tSec >= 0 && f.tSec <= singSec).sort((a, b) => a.tSec - b.tSec);
  const first = inTime.find((f) => f.midi !== null);
  if (!first) return { foundInSec: null, onAfterFound: null, typicalCents: null, wrongOctave: false, accuracy: 0 };
  const voiced = inTime.filter((f) => f.tSec >= first.tSec);
  const diffs = voiced.filter((f) => f.midi !== null).map((f) => (f.midi as number) - targetMidi);
  const wrongOctave = Math.round(median(diffs) / 12) !== 0;
  const typicalCents = median(diffs.map((d) => d - 12 * Math.round(d / 12))) * 100;
  const foundInSec = outcome.matched ? outcome.timeToMatchSec : null;
  let onAfterFound: number | null = null;
  if (foundInSec !== null) {
    const after = inTime.filter((f) => f.tSec >= foundInSec);
    const on = after.filter((f) => f.midi !== null && Math.abs(f.midi - targetMidi) <= tolSemi).length;
    onAfterFound = after.length === 0 ? 0 : on / after.length;
  }
  const spreadCents = spreadOf(diffs.map((d) => (d - 12 * Math.round(d / 12)) * 100));
  return { foundInSec, onAfterFound, typicalCents, wrongOctave, accuracy: meanCloseness(voiced, targetMidi), spreadCents };
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
