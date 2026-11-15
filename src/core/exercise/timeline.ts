import type { ResolvedExercise } from './types';

export const LEAD_IN_CLICKS = 4; // always 4, in every step; not configurable per lesson

export interface Click {
  tSec: number;
  accent: boolean;
}

export interface Timeline {
  /** When the optional start note sounds (one beat long), or null. */
  startNoteSec: number | null;
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
  opts: { playStartNote: boolean; metronome: boolean },
  t0: number,
): Timeline {
  const beat = 60 / ex.tempoBpm;
  const startNoteSec = opts.playStartNote ? t0 : null;
  const countInStartSec = t0 + (opts.playStartNote ? 2 * beat : 0);
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
    countInStartSec,
    leadInClicks,
    exerciseClicks,
    startSec,
    endSec: startSec + ex.totalSec,
  };
}
