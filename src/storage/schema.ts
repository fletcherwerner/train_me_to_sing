import { z } from 'zod';

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
  }),
);

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
    return parsed;
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
