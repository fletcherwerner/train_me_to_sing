import type { NoteRecord, RunRecord } from './types';

/**
 * The focus-area categories. Every threshold lives here, so they can be tuned in one place.
 * Rates are shares (0..1). "Flat" and "sharp" are in cents; the numbers come from the epic's table.
 */
export const THRESHOLDS = {
  /** A note is flat when its median is this many cents below the target (sharp: above). */
  offCents: 25,
  /** flat / sharp / unsteady: share of voiced notes that flags the area. */
  pitchRate: 0.3,
  /** flat must be at least this many times sharp (and the other way round). */
  dominance: 2,
  /** unsteady: held fraction below this, or spread above `spreadCents`. */
  heldBelow: 0.6,
  spreadCents: 40,
  /** sliding: share of voiced notes. */
  slidingRate: 0.25,
  /** high: the top quarter of the range, and how much worse (in points, 0..1) than the other notes. */
  highFraction: 0.25,
  highWorse: 0.2,
  /** leaps: a step of at least this many semitones, sung at least this many semitones smaller. */
  leapSemitones: 3,
  leapShortSemitones: 0.3,
  leapsRate: 0.35,
  /** drift: voiced notes needed in a run, the cents between last-third and first-third medians, and the share of runs. */
  driftMinNotes: 6,
  driftCents: 20,
  driftRate: 0.3,
  /** timing: share of notes with an onset. */
  timingRate: 0.25,
  /** finding: a match target found after this many seconds counts as not found fast enough. */
  findSec: 3,
  findingRate: 0.35,
  /** quiet: share of silent notes (a notice, never a pattern). */
  quietRate: 0.3,
} as const;

export interface Minimums {
  voiced: number;
  high: number;
  leaps: number;
  drift: number;
  timing: number;
  finding: number;
  quiet: number;
}
/** Over a window of days (the Today card, patterns, improvements). */
export const FULL_MINIMUMS: Minimums = { voiced: 8, high: 5, leaps: 5, drift: 3, timing: 8, finding: 4, quiet: 8 };
/** Scaled down for one run, or one day (see runFocus.ts). */
export const RUN_MINIMUMS: Minimums = { voiced: 4, high: 2, leaps: 2, drift: 1, timing: 4, finding: 2, quiet: 4 };

export type CategoryId =
  | 'flat'
  | 'sharp'
  | 'unsteady'
  | 'sliding'
  | 'high'
  | 'leaps'
  | 'drift'
  | 'timing'
  | 'finding';

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  tip: string;
  /** A built-in lesson that practises it, if one fits. */
  lessonId?: string;
}

/** In table order: this also breaks ties. */
export const CATEGORIES: readonly CategoryInfo[] = [
  {
    id: 'flat',
    name: 'Landing flat',
    tip: 'Before each note, hear it in your head, then aim a little higher than feels natural.',
    lessonId: 's1a-02',
  },
  {
    id: 'sharp',
    name: 'Landing sharp',
    tip: 'Before each note, hear it in your head, then let it settle a little lower. Relax your throat.',
    lessonId: 's1a-02',
  },
  {
    id: 'unsteady',
    name: 'Holding steady',
    tip: 'Take a full breath and keep the air steady until the next chip lights.',
    lessonId: 's1a-01',
  },
  {
    id: 'sliding',
    name: 'Sliding into notes',
    tip: 'Hear the note first, then start right on it instead of sliding up or down to it.',
    lessonId: 's1a-03',
  },
  {
    id: 'high',
    name: 'High notes',
    tip: 'Stay relaxed on the high notes: lift the note, not your chin, and keep the air flowing.',
    lessonId: 's1a-02',
  },
  {
    id: 'leaps',
    name: 'Big leaps fall short',
    tip: 'On big jumps, think of the top note before you leave the bottom one, and aim past it.',
    lessonId: 's1b-06',
  },
  {
    id: 'drift',
    name: 'Drifting off over a phrase',
    tip: 'Breathe before each phrase and check the first note again when the piano plays.',
    lessonId: 's1d-03',
  },
  {
    id: 'timing',
    name: 'Starting on time',
    tip: 'Start each note on the click. Think the note one beat before you sing it.',
    lessonId: 's1b-04',
  },
  {
    id: 'finding',
    name: 'Finding the note',
    tip: 'Listen to the note twice, hum it quietly in your head, then sing it.',
    lessonId: 's1a-01',
  },
];

export const QUIET_NOTICE =
  "We often couldn't hear you. Check the mic (Settings › Mic check) and sing out a little more.";

