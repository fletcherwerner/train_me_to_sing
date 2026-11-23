import {
  CATEGORIES,
  RUN_MINIMUMS,
  analyse,
  categoryInfo,
  evidenceOf,
  type AnalyseOptions,
  type CategoryId,
  type CategoryStat,
} from './categories';
import type { RunRecord } from './types';

export interface FocusItem {
  /** A category id, or 'positive' for the best thing about a clean run. */
  id: CategoryId | 'positive';
  name: string;
  evidence: string;
  /** Absent on a positive line. */
  tip?: string;
  /** A built-in lesson that practises it. */
  lessonId?: string;
}

export const MAX_FOCUS = 2;

/** The best thing about a run that has nothing flagged. Never empty. */
export function positiveLine(run: RunRecord): FocusItem {
  const notes = run.notes ?? [];
  const voiced = notes.filter((n) => n.c !== null && !n.oct);
  const within10 = voiced.filter((n) => Math.abs(n.c as number) <= 10).length;
  const allHeld = notes.length > 0 && voiced.length === notes.length && notes.every((n) => n.h >= 0.6 && !n.r);
  const found = notes.filter((n) => n.f !== undefined && n.f !== null).length;
  const isMatch = notes.some((n) => n.f !== undefined);
  let name: string;
  let evidence: string;
  if (notes.length > 0 && within10 * 2 >= notes.length) {
    name = 'Right on pitch';
    evidence = `${within10} of ${notes.length} notes within 10 cents.`;
  } else if (allHeld) {
    name = 'Steady';
    evidence = 'every note held.';
  } else if (isMatch && found > 0) {
    name = 'Found it';
    evidence = `you found ${found} of ${notes.length} notes.`;
  } else if (within10 > 0) {
    name = 'Right on pitch';
    evidence = `${within10} of ${notes.length} notes within 10 cents.`;
  } else {
    name = 'You kept going';
    evidence = `you sang through ${notes.length === 0 ? 'the run' : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}. Every run trains your ear and voice.`;
  }
  return { id: 'positive', name, evidence };
}

/**
 * What to work on after one run: at most 2 areas, the furthest over their threshold first (table order breaks ties).
 * At Learn level, one. A clean run gets its best point instead. Never empty.
 */
export function runFocus(run: RunRecord, opts: Omit<AnalyseOptions, 'minimums'> = {}): FocusItem[] {
  const { stats } = analyse([run], { ...opts, minimums: RUN_MINIMUMS });
  const items = focusFromStats(stats, run.level === 'learn' ? 1 : MAX_FOCUS);
  return items.length === 0 ? [positiveLine(run)] : items;
}

/** The flagged stats as focus items, worst first (table order breaks ties), at most `max`. */
export function focusFromStats(stats: CategoryStat[], max: number): FocusItem[] {
  const order = (id: CategoryId) => CATEGORIES.findIndex((c) => c.id === id);
  return stats
    .filter((s) => s.flagged)
    .sort((a, b) => b.excess - a.excess || order(a.id) - order(b.id))
    .slice(0, max)
    .map((s) => {
      const info = categoryInfo(s.id);
      return { id: s.id, name: info.name, evidence: evidenceOf(s), tip: info.tip, lessonId: info.lessonId };
    });
}
