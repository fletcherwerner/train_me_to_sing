/** The run log. Plain data, kept on the device. Only numbers are stored, never sound. */

export interface NoteRecord {
  /** Target MIDI. */
  t: number;
  /** Median cents off (+ sharp, − flat); null when silent. */
  c: number | null;
  /** Held fraction 0..1. */
  h: number;
  /** Spread: interquartile range of cents over the voiced frames. */
  s?: number;
  /** Onset error in ms (melody). */
  o?: number | null;
  /** Miss reason, when missed. */
  r?: string;
  /** Slid into the note (scooped / slid). */
  sc?: boolean;
  /** Match only: found in seconds; null when never found. */
  f?: number | null;
  /** Accuracy 0..1. */
  a?: number;
  /** Wrong octave. */
  oct?: boolean;
}

export type RunKind = 'melody' | 'match' | 'warmup';

export interface RunRecord {
  /** Random, unique; used to merge on import. */
  id: string;
  /** A lesson id, or 'warmup'. */
  lessonId: string;
  kind: RunKind;
  /** Local YYYY-MM-DD (todayString(), so ?today= works in tests). */
  date: string;
  /** ISO time. */
  endedAt: string;
  durationSec: number;
  level?: 'learn' | 'practise' | 'prove';
  /** The run was inside Today's practice. */
  inPractice: boolean;
  tonicMidi?: number;
  /** The student's range at the time. */
  range?: { lowMidi: number; highMidi: number };
  score?: number;
  accuracy?: number;
  passed?: boolean;
  /** Dropped after 8 weeks (see history.ts). */
  notes?: NoteRecord[];
}

export interface History {
  runs: RunRecord[];
  /** Practice time per local day. */
  days: Record<string, { seconds: number }>;
}

export const EMPTY_HISTORY: History = { runs: [], days: {} };
