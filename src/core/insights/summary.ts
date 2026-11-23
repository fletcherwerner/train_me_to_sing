import { addDays } from '../progress/dates';
import { weekDates, weekSeconds, weekStartOf } from './activity';
import {
  CATEGORIES,
  FULL_MINIMUMS,
  RUN_MINIMUMS,
  analyse,
  categoryInfo,
  evidenceOf,
  pctText,
  type AnalyseOptions,
  type CategoryId,
  type CategoryStat,
} from './categories';
import { focusFromStats, runFocus, type FocusItem } from './runFocus';
import type { History, RunRecord } from './types';

/** Window rules and limits for the summaries. Tunable. */
export const SUMMARY = {
  /** Patterns: the long window needs this many voiced notes over this many active days. */
  longDays: 14,
  longNotes: 60,
  longActive: 3,
  /** Patterns: the short window. */
  shortDays: 7,
  shortNotes: 30,
  shortActive: 2,
  maxPatterns: 3,
  /** Improvements: each of the two windows needs this much. */
  compareNotes: 40,
  compareActive: 2,
  /** A rate must fall by this many share points, and by this fraction of its earlier value. */
  dropPoints: 0.1,
  dropFraction: 1 / 3,
  accuracyUp: 0.05,
  maxImprovements: 3,
  /** Today card and best-run marks. */
  maxToday: 2,
  newBestDays: 7,
} as const;

type Opts = Omit<AnalyseOptions, 'minimums'>;

/** Runs with `from <= date <= to`. */
export function runsBetween(history: History, from: string, to: string): RunRecord[] {
  return history.runs.filter((r) => r.date >= from && r.date <= to);
}

const dayCount = (runs: RunRecord[]): number => new Set(runs.map((r) => r.date)).size;

// ---------- Today ----------

export interface NewBest {
  lessonId: string;
  what: 'score' | 'accuracy';
}

export interface TodayCard {
  runCount: number;
  seconds: number;
  lessonIds: string[];
  newBests: NewBest[];
  /** Areas over all of today's runs; below the minimums, the last run's own areas. */
  areas: FocusItem[];
  /** `areas` came from the last run alone. */
  fromLastRun: boolean;
  quiet: boolean;
}

/** A run that beat everything before it for that lesson (or the first of its lesson). */
function newBestsAmong(runs: RunRecord[], earlier: RunRecord[]): NewBest[] {
  const best = new Map<string, { score: number; accuracy: number }>();
  for (const r of earlier) {
    const b = best.get(r.lessonId) ?? { score: -1, accuracy: -1 };
    best.set(r.lessonId, { score: Math.max(b.score, r.score ?? -1), accuracy: Math.max(b.accuracy, r.accuracy ?? -1) });
  }
  const out: NewBest[] = [];
  const mark = (lessonId: string, what: NewBest['what']) => {
    if (!out.some((o) => o.lessonId === lessonId && o.what === what)) out.push({ lessonId, what });
  };
  for (const r of runs) {
    if (r.kind === 'warmup') continue;
    const b = best.get(r.lessonId) ?? { score: -1, accuracy: -1 };
    if (r.score !== undefined && r.score > b.score) mark(r.lessonId, 'score');
    if (r.accuracy !== undefined && r.accuracy > b.accuracy) mark(r.lessonId, 'accuracy');
    best.set(r.lessonId, { score: Math.max(b.score, r.score ?? -1), accuracy: Math.max(b.accuracy, r.accuracy ?? -1) });
  }
  return out;
}

export function todayCard(history: History, today: string, opts: Opts = {}): TodayCard {
  const runs = history.runs.filter((r) => r.date === today);
  const earlier = history.runs.filter((r) => r.date < today);
  const { stats, quiet } = analyse(runs, { ...opts, minimums: FULL_MINIMUMS });
  let areas = focusFromStats(stats, SUMMARY.maxToday);
  let fromLastRun = false;
  if (areas.length === 0 && runs.length > 0) {
    // Below the minimums (or nothing stands out): the last run's own areas, or its best point.
    const last = [...runs].reverse().find((r) => r.notes && r.notes.length > 0) ?? runs[runs.length - 1];
    areas = runFocus(last, opts);
    fromLastRun = true;
  }
  return {
    runCount: runs.length,
    seconds: history.days[today]?.seconds ?? 0,
    lessonIds: [...new Set(runs.filter((r) => r.kind !== 'warmup').map((r) => r.lessonId))],
    newBests: newBestsAmong(runs, earlier),
    areas,
    fromLastRun,
    quiet: quiet.flagged,
  };
}

// ---------- Patterns ----------

export interface PatternItem {
  id: CategoryId;
  name: string;
  evidence: string;
  tip: string;
  lessonId?: string;
  daysFlagged: number;
  daysJudged: number;
  rate: number;
}

