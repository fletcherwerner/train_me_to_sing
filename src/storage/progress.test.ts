import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockStorage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mockStorage.get(k) ?? null,
  setItem: (k: string, v: string) => mockStorage.set(k, v),
  removeItem: (k: string) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
});

import { useAppStore } from './store';
import { storedDataSchema } from './schema';
import type { AttemptResult } from '../core/scoring/types';

const res = (score: number, passed: boolean): AttemptResult => ({ notes: [], score, passed });

describe('recordAttempt', () => {
  beforeEach(() => {
    mockStorage.clear();
    useAppStore.setState({ progress: {}, range: { lowMidi: 40, highMidi: 60, assessedAt: 'x' } });
  });

  it('keeps best score and passed monotonic', () => {
    const { recordAttempt } = useAppStore.getState();
    recordAttempt('a', res(0.6, false));
    expect(useAppStore.getState().progress.a).toMatchObject({ attempts: 1, bestScore: 0.6, passed: false });
    recordAttempt('a', res(1, true));
    recordAttempt('a', res(0.2, false));
    expect(useAppStore.getState().progress.a).toMatchObject({ attempts: 3, bestScore: 1, passed: true });
  });

  it('keeps the best accuracy: first sets it, lower keeps it, higher replaces it', () => {
    const { recordAttempt } = useAppStore.getState();
    const acc = (a: number): AttemptResult => ({ ...res(1, true), accuracy: a });
    recordAttempt('a', acc(0.7));
    expect(useAppStore.getState().progress.a.bestAccuracy).toBe(0.7);
    recordAttempt('a', acc(0.5));
    expect(useAppStore.getState().progress.a.bestAccuracy).toBe(0.7);
    recordAttempt('a', acc(0.9));
    expect(useAppStore.getState().progress.a.bestAccuracy).toBe(0.9);
    expect(JSON.parse(mockStorage.get('tmts.v1')!).progress.a.bestAccuracy).toBe(0.9);
  });

  it('old data without bestAccuracy loads with no best (bestScore is not copied)', () => {
    mockStorage.set(
      'tmts.v1',
      JSON.stringify({
        version: 2,
        range: null,
        settings: { latencyOffsetMs: 0 },
        progress: { a: { passed: true, bestScore: 1, attempts: 1, lastAttemptAt: '2025-01-01', proofs: [], review: null } },
        importedLessons: [],
      }),
    );
    const loaded = storedDataSchema.parse(JSON.parse(mockStorage.get('tmts.v1')!));
    expect(loaded.progress.a.bestAccuracy).toBeUndefined();
    const withBest = storedDataSchema.parse({
      version: 2,
      range: null,
      settings: { latencyOffsetMs: 0 },
      progress: { a: { passed: true, bestScore: 1, bestAccuracy: 0.8, attempts: 1, lastAttemptAt: 'x' } },
      importedLessons: [],
    });
    expect(withBest.progress.a.bestAccuracy).toBe(0.8);
  });

  describe('learnPasses (Stage 1: two Learn passes unlock Practise)', () => {
    const stage1 = { mastery: true, stage: 1 as const };
    const entry = (extra: object) => ({
      passed: false,
      bestScore: 1,
      attempts: 1,
      lastAttemptAt: 'x',
      proofs: [],
      review: null,
      ...extra,
    });

    it('one Learn pass counts and does not unlock; two do', () => {
      const { recordAttempt } = useAppStore.getState();
      recordAttempt('s1b-01', res(1, true), 'learn', stage1);
      expect(useAppStore.getState().progress['s1b-01']).toMatchObject({ learnPasses: 1, level: 'learn' });
      recordAttempt('s1b-01', res(0.2, false), 'learn', stage1);
      expect(useAppStore.getState().progress['s1b-01']).toMatchObject({ learnPasses: 1, level: 'learn' });
      recordAttempt('s1b-01', res(1, true), 'learn', stage1);
      expect(useAppStore.getState().progress['s1b-01']).toMatchObject({ learnPasses: 2, level: 'practise' });
    });

    it('counts Learn passes only, and only in Stage 1', () => {
      const { recordAttempt } = useAppStore.getState();
      recordAttempt('s1b-01', res(1, true), 'practise', stage1);
      expect(useAppStore.getState().progress['s1b-01'].learnPasses).toBeUndefined();
      recordAttempt('s2-01', res(1, true), 'learn', { mastery: true, stage: 2 });
      expect(useAppStore.getState().progress['s2-01']).toMatchObject({ level: 'practise' });
      expect(useAppStore.getState().progress['s2-01'].learnPasses).toBeUndefined();
    });

    it('an older entry already at Practise keeps it', () => {
      useAppStore.setState({ progress: { x: entry({ level: 'practise' }) } });
      useAppStore.getState().recordAttempt('x', res(0.2, false), 'learn', stage1);
      expect(useAppStore.getState().progress.x.level).toBe('practise');
      useAppStore.getState().recordAttempt('x', res(1, true), 'learn', stage1);
      expect(useAppStore.getState().progress.x.level).toBe('practise');
    });

    it('is written and read back', () => {
      useAppStore.getState().recordAttempt('s1b-01', res(1, true), 'learn', stage1);
      const raw = JSON.parse(mockStorage.get('tmts.v1')!);
      expect(raw.progress['s1b-01'].learnPasses).toBe(1);
      expect(storedDataSchema.safeParse(raw).success).toBe(true);
    });
  });

  it('persists and reset clears progress only', () => {
    useAppStore.getState().recordAttempt('a', res(1, true));
    expect(JSON.parse(mockStorage.get('tmts.v1')!).progress.a.passed).toBe(true);
    useAppStore.getState().resetProgress();
    expect(useAppStore.getState().progress).toEqual({});
    expect(useAppStore.getState().range).not.toBeNull();
  });
});
