import { storedDataSchema, type StoredData } from './schema';
import { midiToName } from '../core/music/notes';

/** The full StoredData as pretty JSON plus `exportedAt`. */
export function exportData(data: StoredData, now: Date = new Date()): Blob {
  const payload = { ...data, exportedAt: now.toISOString() };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export function exportFileName(now: Date = new Date()): string {
  return `train-me-to-sing-${now.toISOString().slice(0, 10)}.json`;
}

export type ParseResult = { ok: true; data: StoredData } | { ok: false; error: string };

/** Validates file text against the storage schema. Never throws. */
export function parseImport(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON, so nothing was changed.' };
  }
  const parsed = storedDataSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: 'That file is not a Train Me To Sing export, so nothing was changed.' };
  }
  return { ok: true, data: parsed.data };
}

/** "Range E2–C4, 9 lessons passed" */
export function summarizeImport(data: StoredData): string {
  const passed = Object.values(data.progress).filter((p) => p.passed).length;
  const range = data.range ? `Range ${midiToName(data.range.lowMidi)}–${midiToName(data.range.highMidi)}` : 'No range';
  const attempted = Object.values(data.progress).filter((p) => p.attempts > 0).length;
  return `${range}, ${passed} ${passed === 1 ? 'lesson' : 'lessons'} passed, ${attempted} attempted`;
}

/**
 * Merge `incoming` into `local`.
 * Per lesson: passed if either passed, higher bestScore, summed attempts, later lastAttemptAt.
 * Range and settings: the device's own, unless it has no range (then the incoming range).
 * Imported lessons: union by id (the device's copy wins). latencyOffsetMs is never imported.
 */
export function mergeData(local: StoredData, incoming: StoredData): StoredData {
  const progress: StoredData['progress'] = { ...local.progress };
  for (const [id, b] of Object.entries(incoming.progress)) {
    const a = progress[id];
    progress[id] = a
      ? {
          passed: a.passed || b.passed,
          bestScore: Math.max(a.bestScore, b.bestScore),
          attempts: a.attempts + b.attempts,
          lastAttemptAt: a.lastAttemptAt >= b.lastAttemptAt ? a.lastAttemptAt : b.lastAttemptAt,
        }
      : { ...b };
  }
  const seen = new Set<string>();
  const importedLessons: unknown[] = [];
  for (const l of [...local.importedLessons, ...incoming.importedLessons]) {
    const id = (l as { id?: unknown } | null)?.id;
    if (typeof id === 'string') {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    importedLessons.push(l);
  }
  return {
    version: 1,
    range: local.range ?? incoming.range,
    settings: local.settings,
    progress,
    importedLessons,
  };
}

/** Replace everything with `incoming`, except device-specific settings (latency offset). */
export function replaceData(local: StoredData, incoming: StoredData): StoredData {
  return {
    version: 1,
    range: incoming.range,
    settings: local.settings,
    progress: incoming.progress,
    importedLessons: incoming.importedLessons,
  };
}

/**
 * Saves the export: Web Share with a file when the browser supports it (iOS: Files, AirDrop),
 * otherwise a download link. Returns how it was delivered.
 */
export async function saveExport(data: StoredData, now: Date = new Date()): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = exportData(data, now);
  const name = exportFileName(now);
  const file = new File([blob], name, { type: 'application/json' });
  if (typeof navigator.canShare === 'function' && typeof navigator.share === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Train Me To Sing progress' });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // fall through to a download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
