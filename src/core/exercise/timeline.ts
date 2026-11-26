import type { ResolvedExercise } from './types';

export const LEAD_IN_CLICKS = 4; // always 4, in every step; not configurable per lesson

export interface Click {
  tSec: number;
  accent: boolean;
}

export interface Timeline {
  /** When the optional start note sounds (one beat long), or null. */
  startNoteSec: number | null;
  /** When the whole-pattern call (the piano plays the exercise once, before the lead-in) starts, or null. */
  callStartSec: number | null;
  /** When the call's silent beat ends and the lead-in starts; null with no call. */
  callEndSec: number | null;
  /** First lead-in click. */
  countInStartSec: number;
  leadInClicks: Click[];
  /** Clicks during the exercise (only when the metronome option is on). */
  exerciseClicks: Click[];
  startSec: number;
  endSec: number;
}

/** Pure schedule of everything that happens in a playback, from time t0. */
export function buildTimeline(
  ex: ResolvedExercise,
  opts: { playStartNote: boolean; metronome: boolean; playCall?: boolean },
  t0: number,
): Timeline {
  const beat = 60 / ex.tempoBpm;
  const call = opts.playCall === true;
  const startNoteSec = opts.playStartNote && !call ? t0 : null;
  // The call is the whole exercise at its tempo, then one beat of silence, then the usual count-in.
  const callEndSec = call ? t0 + ex.totalSec + beat : null;
  const countInStartSec = callEndSec ?? t0 + (startNoteSec !== null ? 2 * beat : 0);
  const leadInClicks: Click[] = [];
  for (let i = 0; i < LEAD_IN_CLICKS; i++) {
    leadInClicks.push({ tSec: countInStartSec + i * beat, accent: i === 0 });
  }
  const startSec = countInStartSec + LEAD_IN_CLICKS * beat;
  const exerciseClicks: Click[] = [];
  if (opts.metronome) {
    const nBeats = Math.ceil(ex.totalSec / beat - 1e-9);
    for (let i = 0; i < nBeats; i++) {
      exerciseClicks.push({ tSec: startSec + i * beat, accent: i % ex.beatsPerBar === 0 });
    }
  }
  return {
    startNoteSec,
    callStartSec: call ? t0 : null,
    callEndSec,
    countInStartSec,
    leadInClicks,
    exerciseClicks,
    startSec,
    endSec: startSec + ex.totalSec,
  };
}
