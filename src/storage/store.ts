import { create } from 'zustand';
import { dropLegacyProgress, loadData, saveData, type StoredData } from './schema';
import { flagStage1Rebuilt } from './notices';
import { maxLevel, unlockedBy } from './level';
import type { Level } from '../core/session/sessionMachine';
import { mergeData, replaceData } from './exportImport';
import type { AttemptResult } from '../core/scoring/types';
import type { Lesson } from '../content/types';

interface AppStore extends StoredData {
  /** True when the last write to storage failed. */
  saveFailed: boolean;
  setRange: (range: StoredData['range']) => void;
  /** `level` is given for lessons with feedback levels: the level the attempt was made at. */
  recordAttempt: (lessonId: string, result: AttemptResult, level?: Level) => void;
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
    const ok = saveData(updated);
    set({ ...updated, saveFailed: !ok });
  };
  return {
    ...loadData(),
    saveFailed: false,
    setRange: (range) => commit({ range }),
    recordAttempt: (lessonId, result, level) => {
      const progress = get().progress;
      const old = progress[lessonId];
      // Lessons with levels: only a pass at Prove passes the lesson; a pass below it unlocks the next level.
      const passed = level ? (old?.passed ?? false) || (result.passed && level === 'prove') : (old?.passed ?? false) || result.passed;
      const unlocked = level ? maxLevel(old?.level, result.passed ? unlockedBy(level) : level) : undefined;
      commit({
        progress: {
          ...progress,
          [lessonId]: {
            attempts: (old?.attempts ?? 0) + 1,
            bestScore: Math.max(old?.bestScore ?? 0, result.score),
            passed,
            lastAttemptAt: new Date().toISOString(),
            ...(unlocked ? { level: unlocked } : {}),
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
    importProgress: (raw, mode) => {
      const local = snapshot(get());
      // A profile file written before E14 may still carry the old Stage 1 progress.
      const cleaned = dropLegacyProgress(raw.progress);
      if (cleaned.dropped) flagStage1Rebuilt();
      const incoming = { ...raw, progress: cleaned.progress };
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
