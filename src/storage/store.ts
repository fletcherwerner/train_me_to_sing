import { create } from 'zustand';
import { loadData, saveData, type StoredData } from './schema';
import type { AttemptResult } from '../core/scoring/types';

interface AppStore extends StoredData {
  setRange: (range: StoredData['range']) => void;
  recordAttempt: (lessonId: string, result: AttemptResult) => void;
  resetProgress: () => void;
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
  };
});
