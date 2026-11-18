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
  /** Pitch at `endSec`. Differs from `midi` for a glide, which is drawn as a sloped line. */
  endMidi: number;
}

export interface SungPoint {
  tSec: number;
  midi: number;
}

/** Live graph: seconds shown, and where the "now" line sits (fraction from the left). */
export const GRAPH_WINDOW_SEC = 8;
export const GRAPH_NOW_FRACTION = 0.3;
/** Semitones shown above the highest and below the lowest target note. */
export const GRAPH_MARGIN = 3;

/**
 * Lowest and highest MIDI shown: the exercise's lowest and highest target
 * notes plus `margin` semitones. Kept narrow on purpose, so a few cents sharp
 * or flat is visible. With no notes, the student's range is used instead.
 */
export function graphPitchBounds(range: StudentRange, notes: ResolvedNote[], margin = GRAPH_MARGIN): PitchBounds {
  if (notes.length === 0) return { lowMidi: range.lowMidi - margin, highMidi: range.highMidi + margin };
  let lo = Infinity;
  let hi = -Infinity;
  for (const n of notes) {
    for (const m of n.glideToMidi !== undefined ? [n.midi, n.glideToMidi] : [n.midi]) {
      if (m < lo) lo = m;
      if (m > hi) hi = m;
    }
  }
  return { lowMidi: lo - margin, highMidi: hi + margin };
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
  return notes.map((n) => ({
    startSec: n.startSec,
    endSec: n.startSec + n.durationSec,
    midi: n.midi,
    endMidi: n.glideToMidi ?? n.midi,
  }));
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

/** Semitone rows to label: every C, the range low and high, and the lowest and highest target notes. */
export function labelledMidis(bounds: PitchBounds, range: StudentRange, notes: ResolvedNote[] = []): number[] {
  const set = new Set<number>();
  if (notes.length) {
    set.add(Math.min(...notes.map((n) => n.midi)));
    set.add(Math.max(...notes.map((n) => n.midi)));
  }
  for (let m = Math.ceil(bounds.lowMidi); m <= bounds.highMidi; m++) {
    if (((m % 12) + 12) % 12 === 0) set.add(m);
  }
  set.add(range.lowMidi);
  set.add(range.highMidi);
  return [...set].filter((m) => m >= bounds.lowMidi && m <= bounds.highMidi).sort((a, b) => a - b);
}

/**
 * Split one sung polyline into runs that are inside the axis or off it.
 * Each run after the first starts with the previous run's last point, so the
 * pieces join up when drawn.
 */
export function splitByBounds(points: SungPoint[], bounds: PitchBounds): { inside: boolean; points: SungPoint[] }[] {
  const out: { inside: boolean; points: SungPoint[] }[] = [];
  const isIn = (p: SungPoint) => p.midi >= bounds.lowMidi && p.midi <= bounds.highMidi;
  for (const p of points) {
    const inside = isIn(p);
    const cur = out[out.length - 1];
    if (cur && cur.inside === inside) cur.points.push(p);
    else out.push({ inside, points: cur ? [cur.points[cur.points.length - 1], p] : [p] });
  }
  return out;
}
