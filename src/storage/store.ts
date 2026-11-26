import { create } from 'zustand';
import { dropLegacyProgress, loadData, saveData, type StoredData } from './schema';
import { flagStage1Rebuilt } from './notices';
import { LEARN_PASSES_TO_UNLOCK, learnPassesOf, maxLevel, unlockedBy } from './level';
import { getFileSync } from './fileSync';
import { todayString } from './today';
import { addProof, isMastered } from '../core/progress/mastery';
import { afterReview, initialReview, isDue } from '../core/progress/review';
import type { Level } from '../core/session/sessionMachine';
import { mergeData, replaceData } from './exportImport';
import type { AttemptResult } from '../core/scoring/types';
import type { Lesson } from '../content/types';
import { addSeconds, appendRun } from '../core/insights/history';
import { EMPTY_HISTORY, type RunRecord } from '../core/insights/types';

/** Extra facts about an attempt, for lessons that are mastered over two days and two keys. */
export interface AttemptContext {
  /** The lesson uses the mastery rule (Stage 1 units B–D and built-in Stages 2–3). */
  mastery: boolean;
  /** The key (tonic MIDI) the attempt was sung in. */
  tonicMidi?: number;
  /** Only one key fits the student's range, so one key is enough. */
  singleKey?: boolean;
  /** The lesson's stage. In Stage 1, two Learn passes unlock Practise; elsewhere one does. */
  stage?: 1 | 2 | 3;
}

interface AppStore extends StoredData {
  /** True when the last write to storage failed. */
  saveFailed: boolean;
  setRange: (range: StoredData['range']) => void;
  /**
   * `level` is given for lessons with feedback levels: the level the attempt was made at.
   * `run` is the finished run's log entry; it is written in the same save as the progress.
   */
  recordAttempt: (lessonId: string, result: AttemptResult, level?: Level, ctx?: AttemptContext, run?: RunRecord) => void;
  /** Logs a finished run that has no attempt to record (a warm-up). */
  logRun: (run: RunRecord) => void;
  /** Adds practice time to a day. */
  addPracticeSeconds: (date: string, seconds: number) => void;
  /** Clears lesson progress and the run history. The range is kept. */
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
  const { version, range, settings, progress, importedLessons, history } = s;
  return { version, range, settings, progress, importedLessons, history };
}

export const useAppStore = create<AppStore>((set, get) => {
  const commit = (patch: Partial<StoredData>) => {
    const updated: StoredData = { ...snapshot(get()), ...patch };
    const ok = saveData(updated);
    if (ok) getFileSync()?.queue(updated);
    set({ ...updated, saveFailed: !ok });
  };
  return {
    ...loadData(),
    saveFailed: false,
    setRange: (range) => commit({ range }),
    recordAttempt: (lessonId, result, level, ctx, run) => {
      const progress = get().progress;
      const old = progress[lessonId];
      const today = todayString();
      let proofs = old?.proofs ?? [];
      let review = old?.review ?? null;
      let passed: boolean;
      if (ctx?.mastery) {
        // Mastery lessons: a pass at Prove (or any pass, where there are no levels) is a proof. Mastered = two days, two keys.
        const isProve = level === undefined || level === 'prove';
        const wasMastered = old?.passed ?? false;
        if (result.passed && isProve) proofs = addProof(proofs, { date: today, tonicMidi: ctx.tonicMidi ?? -1, score: result.score });
        passed = wasMastered || isMastered({ proofs }, ctx.singleKey ?? false);
        if (wasMastered && review && isProve && isDue(review, today)) review = afterReview(review, result.passed, today);
        else if (!wasMastered && passed) review = initialReview(today);
      } else {
        // Lessons with levels: only a pass at Prove passes the lesson; a pass below it unlocks the next level.
        passed = level ? (old?.passed ?? false) || (result.passed && level === 'prove') : (old?.passed ?? false) || result.passed;
      }
      // Stage 1: a Learn pass counts toward Practise, and two are needed. Other lessons unlock after one pass.
      const countsLearn = level === 'learn' && ctx?.stage === 1;
      const learnPasses = countsLearn && result.passed ? learnPassesOf(old) + 1 : old?.learnPasses;
      let reached: Level | undefined = level;
      if (level && result.passed) {
        reached = countsLearn && (learnPasses ?? 0) < LEARN_PASSES_TO_UNLOCK ? 'learn' : unlockedBy(level);
      }
      const unlocked = level && reached ? maxLevel(old?.level, reached) : undefined;
      commit({
        progress: {
          ...progress,
          [lessonId]: {
            attempts: (old?.attempts ?? 0) + 1,
            bestScore: Math.max(old?.bestScore ?? 0, result.score),
            ...(old?.bestAccuracy !== undefined || result.accuracy !== undefined
              ? { bestAccuracy: Math.max(old?.bestAccuracy ?? 0, result.accuracy ?? 0) }
              : {}),
            passed,
            lastAttemptAt: new Date().toISOString(),
            ...(unlocked ? { level: unlocked } : {}),
            ...(learnPasses !== undefined ? { learnPasses } : {}),
            proofs,
            review,
          },
        },
        ...(run ? { history: appendRun(get().history ?? EMPTY_HISTORY, run, run.date) } : {}),
      });
    },
    logRun: (run) => commit({ history: appendRun(get().history ?? EMPTY_HISTORY, run, run.date) }),
    addPracticeSeconds: (date, seconds) => {
      if (!(seconds > 0)) return;
      commit({ history: addSeconds(get().history ?? EMPTY_HISTORY, date, seconds) });
    },
    resetProgress: () => commit({ progress: {}, history: EMPTY_HISTORY }),
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
