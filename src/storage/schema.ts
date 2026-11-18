import { z } from 'zod';
import { flagStage1Rebuilt } from './notices';
import { isMastered } from '../core/progress/mastery';
import type { Proof } from '../core/progress/types';

/**
 * Zod schema for StoredData (version 2).
 * Defaults: range: null, settings.latencyOffsetMs: 0, progress: {}, importedLessons: [].
 * Version 1 data (and profile files without proofs) is migrated on read; see `migrateProgress`.
 */

const studentRangeSchema = z.object({
  lowMidi: z.number().int(),
  highMidi: z.number().int(),
});

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const proofSchema = z.object({
  /** Local calendar day, YYYY-MM-DD. */
  date: z.string().regex(DATE),
  /** -1 = key unknown (migrated data). */
  tonicMidi: z.number().int(),
  score: z.number(),
});

const reviewSchema = z.object({
  step: z.number().int().min(0),
  dueOn: z.string().regex(DATE),
});

/** One lesson's progress as read from storage or a file: `proofs` and `review` are missing in version 1. */
export const rawProgressEntrySchema = z.object({
  passed: z.boolean(),
  bestScore: z.number(),
  attempts: z.number().int(),
  lastAttemptAt: z.string(),
  /** Highest unlocked feedback level, for lessons with levels. Absent on older data and on other lessons. */
  level: z.enum(['learn', 'practise', 'prove']).optional(),
  /** Prove passes. Absent in version 1. */
  proofs: z.array(proofSchema).optional(),
  /** Spaced review state, set once mastered. Absent in version 1. */
  review: reviewSchema.nullable().optional(),
});

export interface ProgressEntry {
  passed: boolean;
  bestScore: number;
  attempts: number;
  lastAttemptAt: string;
  level?: 'learn' | 'practise' | 'prove';
  proofs: Proof[];
  review: { step: number; dueOn: string } | null;
}
export type ProgressMap = Record<string, ProgressEntry>;

/** Stage 2–3 built-in lessons: one pass counted before E15, so they need one more passing day. */
const SINGLE_PASS_MASTERY_ID = /^s[23]-/;

/**
 * Version 1 -> 2, per lesson. A passed Stage 2–3 lesson becomes one proof with an unknown key
 * (so it needs one more passing day). Everything else gets no proofs and no review.
 * Entries that already have `proofs` are left alone.
 */
export function migrateProgress(progress: Record<string, z.infer<typeof rawProgressEntrySchema>>): ProgressMap {
  const out: ProgressMap = {};
  for (const [id, p] of Object.entries(progress)) {
    if (p.proofs !== undefined) {
      out[id] = { ...p, proofs: p.proofs, review: p.review ?? null };
    } else if (p.passed && SINGLE_PASS_MASTERY_ID.test(id)) {
      const proofs: Proof[] = [{ date: p.lastAttemptAt.slice(0, 10), tonicMidi: -1, score: p.bestScore }];
      out[id] = { ...p, passed: isMastered({ proofs }), proofs, review: null };
    } else {
      out[id] = { ...p, proofs: [], review: null };
    }
  }
  return out;
}

/** Ids of the Stage 1 lessons that E14 replaced. Their progress is dropped. */
export const LEGACY_STAGE1_ID = /^s1-0[1-8]$/;

/** Removes progress for the old Stage 1 lessons. `dropped` is true when something was removed. */
export function dropLegacyProgress<T extends Record<string, unknown>>(progress: T): { progress: T; dropped: boolean } {
  const ids = Object.keys(progress).filter((id) => LEGACY_STAGE1_ID.test(id));
  if (ids.length === 0) return { progress, dropped: false };
  const kept = { ...progress };
  for (const id of ids) delete kept[id];
  return { progress: kept, dropped: true };
}

/** What a stored file holds, before migration. */
export const storedDataBaseSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  range: z
    .object({
      ...studentRangeSchema.shape,
      assessedAt: z.string(),
    })
    .nullable(),
  settings: z.object({
    latencyOffsetMs: z.number(),
    /** ISO time of the last calibration; absent until the student has calibrated. */
    calibratedAt: z.string().optional(),
  }),
  progress: z.record(z.string(), rawProgressEntrySchema),
  importedLessons: z.array(z.any()),
});

/** Parses version 1 or 2 data and returns version 2. */
export const storedDataSchema = storedDataBaseSchema.transform(
  (d): StoredData => ({
    version: 2,
    range: d.range,
    settings: d.settings,
    progress: migrateProgress(d.progress),
    importedLessons: d.importedLessons,
  }),
);

export interface StoredData {
  version: 2;
  range: { lowMidi: number; highMidi: number; assessedAt: string } | null;
  settings: { latencyOffsetMs: number; calibratedAt?: string };
  progress: ProgressMap;
  importedLessons: unknown[];
}

const DEFAULTS: StoredData = {
  version: 2,
  range: null,
  settings: { latencyOffsetMs: 0 },
  progress: {},
  importedLessons: [],
};

const STORAGE_KEY = 'tmts.v1';

export function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULTS;
    const parsed = storedDataSchema.parse(JSON.parse(raw));
    const { progress, dropped } = dropLegacyProgress(parsed.progress);
    const cleaned = { ...parsed, progress };
    if (dropped) {
      // Write the cleaned copy back so the old entries are gone for good and the notice is not raised again.
      saveData(cleaned);
      flagStage1Rebuilt();
    }
    return cleaned;
  } catch {
    return DEFAULTS;
  }
}

/** Returns false when the write failed (full or blocked storage). */
export function saveData(data: StoredData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
