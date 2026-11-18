import { describe, expect, it, vi } from 'vitest';
import { loadData, saveData, storedDataSchema, type StoredData } from './schema';

// Mock localStorage
const mockStorage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockStorage.set(key, value),
  removeItem: (key: string) => mockStorage.delete(key),
  get length() { return mockStorage.size; },
  key: (i: number) => {
    const keys = Array.from(mockStorage.keys());
    return keys[i] ?? null;
  },
  clear: () => mockStorage.clear(),
});

function defaults(): StoredData {
  return {
    version: 2,
    range: null,
    settings: { latencyOffsetMs: 0 },
    progress: {},
    importedLessons: [],
  };
}

describe('storage schema', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('returns defaults when no data', () => {
    expect(loadData()).toEqual(defaults());
  });

  it('returns defaults on corrupt JSON', () => {
    mockStorage.set('tmts.v1', 'not json');
    expect(loadData()).toEqual(defaults());
  });

  it('returns defaults on invalid schema', () => {
    mockStorage.set('tmts.v1', JSON.stringify({ version: 2 }));
    expect(loadData()).toEqual(defaults());
  });

  it('round-trips valid data', () => {
    const data: StoredData = {
      ...defaults(),
      range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' },
      progress: { 's1b-01': { passed: true, bestScore: 0.9, attempts: 3, lastAttemptAt: '2025-01-02T00:00:00.000Z', proofs: [], review: null } },
    };
    saveData(data);
    expect(loadData()).toEqual(data);
  });

  it('validates the schema', () => {
    const valid = storedDataSchema.parse(defaults());
    expect(valid.version).toBe(2);
  });
});