export interface Patterns {
  /** 14, 7 or null when there is not enough yet. */
  windowDays: 14 | 7 | null;
  heading: string;
  items: PatternItem[];
  /** When there is no window: how many more active days are needed. */
  moreDaysNeeded: number;
  /** Silent notes were common in the window. */
  quiet: boolean;
  message?: string;
}

export function patterns(history: History, today: string, opts: Opts = {}): Patterns {
  const S = SUMMARY;
  const long = runsBetween(history, addDays(today, 1 - S.longDays), today);
  const short = runsBetween(history, addDays(today, 1 - S.shortDays), today);
  const longA = analyse(long, { ...opts, minimums: FULL_MINIMUMS });
  const shortA = analyse(short, { ...opts, minimums: FULL_MINIMUMS });
  let windowDays: 14 | 7 | null = null;
  let runs: RunRecord[] = [];
  if (longA.voiced >= S.longNotes && dayCount(long) >= S.longActive) {
    windowDays = 14;
    runs = long;
  } else if (shortA.voiced >= S.shortNotes && dayCount(short) >= S.shortActive) {
    windowDays = 7;
    runs = short;
  }
  if (windowDays === null) {
    const needed = Math.max(1, S.shortActive - dayCount(short));
    return {
      windowDays,
      heading: 'Your patterns',
      items: [],
      moreDaysNeeded: needed,
      quiet: false,
      message: `Sing on a few more days to see your patterns (${needed} more active ${needed === 1 ? 'day' : 'days'}).`,
    };
  }
  const { stats, quiet } = analyse(runs, { ...opts, minimums: FULL_MINIMUMS });
  // Per active day, with the minimums scaled to a day.
  const byDay = new Map<string, RunRecord[]>();
  for (const r of runs) byDay.set(r.date, [...(byDay.get(r.date) ?? []), r]);
  const dayStats = [...byDay.values()].map((rs) => analyse(rs, { ...opts, minimums: RUN_MINIMUMS }).stats);
  const items: PatternItem[] = [];
  for (const s of stats) {
    if (!s.flagged) continue;
    const judged = dayStats.map((d) => d.find((x) => x.id === s.id) as CategoryStat).filter((x) => x.enough);
    const flaggedDays = judged.filter((x) => x.flagged).length;
    if (judged.length === 0 || flaggedDays * 2 < judged.length) continue;
    const info = categoryInfo(s.id);
    items.push({
      id: s.id,
      name: info.name,
      evidence: evidenceOf(s),
      tip: info.tip,
      lessonId: info.lessonId,
      daysFlagged: flaggedDays,
      daysJudged: judged.length,
      rate: s.rate,
    });
  }
  const order = (id: CategoryId) => CATEGORIES.findIndex((c) => c.id === id);
  const excess = (id: CategoryId) => stats.find((s) => s.id === id)?.excess ?? 0;
  items.sort((a, b) => excess(b.id) - excess(a.id) || order(a.id) - order(b.id));
  return {
    windowDays,
    heading: windowDays === 14 ? 'Last 2 weeks' : 'Last week',
    items: items.slice(0, S.maxPatterns),
    moreDaysNeeded: 0,
    quiet: quiet.flagged,
    message: items.length === 0 ? 'No habit stands out. Keep singing and check back.' : undefined,
  };
}

// ---------- Improvements ----------

export const KEEP_GOING_TEXT = "Keep going: after about four weeks, this shows what you've improved.";

const UNIT: Record<CategoryId, string> = {
  flat: 'notes',
  sharp: 'notes',
  unsteady: 'notes',
  sliding: 'notes',
  high: 'high notes',
  leaps: 'leaps',
  drift: 'phrases',
  timing: 'notes',
  finding: 'targets',
};

export interface Improvements {
  /** Both windows had enough to compare. */
  comparable: boolean;
  lines: string[];
  /** Category ids behind the first lines, for tests and links. */
  categories: CategoryId[];
  text?: string;
}

const meanAccuracy = (runs: RunRecord[]): number | null => {
  const xs = runs.filter((r) => r.accuracy !== undefined).map((r) => r.accuracy as number);
  return xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;
};

export interface MasteryInfo {
  passed: boolean;
  proofs: { date: string }[];
}

