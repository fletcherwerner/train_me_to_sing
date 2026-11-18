import { beforeEach, describe, expect, it } from 'vitest';
import { dropLegacyProgress, loadData, saveData, type StoredData } from './schema';
import { mergeData, parseImport } from './exportImport';
import { dismissStage1Notice, useNotices } from './notices';
import { useAppStore } from './store';
import type { AttemptResult } from '../core/scoring/types';

const prog = (passed = true) => ({ passed, bestScore: 1, attempts: 1, lastAttemptAt: '2025-01-01' });
const data = (progress: StoredData['progress']): StoredData => ({
  version: 1,
  range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01' },
  settings: { latencyOffsetMs: 0 },
  progress,
  importedLessons: [],
});
const mixed = () =>
  data({
    's1-01': prog(),
    's1-05': prog(),
    's1-08': prog(),
    's1-09': prog(), // not an old Stage 1 id
    's1b-01': prog(),
    's2-01': prog(),
    's3-02': prog(),
  });
const KEPT = ['s1-09', 's1b-01', 's2-01', 's3-02'];

const pass = (score = 1): AttemptResult => ({ notes: [], score, passed: score >= 0.8 });

beforeEach(() => {
  localStorage.clear();
  dismissStage1Notice();
});

describe('old Stage 1 progress is dropped', () => {
  it('dropLegacyProgress removes only s1-01..s1-08', () => {
    const r = dropLegacyProgress(mixed().progress);
    expect(r.dropped).toBe(true);
    expect(Object.keys(r.progress).sort()).toEqual(KEPT);
    expect(dropLegacyProgress({ 's2-01': prog() }).dropped).toBe(false);
  });

  it('on load', () => {
    saveData(mixed());
    const loaded = loadData();
    expect(Object.keys(loaded.progress).sort()).toEqual(KEPT);
    expect(useNotices.getState().stage1Rebuilt).toBe(true);
  });

  it('shows no notice when there was nothing to drop', () => {
    saveData(data({ 's2-01': prog() }));
    loadData();
    expect(useNotices.getState().stage1Rebuilt).toBe(false);
  });

  it('on import', () => {
    const r = parseImport(JSON.stringify(mixed()));
    expect(r.ok && Object.keys(r.data.progress).sort()).toEqual(KEPT);
    expect(useNotices.getState().stage1Rebuilt).toBe(true);
  });

  it('on profile load (replace and merge)', () => {
    useAppStore.setState({ ...data({}), saveFailed: false });
    useAppStore.getState().importProgress(mixed(), 'replace');
    expect(Object.keys(useAppStore.getState().progress).sort()).toEqual(KEPT);
    useAppStore.setState({ ...data({ 's1-02': prog() }), saveFailed: false });
    useAppStore.getState().importProgress(mixed(), 'merge');
    expect(Object.keys(useAppStore.getState().progress).sort()).toEqual(['s1-02', ...KEPT].sort());
  });

  it('the notice can be dismissed and stays dismissed', () => {
    saveData(mixed());
    loadData();
    dismissStage1Notice();
    expect(useNotices.getState().stage1Rebuilt).toBe(false);
    expect(localStorage.getItem('tmts.notice.stage1')).toBeNull();
  });
});

describe('progress levels', () => {
  beforeEach(() => {
    useAppStore.setState({ ...data({}), saveFailed: false });
  });
  const rec = (...args: Parameters<ReturnType<typeof useAppStore.getState>['recordAttempt']>) =>
    useAppStore.getState().recordAttempt(...args);
  const p = () => useAppStore.getState().progress['s1b-04'];

  it('a Learn pass unlocks Practise and a Practise pass unlocks Prove, but neither passes the lesson', () => {
    rec('s1b-04', pass(), 'learn');
    expect(p()).toMatchObject({ level: 'practise', passed: false, attempts: 1 });
    rec('s1b-04', pass(), 'practise');
    expect(p()).toMatchObject({ level: 'prove', passed: false, attempts: 2 });
  });

  it('only a pass at Prove passes the lesson', () => {
    rec('s1b-04', pass(), 'prove');
    expect(p()).toMatchObject({ level: 'prove', passed: true });
  });

  it('a fail keeps the level and never lowers it', () => {
    rec('s1b-04', pass(), 'learn');
    rec('s1b-04', pass(0.2), 'practise');
    expect(p()).toMatchObject({ level: 'practise', passed: false });
    rec('s1b-04', pass(), 'learn');
    expect(p().level).toBe('practise');
    rec('s1b-04', pass(0.2), 'learn');
    expect(p().level).toBe('practise');
  });

  it('a lesson without levels keeps today’s rule and stores no level', () => {
    rec('s2-01', pass());
    expect(useAppStore.getState().progress['s2-01']).toMatchObject({ passed: true });
    expect(useAppStore.getState().progress['s2-01'].level).toBeUndefined();
  });

  it('merging keeps the higher level', () => {
    const a = data({ x: { ...prog(false), level: 'practise' } });
    const b = data({ x: { ...prog(false), level: 'prove' }, y: prog(false) });
    expect(mergeData(a, b).progress.x.level).toBe('prove');
    expect(mergeData(b, a).progress.x.level).toBe('prove');
    expect(mergeData(a, b).progress.y.level).toBeUndefined();
  });
});
