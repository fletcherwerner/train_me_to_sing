import type { MatchDescription, MatchOutcome } from '../scoring/matchScoring';
import type { AttemptResult } from '../scoring/types';
import type { NoteRecord, RunRecord } from './types';

const round = (x: number, places = 0): number => {
  const k = 10 ** places;
  return Math.round(x * k) / k;
};

/** Per-note numbers of a melody run. */
export function melodyNoteRecords(result: AttemptResult): NoteRecord[] {
  return result.notes.map((n) => {
    const rec: NoteRecord = {
      t: n.targetMidi,
      c: n.medianCents === null ? null : round(n.medianCents),
      h: round(n.heldFraction, 2),
    };
    if (n.spreadCents !== undefined) rec.s = round(n.spreadCents);
    if (n.onsetErrorMs !== null) rec.o = round(n.onsetErrorMs);
    if (!n.hit && n.reason) rec.r = n.reason;
    if (n.scooped || n.reason === 'scooped') rec.sc = true;
    if (n.accuracy !== undefined) rec.a = round(n.accuracy, 2);
    if (n.reason === 'wrong-octave') rec.oct = true;
    return rec;
  });
}

/** Per-target numbers of a Match run. */
export function matchNoteRecords(targets: number[], outcomes: MatchOutcome[], descs: MatchDescription[], accuracies: number[]): NoteRecord[] {
  return outcomes.map((o, i) => {
    const d = descs[i];
    const rec: NoteRecord = {
      t: targets[i],
      c: d?.typicalCents == null ? null : round(d.typicalCents),
      h: round(d?.onAfterFound ?? 0, 2),
      f: o.matched && o.timeToMatchSec !== null ? round(o.timeToMatchSec, 2) : null,
    };
    if (d?.spreadCents != null) rec.s = round(d.spreadCents);
    if (!o.matched && o.reason) rec.r = o.reason;
    if (o.reason === 'slid') rec.sc = true;
    if (accuracies[i] !== undefined) rec.a = round(accuracies[i], 2);
    if (d?.wrongOctave) rec.oct = true;
    return rec;
  });
}

export function newRunId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface RunInput {
  lessonId: string;
  kind: RunRecord['kind'];
  /** todayString() */
  date: string;
  endedAt: string;
  durationSec: number;
  level?: RunRecord['level'];
  inPractice: boolean;
  tonicMidi?: number;
  range?: RunRecord['range'];
  result?: AttemptResult;
  notes?: NoteRecord[];
}

/** Builds the stored record of a finished run. */
export function buildRunRecord(i: RunInput, id: string = newRunId()): RunRecord {
  const rec: RunRecord = {
    id,
    lessonId: i.lessonId,
    kind: i.kind,
    date: i.date,
    endedAt: i.endedAt,
    durationSec: Math.max(0, round(i.durationSec)),
    inPractice: i.inPractice,
  };
  if (i.level) rec.level = i.level;
  if (i.tonicMidi !== undefined) rec.tonicMidi = i.tonicMidi;
  if (i.range) rec.range = { lowMidi: i.range.lowMidi, highMidi: i.range.highMidi };
  if (i.result) {
    rec.score = round(i.result.score, 3);
    if (i.result.accuracy !== undefined) rec.accuracy = round(i.result.accuracy, 3);
    rec.passed = i.result.passed;
  }
  if (i.notes) rec.notes = i.notes;
  return rec;
}