export function improvements(
  history: History,
  today: string,
  progress: Record<string, MasteryInfo | undefined>,
  titleOf: (lessonId: string) => string,
  opts: Opts = {},
): Improvements {
  const S = SUMMARY;
  const recent = runsBetween(history, addDays(today, -14), addDays(today, -1));
  const before = runsBetween(history, addDays(today, -28), addDays(today, -15));
  const a = analyse(recent, { ...opts, minimums: FULL_MINIMUMS });
  const b = analyse(before, { ...opts, minimums: FULL_MINIMUMS });
  const enough = (an: { voiced: number }, rs: RunRecord[]) => an.voiced >= S.compareNotes && dayCount(rs) >= S.compareActive;
  if (!enough(a, recent) || !enough(b, before)) {
    return { comparable: false, lines: [], categories: [], text: KEEP_GOING_TEXT };
  }
  const drops: { id: CategoryId; drop: number; line: string }[] = [];
  for (const s of a.stats) {
    const old = b.stats.find((x) => x.id === s.id) as CategoryStat;
    if (!s.enough || !old.enough) continue;
    const drop = old.rate - s.rate;
    if (drop >= S.dropPoints - 1e-9 && drop >= old.rate * S.dropFraction - 1e-9) {
      drops.push({ id: s.id, drop, line: `${categoryInfo(s.id).name}: ${pctText(old.rate)} of ${UNIT[s.id]} → ${pctText(s.rate)}` });
    }
  }
  drops.sort((x, y) => y.drop - x.drop);
  const top = drops.slice(0, S.maxImprovements);
  const lines = top.map((d) => d.line);
  const accNow = meanAccuracy(recent);
  const accThen = meanAccuracy(before);
  if (accNow !== null && accThen !== null && accNow - accThen >= S.accuracyUp - 1e-9) {
    lines.push(`Your accuracy went from ${pctText(accThen)} to ${pctText(accNow)}`);
  }
  const from = addDays(today, -14);
  const mastered = Object.entries(progress)
    .filter(([, p]) => p?.passed && p.proofs.length > 0 && p.proofs.reduce((m, x) => (x.date > m ? x.date : m), '') >= from)
    .map(([id]) => titleOf(id));
  if (mastered.length > 0) lines.push(`You mastered ${mastered.join(', ')}`);
  const daysNow = dayCount(recent);
  const daysThen = dayCount(before);
  if (daysNow > daysThen) lines.push(`You practised on more days: ${daysNow}, up from ${daysThen}`);
  if (lines.length === 0) {
    const n = dayCount(runsBetween(history, addDays(today, 1 - S.longDays), today));
    return { comparable: true, lines: [`You practised ${n} ${n === 1 ? 'day' : 'days'} in the last two weeks.`], categories: [] };
  }
  return { comparable: true, lines, categories: top.map((d) => d.id) };
}

// ---------- Trend ----------

export interface WeekPoint {
  weekStart: string;
  /** Mean accuracy of the week's runs, 0..1; null when none. */
  accuracy: number | null;
  minutes: number;
}

/** The last `weeks` weeks, oldest first, the current week last. */
export function weeklyTrend(history: History, today: string, weeks = 8): WeekPoint[] {
  const thisWeek = weekStartOf(today);
  const out: WeekPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(thisWeek, -7 * i);
    const end = weekDates(start)[6];
    out.push({
      weekStart: start,
      accuracy: meanAccuracy(runsBetween(history, start, end)),
      minutes: weekSeconds(history, start) / 60,
    });
  }
  return out;
}

// ---------- Best runs ----------

export interface BestRun {
  lessonId: string;
  bestScore: number;
  bestAccuracy?: number;
  newScore: boolean;
  newAccuracy: boolean;
}

/** Lessons with a best score or accuracy, best accuracy first. A personal best set in the last 7 days is marked new. */
export function bestRuns(
  progress: Record<string, { bestScore: number; bestAccuracy?: number } | undefined>,
  history: History,
  today: string,
): BestRun[] {
  const from = addDays(today, 1 - SUMMARY.newBestDays);
  const out: BestRun[] = [];
  for (const [lessonId, p] of Object.entries(progress)) {
    if (!p || (p.bestScore <= 0 && p.bestAccuracy === undefined)) continue;
    const runs = history.runs.filter((r) => r.lessonId === lessonId);
    const recent = runs.filter((r) => r.date >= from);
    const old = runs.filter((r) => r.date < from);
    const max = (rs: RunRecord[], k: 'score' | 'accuracy') => rs.reduce((m, r) => Math.max(m, r[k] ?? -1), -1);
    out.push({
      lessonId,
      bestScore: p.bestScore,
      bestAccuracy: p.bestAccuracy,
      newScore: recent.length > 0 && max(recent, 'score') > max(old, 'score') && max(recent, 'score') >= p.bestScore - 1e-6,
      newAccuracy:
        p.bestAccuracy !== undefined &&
        recent.length > 0 &&
        max(recent, 'accuracy') > max(old, 'accuracy') &&
        max(recent, 'accuracy') >= p.bestAccuracy - 1e-3,
    });
  }
  return out.sort((x, y) => (y.bestAccuracy ?? -1) - (x.bestAccuracy ?? -1) || y.bestScore - x.bestScore);
}

/** "12 min", "<1 min" or "0 min". */
export function formatMinutes(seconds: number): string {
  if (seconds <= 0) return '0 min';
  if (seconds < 60) return '<1 min';
  return `${Math.round(seconds / 60)} min`;
}
