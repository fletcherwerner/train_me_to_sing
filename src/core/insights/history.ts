import { addDays } from '../progress/dates';
import type { History, RunRecord } from './types';

/** Runs this recent keep their per-note numbers. */
export const FULL_DETAIL_DAYS = 56; // 8 weeks
/** The log never holds more runs than this; the oldest go first. */
export const MAX_RUNS = 3000;

/** Drops `notes` from runs older than 8 weeks (before `today`), then caps the log. Pure. */
export function prune(history: History, today: string): History {
  const cutoff = addDays(today, -FULL_DETAIL_DAYS);
  let runs = history.runs.map((r) => {
    if (r.date >= cutoff || r.notes === undefined) return r;
    const { notes: _dropped, ...rest } = r;
    void _dropped;
    return rest;
  });
  if (runs.length > MAX_RUNS) runs = runs.slice(runs.length - MAX_RUNS);
  return { ...history, runs };
}

/** Appends a finished run and prunes. Pure. */
export function appendRun(history: History, run: RunRecord, today: string): History {
  return prune({ ...history, runs: [...history.runs, run] }, today);
}

/** Adds practice seconds to a day. Pure. */
export function addSeconds(history: History, date: string, seconds: number): History {
  if (!(seconds > 0)) return history;
  const old = history.days[date]?.seconds ?? 0;
  return { ...history, days: { ...history.days, [date]: { seconds: old + seconds } } };
}

/** Union of runs by id (the local copy wins), oldest first; the larger `seconds` per day. */
export function mergeHistory(a: History, b: History, today: string): History {
  const seen = new Set<string>();
  const runs: RunRecord[] = [];
  for (const r of [...a.runs, ...b.runs]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    runs.push(r);
  }
  runs.sort((x, y) => (x.endedAt < y.endedAt ? -1 : x.endedAt > y.endedAt ? 1 : 0));
  const days: History['days'] = { ...a.days };
  for (const [d, v] of Object.entries(b.days)) {
    days[d] = { seconds: Math.max(days[d]?.seconds ?? 0, v.seconds) };
  }
  return prune({ runs, days }, today);
}