export interface CategoryStat {
  id: CategoryId;
  /** Notes (or leaps, runs, targets) that counted. */
  count: number;
  /** What the rate is over. */
  total: number;
  /** count / total, 0 when total is 0. For `high`: how much worse than the other notes, in share points. */
  rate: number;
  /** Enough data to judge. */
  enough: boolean;
  flagged: boolean;
  /** How far over the threshold, in share points. Only meaningful when flagged. */
  excess: number;
  /** flat / sharp: about this many cents off, over the counted notes. */
  cents?: number;
  /** drift: the direction the voice moved over the phrase. */
  direction?: 'flat' | 'sharp';
  /** high: the rate over the other notes. */
  otherRate?: number;
}

export interface Analysis {
  stats: CategoryStat[];
  /** Silent notes and targets: all counted notes. */
  quiet: { silent: number; total: number; flagged: boolean };
  /** Notes (and targets) with a voiced pitch, not counting wrong octaves. */
  voiced: number;
}

export interface AnalyseOptions {
  minimums?: Minimums;
  /** Timing tolerance (ms) of a lesson. Without it, only the stored early/late reason counts. */
  timingMsOf?: (lessonId: string) => number | undefined;
}

const isMatchNote = (n: NoteRecord) => n.f !== undefined;
const isVoiced = (n: NoteRecord) => n.c !== null && !n.oct && n.r !== 'silent' && n.r !== 'wrong-octave';
const isFlat = (n: NoteRecord) => n.c !== null && n.c <= -THRESHOLDS.offCents;
const isSharp = (n: NoteRecord) => n.c !== null && n.c >= THRESHOLDS.offCents;
/** A match target that was never found has no hold, so its held fraction says nothing about steadiness. */
const isUnsteady = (n: NoteRecord) =>
  !(isMatchNote(n) && n.f === null) &&
  (n.h < THRESHOLDS.heldBelow || n.r === 'wavered' || (n.s !== undefined && n.s > THRESHOLDS.spreadCents));

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const stat = (id: CategoryId, count: number, total: number, min: number, threshold: number, extra: Partial<CategoryStat> = {}): CategoryStat => {
  const rate = total === 0 ? 0 : count / total;
  const enough = total >= min;
  const flagged = enough && rate >= threshold - 1e-9;
  return { id, count, total, rate, enough, flagged, excess: flagged ? rate - threshold : 0, ...extra };
};

/** Does one melody run drift? Returns the direction, or null. Needs `driftMinNotes` voiced notes. */
export function driftOf(notes: NoteRecord[]): 'flat' | 'sharp' | null | undefined {
  const v = notes.filter((n) => isVoiced(n) && !isMatchNote(n));
  if (v.length < THRESHOLDS.driftMinNotes) return undefined; // too short to judge
  const k = Math.floor(v.length / 3);
  const first = median(v.slice(0, k).map((n) => n.c as number));
  const last = median(v.slice(v.length - k).map((n) => n.c as number));
  const diff = last - first;
  if (Math.abs(diff) < THRESHOLDS.driftCents) return null;
  return diff < 0 ? 'flat' : 'sharp';
}

