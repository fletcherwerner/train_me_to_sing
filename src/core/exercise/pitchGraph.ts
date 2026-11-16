import type { ResolvedNote, StudentRange } from './types';

/** The part of a pitch frame the graph needs. `tSec` is exercise time. */
export interface GraphFrame {
  tSec: number;
  midi: number | null;
}

export interface PitchBounds {
  lowMidi: number;
  highMidi: number;
}

export interface Segment {
  startSec: number;
  endSec: number;
  midi: number;
}

export interface SungPoint {
  tSec: number;
  midi: number;
}

/** Live graph: seconds shown, and where the "now" line sits (fraction from the left). */
export const GRAPH_WINDOW_SEC = 8;
export const GRAPH_NOW_FRACTION = 0.3;
/** Results graph pitch axis is never wider than this. */
export const RESULTS_MIN_MIDI = 36; // C2
export const RESULTS_MAX_MIDI = 84; // C6

/** Lowest and highest MIDI shown: the saved range widened to every target note, plus a margin. */
export function graphPitchBounds(range: StudentRange, notes: ResolvedNote[], margin = 2): PitchBounds {
  let lo = range.lowMidi;
  let hi = range.highMidi;
  for (const n of notes) {
    if (n.midi < lo) lo = n.midi;
    if (n.midi > hi) hi = n.midi;
  }
  return { lowMidi: lo - margin, highMidi: hi + margin };
}

/** Results axis: the live bounds widened to all sung pitch, capped at C2–C6. */
export function resultsPitchBounds(
  range: StudentRange,
  notes: ResolvedNote[],
  frames: GraphFrame[],
  margin = 2,
): PitchBounds {
  const b = graphPitchBounds(range, notes, margin);
  let lo = b.lowMidi;
  let hi = b.highMidi;
  for (const f of frames) {
    if (f.midi === null) continue;
    const lowEdge = Math.floor(f.midi) - 1;
    const highEdge = Math.ceil(f.midi) + 1;
    if (lowEdge < lo) lo = lowEdge;
    if (highEdge > hi) hi = highEdge;
  }
  // The cap never removes a target note's own row.
  lo = Math.max(lo, Math.min(RESULTS_MIN_MIDI, b.lowMidi));
  hi = Math.min(hi, Math.max(RESULTS_MAX_MIDI, b.highMidi));
  return { lowMidi: lo, highMidi: hi };
}

/** Pixels per second for a window of `windowSec` across `widthPx`. */
export function pxPerSec(widthPx: number, windowSec = GRAPH_WINDOW_SEC): number {
  return widthPx / windowSec;
}

/** X of exercise time `tSec` when the "now" line (at `nowFraction`) shows `nowSec`. */
export function timeToX(
  tSec: number,
  nowSec: number,
  widthPx: number,
  windowSec = GRAPH_WINDOW_SEC,
  nowFraction = GRAPH_NOW_FRACTION,
): number {
  return widthPx * nowFraction + (tSec - nowSec) * pxPerSec(widthPx, windowSec);
}

/** Y of a (possibly fractional) MIDI pitch: the top edge is `highMidi`, the bottom edge `lowMidi`. Linear. */
export function midiToY(midi: number, bounds: PitchBounds, heightPx: number): number {
  const span = bounds.highMidi - bounds.lowMidi;
  if (span <= 0) return heightPx / 2;
  return ((bounds.highMidi - midi) / span) * heightPx;
}

/** Like `midiToY`, but pitch outside the axis is pinned to the top or bottom edge. */
export function clampedMidiToY(midi: number, bounds: PitchBounds, heightPx: number): number {
  return midiToY(Math.min(bounds.highMidi, Math.max(bounds.lowMidi, midi)), bounds, heightPx);
}

export function targetSegments(notes: ResolvedNote[]): Segment[] {
  return notes.map((n) => ({ startSec: n.startSec, endSec: n.startSec + n.durationSec, midi: n.midi }));
}

/**
 * Split sung frames into polylines. The line breaks where `midi` is null
 * (no voice) or where two frames are more than `maxGapSec` apart.
 */
export function sungSegments(frames: GraphFrame[], maxGapSec = 0.1): SungPoint[][] {
  const out: SungPoint[][] = [];
  let cur: SungPoint[] = [];
  let lastT = -Infinity;
  for (const f of frames) {
    if (f.midi === null) {
      if (cur.length) out.push(cur);
      cur = [];
      lastT = -Infinity;
      continue;
    }
    if (cur.length && f.tSec - lastT > maxGapSec) {
      out.push(cur);
      cur = [];
    }
    cur.push({ tSec: f.tSec, midi: f.midi });
    lastT = f.tSec;
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Semitone rows to label: every C, plus the range low and high. */
export function labelledMidis(bounds: PitchBounds, range: StudentRange): number[] {
  const set = new Set<number>();
  for (let m = Math.ceil(bounds.lowMidi); m <= bounds.highMidi; m++) {
    if (((m % 12) + 12) % 12 === 0) set.add(m);
  }
  set.add(range.lowMidi);
  set.add(range.highMidi);
  return [...set].filter((m) => m >= bounds.lowMidi && m <= bounds.highMidi).sort((a, b) => a - b);
}
