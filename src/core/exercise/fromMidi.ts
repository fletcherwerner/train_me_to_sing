import type { ExerciseTemplate, TemplateNote } from './types';

export interface RawMidiNote {
  midi: number;
  startBeat: number;
  durationBeats: number;
}
export interface RawMidiTrack {
  name: string;
  notes: RawMidiNote[];
}

export interface TrackSummary {
  noteCount: number;
  lowMidi: number;
  highMidi: number;
  overlapRatio: number;
}

export const MIN_IMPORT_NOTES = 3;
export const MAX_IMPORT_NOTES = 400;
const SAME_START = 0.05;
const GRID = 0.25;

export function summariseTrack(track: RawMidiTrack): TrackSummary {
  const notes = track.notes;
  if (notes.length === 0) return { noteCount: 0, lowMidi: 0, highMidi: 0, overlapRatio: 0 };
  let low = Infinity;
  let high = -Infinity;
  for (const n of notes) {
    low = Math.min(low, n.midi);
    high = Math.max(high, n.midi);
  }
  const sorted = [...notes].sort((a, b) => a.startBeat - b.startBeat);
  const overlapping = new Set<number>();
  let maxEndIdx = -1;
  let maxEnd = -Infinity;
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i];
    if (maxEndIdx >= 0 && n.startBeat < maxEnd - 1e-9) {
      overlapping.add(i);
      overlapping.add(maxEndIdx);
    }
    const end = n.startBeat + n.durationBeats;
    if (end > maxEnd) {
      maxEnd = end;
      maxEndIdx = i;
    }
  }
  return { noteCount: notes.length, lowMidi: low, highMidi: high, overlapRatio: overlapping.size / notes.length };
}

const quant = (x: number) => Math.round(x / GRID) * GRID;

export function toTemplate(
  track: RawMidiTrack,
  opts: { id: string; title: string; tempoBpm: number; beatsPerBar: number; startBeat?: number; endBeat?: number },
): ExerciseTemplate {
  // 1. window
  let notes = track.notes.filter(
    (n) => (opts.startBeat === undefined || n.startBeat >= opts.startBeat) && (opts.endBeat === undefined || n.startBeat < opts.endBeat),
  );
  // 2. monophonic: highest of simultaneous starts, then trim overlaps
  notes = [...notes].sort((a, b) => a.startBeat - b.startBeat || b.midi - a.midi);
  const mono: RawMidiNote[] = [];
  for (const n of notes) {
    const last = mono[mono.length - 1];
    if (last && n.startBeat - last.startBeat < SAME_START) {
      if (n.midi > last.midi) mono[mono.length - 1] = n;
      continue;
    }
    mono.push(n);
  }
  const trimmed = mono.map((n, i) => {
    const next = mono[i + 1];
    const end = n.startBeat + n.durationBeats;
    return { midi: n.midi, startBeat: n.startBeat, endBeat: next ? Math.min(end, next.startBeat) : end };
  });
  // 3. quantise; drop zero-length
  const q: { midi: number; start: number; dur: number }[] = [];
  for (const n of trimmed) {
    const start = quant(n.startBeat);
    const end = quant(n.endBeat);
    const prev = q[q.length - 1];
    const s = prev ? Math.max(start, prev.start + prev.dur) : start;
    if (end - s <= 1e-9) continue;
    q.push({ midi: n.midi, start: s, dur: end - s });
  }
  if (q.length < MIN_IMPORT_NOTES) throw new Error(`Need at least ${MIN_IMPORT_NOTES} notes; found ${q.length}.`);
  if (q.length > MAX_IMPORT_NOTES) throw new Error(`At most ${MAX_IMPORT_NOTES} notes allowed; found ${q.length}.`);
  // 4/5. shift and offsets
  const first = q[0].start;
  const tonic = Math.min(...q.map((n) => n.midi));
  const out: TemplateNote[] = q.map((n) => ({ offset: n.midi - tonic, startBeat: n.start - first, durationBeats: n.dur }));
  return { id: opts.id, title: opts.title, tempoBpm: opts.tempoBpm, beatsPerBar: opts.beatsPerBar, notes: out };
}
