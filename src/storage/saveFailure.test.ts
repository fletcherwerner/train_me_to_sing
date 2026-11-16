import { describe, expect, it, vi } from 'vitest';

const data = new Map<string, string>();
let failWrites = false;
vi.stubGlobal('localStorage', {
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => {
    if (failWrites) throw new DOMException('full', 'QuotaExceededError');
    data.set(k, v);
  },
  removeItem: (k: string) => data.delete(k),
  clear: () => data.clear(),
});

import { saveData, loadData } from './schema';
import { useAppStore } from './store';

describe('storage write failure', () => {
  it('saveData returns false when setItem throws, true otherwise', () => {
    failWrites = true;
    expect(saveData(loadData())).toBe(false);
    failWrites = false;
    expect(saveData(loadData())).toBe(true);
  });

  it('the store keeps state in memory, sets the flag, and clears it on the next good save', () => {
    failWrites = true;
    useAppStore.getState().setRange({ lowMidi: 40, highMidi: 60, assessedAt: 'now' });
    expect(useAppStore.getState().saveFailed).toBe(true);
    expect(useAppStore.getState().range?.lowMidi).toBe(40);
    failWrites = false;
    useAppStore.getState().setRange({ lowMidi: 41, highMidi: 60, assessedAt: 'now' });
    expect(useAppStore.getState().saveFailed).toBe(false);
    expect(useAppStore.getState().range?.lowMidi).toBe(41);
  });
});