/** Applies every category to the runs. Pure. */
export function analyse(runs: RunRecord[], opts: AnalyseOptions = {}): Analysis {
  const min = opts.minimums ?? FULL_MINIMUMS;
  const T = THRESHOLDS;
  let voiced = 0;
  const flat: number[] = [];
  const sharp: number[] = [];
  let unsteady = 0;
  let sliding = 0;
  let allNotes = 0;
  let silent = 0;
  let highTotal = 0;
  let highBad = 0;
  let otherTotal = 0;
  let otherBad = 0;
  let leaps = 0;
  let leapsShort = 0;
  let driftRuns = 0;
  const driftDirs = { flat: 0, sharp: 0 };
  let timingTotal = 0;
  let timingBad = 0;
  let findTotal = 0;
  let findBad = 0;

  for (const run of runs) {
    const notes = run.notes;
    if (!notes) continue;
    const timingMs = opts.timingMsOf?.(run.lessonId);
    const highFloor = run.range ? run.range.highMidi - (run.range.highMidi - run.range.lowMidi) * T.highFraction : null;
    for (const n of notes) {
      allNotes++;
      if (n.c === null || n.r === 'silent') silent++;
      if (isMatchNote(n)) {
        findTotal++;
        if (n.f === null || (n.f as number) > T.findSec || n.oct) findBad++;
      }
      if (!isVoiced(n)) continue;
      voiced++;
      const f = isFlat(n);
      if (f) flat.push(Math.abs(n.c as number));
      if (isSharp(n)) sharp.push(n.c as number);
      const u = isUnsteady(n);
      if (u) unsteady++;
      if (n.sc) sliding++;
      if (highFloor !== null) {
        if (n.t >= highFloor) {
          highTotal++;
          if (f || u) highBad++;
        } else {
          otherTotal++;
          if (f || u) otherBad++;
        }
      }
      if (n.o !== undefined && n.o !== null) {
        timingTotal++;
        const late = timingMs !== undefined && Math.abs(n.o) > timingMs;
        if (n.r === 'early' || n.r === 'late' || late) timingBad++;
      }
    }
    if (run.kind === 'melody') {
      for (let i = 0; i + 1 < notes.length; i++) {
        const a = notes[i];
        const b = notes[i + 1];
        if (!isVoiced(a) || !isVoiced(b)) continue;
        const target = b.t - a.t;
        if (Math.abs(target) < T.leapSemitones) continue;
        leaps++;
        const sung = b.t + (b.c as number) / 100 - (a.t + (a.c as number) / 100);
        if (Math.sign(target) * sung <= Math.abs(target) - T.leapShortSemitones + 1e-9) leapsShort++;
      }
      const d = driftOf(notes);
      if (d !== undefined) {
        driftRuns++;
        if (d) driftDirs[d]++;
      }
    }
  }

  const flatN = flat.length;
  const sharpN = sharp.length;
  const flatStat = stat('flat', flatN, voiced, min.voiced, T.pitchRate, flatN ? { cents: Math.round(median(flat)) } : {});
  flatStat.flagged = flatStat.flagged && flatN >= T.dominance * sharpN;
  if (!flatStat.flagged) flatStat.excess = 0;
  const sharpStat = stat('sharp', sharpN, voiced, min.voiced, T.pitchRate, sharpN ? { cents: Math.round(median(sharp)) } : {});
  sharpStat.flagged = sharpStat.flagged && sharpN >= T.dominance * flatN;
  if (!sharpStat.flagged) sharpStat.excess = 0;

  const highRate = highTotal === 0 ? 0 : highBad / highTotal;
  const otherRate = otherTotal === 0 ? 0 : otherBad / otherTotal;
  const highEnough = highTotal >= min.high && otherTotal >= 1;
  const highFlagged = highEnough && highRate - otherRate >= T.highWorse - 1e-9;
  const highStat: CategoryStat = {
    id: 'high',
    count: highBad,
    total: highTotal,
    rate: highRate,
    otherRate,
    enough: highEnough,
    flagged: highFlagged,
    excess: highFlagged ? highRate - otherRate - T.highWorse : 0,
  };

  const driftDir = driftDirs.flat >= driftDirs.sharp ? 'flat' : 'sharp';
  const driftCount = driftDirs[driftDir];
  const driftStat = stat('drift', driftCount, driftRuns, min.drift, T.driftRate, { direction: driftDir });

  const stats: CategoryStat[] = [
    flatStat,
    sharpStat,
    stat('unsteady', unsteady, voiced, min.voiced, T.pitchRate),
    stat('sliding', sliding, voiced, min.voiced, T.slidingRate),
    highStat,
    stat('leaps', leapsShort, leaps, min.leaps, T.leapsRate),
    driftStat,
    stat('timing', timingBad, timingTotal, min.timing, T.timingRate),
    stat('finding', findBad, findTotal, min.finding, T.findingRate),
  ];
  const quiet = {
    silent,
    total: allNotes,
    flagged: allNotes >= min.quiet && silent / allNotes >= T.quietRate - 1e-9,
  };
  return { stats, quiet, voiced };
}

export function categoryInfo(id: CategoryId): CategoryInfo {
  return CATEGORIES.find((c) => c.id === id) as CategoryInfo;
}

/** One sentence of evidence for a flagged (or measured) category. */
export function evidenceOf(s: CategoryStat): string {
  const of = (n: number, t: number, what: string) => `${n} of ${t} ${what}`;
  switch (s.id) {
    case 'flat':
      return `${of(s.count, s.total, 'notes were flat')}, by about ${s.cents ?? 0} cents.`;
    case 'sharp':
      return `${of(s.count, s.total, 'notes were sharp')}, by about ${s.cents ?? 0} cents.`;
    case 'unsteady':
      return `${of(s.count, s.total, 'notes wobbled or faded before the end')}.`;
    case 'sliding':
      return `${of(s.count, s.total, 'notes were slid into')}.`;
    case 'high':
      return `${of(s.count, s.total, 'high notes were off')} (${pctText(s.rate)}), against ${pctText(s.otherRate ?? 0)} of the others.`;
    case 'leaps':
      return `${of(s.count, s.total, 'big leaps were sung smaller than the piano played them')}.`;
    case 'drift':
      return `${of(s.count, s.total, `phrases drifted ${s.direction ?? 'flat'} from start to end`)}.`;
    case 'timing':
      return `${of(s.count, s.total, 'notes started early or late')}.`;
    case 'finding':
      return `${of(s.count, s.total, 'notes took more than 3 seconds to find, or were not found')}.`;
  }
}

export const pctText = (x: number): string => `${Math.round(x * 100)}%`;
