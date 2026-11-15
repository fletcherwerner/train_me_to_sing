import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockStorage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mockStorage.get(k) ?? null,
  setItem: (k: string, v: string) => mockStorage.set(k, v),
  removeItem: (k: string) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
});

import { useAppStore } from './store';
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

  it('persists and reset clears progress only', () => {
    useAppStore.getState().recordAttempt('a', res(1, true));
    expect(JSON.parse(mockStorage.get('tmts.v1')!).progress.a.passed).toBe(true);
    useAppStore.getState().resetProgress();
    expect(useAppStore.getState().progress).toEqual({});
    expect(useAppStore.getState().range).not.toBeNull();
  });
});
