import { create } from 'zustand';
import { loadData, saveData, type StoredData } from './schema';
import { mergeData, replaceData } from './exportImport';
import type { AttemptResult } from '../core/scoring/types';
import type { Lesson } from '../content/types';

interface AppStore extends StoredData {
  setRange: (range: StoredData['range']) => void;
  recordAttempt: (lessonId: string, result: AttemptResult) => void;
  resetProgress: () => void;
  addImportedLesson: (lesson: Lesson) => void;
  /** Removes an imported lesson and its progress. */
  removeImportedLesson: (id: string) => void;
  /** Replace or merge imported data. The device's latency offset is always kept. */
  importProgress: (incoming: StoredData, mode: 'replace' | 'merge') => void;
  /** `calibrated` is true when the value came from the calibration screen. */
  setLatencyOffset: (ms: number, calibrated: boolean) => void;
}

function snapshot(s: AppStore): StoredData {
  const { version, range, settings, progress, importedLessons } = s;
  return { version, range, settings, progress, importedLessons };
}

export const useAppStore = create<AppStore>((set, get) => {
  const commit = (patch: Partial<StoredData>) => {
    const updated: StoredData = { ...snapshot(get()), ...patch };
    saveData(updated);
    set(updated);
  };
  return {
    ...loadData(),
    setRange: (range) => commit({ range }),
    recordAttempt: (lessonId, result) => {
      const progress = get().progress;
      const old = progress[lessonId];
      commit({
        progress: {
          ...progress,
          [lessonId]: {
            attempts: (old?.attempts ?? 0) + 1,
            bestScore: Math.max(old?.bestScore ?? 0, result.score),
            passed: (old?.passed ?? false) || result.passed,
            lastAttemptAt: new Date().toISOString(),
          },
        },
      });
    },
    resetProgress: () => commit({ progress: {} }),
    addImportedLesson: (lesson) => commit({ importedLessons: [...get().importedLessons, lesson] }),
    removeImportedLesson: (id) => {
      const progress = { ...get().progress };
      delete progress[id];
      commit({
        importedLessons: get().importedLessons.filter((l) => (l as { id?: unknown } | null)?.id !== id),
        progress,
      });
    },
    importProgress: (incoming, mode) => {
      const local = snapshot(get());
      commit(mode === 'merge' ? mergeData(local, incoming) : replaceData(local, incoming));
    },
    setLatencyOffset: (ms, calibrated) => {
      const settings = get().settings;
      commit({
        settings: {
          ...settings,
          latencyOffsetMs: ms,
          ...(calibrated ? { calibratedAt: new Date().toISOString() } : {}),
        },
      });
    },
  };
});
