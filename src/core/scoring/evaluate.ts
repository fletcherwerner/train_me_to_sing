import type { ResolvedExercise } from '../exercise/types';
import { isScooped } from './onsets';
import type { AttemptResult, MissReason, NoteResult, ToleranceProfile } from './types';

/** Structural frame type so core does not import from audio. PitchFrame satisfies it. */
export interface ScoredFrame {
  tSec: number;
  midi: number | null;
}

const MIN_RUN_SEC = 0.08;
const RUN_EPS = 1e-6;
const SCOOP_SEC = 0.15;
const SILENT_FRACTION = 0.2;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export interface EvaluateOptions {
  /** A note the voice slid into counts as a miss ('scooped'). Otherwise it still counts and is flagged. */
  scoopIsMiss?: boolean;
}

export function evaluateAttempt(
  ex: ResolvedExercise,
  frames: ScoredFrame[],
  tol: ToleranceProfile,
  passScore: number,
  opts: EvaluateOptions = {},
): AttemptResult {
  const sorted = [...frames].sort((a, b) => a.tSec - b.tSec);
  const tolSemi = tol.cents / 100;
  const on = (f: ScoredFrame, target: number) =>
    f.midi !== null && Math.abs(f.midi - target) <= tolSemi + 1e-9;

  const notes: NoteResult[] = ex.notes.map((n, i) => {
    const s = n.startSec;
    const e = s + n.durationSec;
    const base = { index: n.index, targetMidi: n.midi };
    const miss = (
      reason: MissReason,
      medianCents: number | null,
      heldFraction: number,
      onsetErrorMs: number | null,
    ): NoteResult => ({ ...base, hit: false, reason, medianCents, heldFraction, onsetErrorMs });

    const W = sorted.filter((f) => f.tSec >= s && f.tSec < e);
    const pitched = W.filter((f) => f.midi !== null).map((f) => f.midi as number);
    if (W.length === 0 || pitched.length < SILENT_FRACTION * W.length) {
      return miss('silent', null, 0, null);
    }

    const m = median(pitched);
    const medianCents = (m - n.midi) * 100;
    const d = Math.abs(m - n.midi);
    const heldSkip = Math.min(SCOOP_SEC, 0.25 * n.durationSec);
    const held = W.filter((f) => f.tSec >= s + heldSkip);
    const heldFraction =
      held.length === 0 ? 0 : held.filter((f) => on(f, n.midi)).length / held.length;

    if (Math.abs(d - 12) <= tolSemi + 1e-9 || Math.abs(d - 24) <= tolSemi + 1e-9) {
      return miss('wrong-octave', medianCents, heldFraction, null);
    }
    if (Math.abs(medianCents) > tol.cents + 1e-9) {
      return miss('wrong-note', medianCents, heldFraction, null);
    }
    if (heldFraction < tol.holdFraction) {
      return miss('wavered', medianCents, heldFraction, null);
    }

    const prev = i > 0 ? ex.notes[i - 1] : null;
    const skipTiming =
      prev !== null && prev.midi === n.midi && Math.abs(prev.startSec + prev.durationSec - s) < 1e-6;
    let onsetErrorMs: number | null = null;
    if (!skipTiming) {
      const from = s - (2 * tol.timingMs) / 1000;
      let runStart: number | null = null;
      let onset: number | null = null;
      for (const f of sorted) {
        if (f.tSec < from) continue;
        if (f.tSec >= e) break;
        if (on(f, n.midi)) {
          runStart ??= f.tSec;
          if (f.tSec - runStart >= MIN_RUN_SEC - RUN_EPS) {
            onset = runStart;
            break;
          }
        } else {
          runStart = null;
        }
      }
      if (onset === null) return miss('wavered', medianCents, heldFraction, null);
      onsetErrorMs = (onset - s) * 1000;
      if (onsetErrorMs < -tol.timingMs) return miss('early', medianCents, heldFraction, onsetErrorMs);
      if (onsetErrorMs > tol.timingMs) return miss('late', medianCents, heldFraction, onsetErrorMs);
    }
    if (isScooped(sorted, s, e, n.midi, tolSemi)) {
      if (opts.scoopIsMiss) return miss('scooped', medianCents, heldFraction, onsetErrorMs);
      return { ...base, hit: true, medianCents, heldFraction, onsetErrorMs, scooped: true };
    }
    return { ...base, hit: true, medianCents, heldFraction, onsetErrorMs };
  });

  const hits = notes.filter((r) => r.hit).length;
  const score = notes.length === 0 ? 0 : hits / notes.length;
  return { notes, score, passed: score >= passScore };
}
