import { z } from 'zod';
import { migrateProgress, storedDataBaseSchema, type ProgressMap, type StoredData } from './schema';

/**
 * The part of StoredData a profile carries. The latency offset belongs to the device.
 * Progress written before version 2 (no proofs) is migrated when read.
 */
export const profileDataSchema = z
  .object({
    range: storedDataBaseSchema.shape.range,
    progress: storedDataBaseSchema.shape.progress,
    importedLessons: storedDataBaseSchema.shape.importedLessons,
  })
  .transform(
    (d): ProfileData => ({ range: d.range, progress: migrateProgress(d.progress), importedLessons: d.importedLessons }),
  );
export interface ProfileData {
  range: StoredData['range'];
  progress: ProgressMap;
  importedLessons: unknown[];
}

export const PROFILE_ID_PATTERN = /^[a-z0-9-]{1,40}$/;
export const MAX_NAME_LENGTH = 40;

export const profileFileSchema = z.object({
  profileVersion: z.literal(1),
  id: z.string().regex(PROFILE_ID_PATTERN),
  name: z.string().min(1).max(MAX_NAME_LENGTH),
  createdAt: z.string(),
  updatedAt: z.string(),
  data: profileDataSchema,
});
export type ProfileFile = z.infer<typeof profileFileSchema>;

export interface ProfileSummary {
  id: string;
  name: string;
  updatedAt: string;
  range: { low: string; high: string } | null;
  passedCount: number;
}

export function isValidProfileId(id: string): boolean {
  return PROFILE_ID_PATTERN.test(id);
}

/** Lower case, spaces to "-", only [a-z0-9-], at most 40 characters. May be empty. */
export function nameToId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40);
}

/** Trimmed name, or null when it is not 1–40 characters or has nothing usable for an id. */
export function cleanName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > MAX_NAME_LENGTH) return null;
  return nameToId(trimmed) ? trimmed : null;
}

export function dataFromStored(s: Pick<StoredData, 'range' | 'progress' | 'importedLessons'>): ProfileData {
  return { range: s.range, progress: s.progress, importedLessons: s.importedLessons };
}

export const FRESH_DATA: ProfileData = { range: null, progress: {}, importedLessons: [] };
