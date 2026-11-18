import { z } from 'zod';
import { flagStage1Rebuilt } from './notices';

/**
 * Zod schema for StoredData as defined in the architecture file.
 * Defaults: range: null, settings.latencyOffsetMs: 0, progress: {}, importedLessons: [].
 */

const studentRangeSchema = z.object({
  lowMidi: z.number().int(),
  highMidi: z.number().int(),
});

const storedProgressSchema = z.record(
  z.string(),
  z.object({
    passed: z.boolean(),
    bestScore: z.number(),
    attempts: z.number().int(),
    lastAttemptAt: z.string(),
    /** Highest unlocked feedback level, for lessons with levels. Absent on older data and on other lessons. */
    level: z.enum(['learn', 'practise', 'prove']).optional(),
  }),
);

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

export const storedDataSchema = z.object({
  version: z.literal(1),
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
  progress: storedProgressSchema,
  importedLessons: z.array(z.any()),
});

export type StoredData = z.infer<typeof storedDataSchema>;

const DEFAULTS: StoredData = {
  version: 1,
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
