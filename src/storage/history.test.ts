import { beforeEach, describe, expect, it } from 'vitest';
import { loadData, storedDataSchema, type StoredData } from './schema';
import { mergeData, parseImport, exportData, replaceData } from './exportImport';
import { dataFromStored, FRESH_DATA, profileDataSchema } from './profileFormat';
import { useAppStore } from './store';
import { MAX_RUNS } from '../core/insights/history';
import { note, run } from '../core/insights/fixtures';
import type { History } from '../core/insights/types';
import type { AttemptResult } from '../core/scoring/types';

const result: AttemptResult = { notes: [], score: 0.9, passed: true, accuracy: 0.8 };
const stored = (history?: History): StoredData => ({
  version: 2,
  range: null,
  settings: { latencyOffsetMs: 0 },
  progress: {},
  importedLessons: [],
  ...(history ? { history } : {}),
});

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/?today=2026-11-23';
  useAppStore.setState({ progress: {}, history: { runs: [], days: {} }, saveFailed: false });
});

describe('older data', () => {
  it('a stored file with no history loads with an empty one', () => {
    const { history: _h, ...old } = stored({ runs: [], days: {} });
    void _h;
    localStorage.setItem('tmts.v1', JSON.stringify(old));
    expect(loadData().history).toEqual({ runs: [], days: {} });
    expect(storedDataSchema.parse(old).version).toBe(2);
  });
  it('a stored file with history keeps it', () => {
    const h: History = { runs: [run({ date: '2026-11-20', notes: [note(0)] })], days: { '2026-11-20': { seconds: 90 } } };
    localStorage.setItem('tmts.v1', JSON.stringify(stored(h)));
    expect(loadData().history).toEqual(h);
  });
  it('a profile file with no history loads with an empty one', () => {
    const d = profileDataSchema.parse({ range: null, progress: {}, importedLessons: [] });
    expect(d.history).toEqual({ runs: [], days: {} });
  });
});

describe('logRun', () => {
  it('writes the run and the progress in one save', () => {
    const r = run({ date: '2026-11-23', lessonId: 's1b-04' });
    useAppStore.getState().recordAttempt('s1b-04', result, undefined, undefined, r);
    const s = useAppStore.getState();
    expect(s.progress['s1b-04'].attempts).toBe(1);
    expect(s.history?.runs).toEqual([r]);
    const saved = JSON.parse(localStorage.getItem('tmts.v1') as string);
    expect(saved.history.runs).toHaveLength(1);
    expect(saved.progress['s1b-04'].attempts).toBe(1);
  });
  it('logs a run that has no attempt (a warm-up)', () => {
    useAppStore.getState().logRun(run({ date: '2026-11-23', lessonId: 'warmup', kind: 'warmup' }));
    expect(useAppStore.getState().history?.runs).toHaveLength(1);
  });
  it('prunes the notes of runs older than 8 weeks', () => {
    useAppStore.getState().logRun(run({ date: '2026-08-01', notes: [note(0)] }));
    useAppStore.getState().logRun(run({ date: '2026-11-23', notes: [note(0)] }));
    const runs = useAppStore.getState().history!.runs;
    expect(runs[0].notes).toBeUndefined();
    expect(runs[1].notes).toHaveLength(1);
  });
  it('caps the log at 3,000 runs', () => {
    const many = Array.from({ length: MAX_RUNS }, (_, i) => run({ date: '2026-11-23', id: `old${i}` }));
    useAppStore.setState({ history: { runs: many, days: {} } });
    useAppStore.getState().logRun(run({ date: '2026-11-23', id: 'new' }));
    const runs = useAppStore.getState().history!.runs;
    expect(runs).toHaveLength(MAX_RUNS);
    expect(runs[0].id).toBe('old1');
    expect(runs.at(-1)!.id).toBe('new');
  });
  it('adds practice seconds to a day', () => {
    useAppStore.getState().addPracticeSeconds('2026-11-23', 20);
    useAppStore.getState().addPracticeSeconds('2026-11-23', 30);
    expect(useAppStore.getState().history?.days['2026-11-23'].seconds).toBe(50);
  });
});

describe('export and import', () => {
  const a: History = { runs: [run({ date: '2026-11-22', id: 'a' }), run({ date: '2026-11-23', id: 'both' })], days: { '2026-11-22': { seconds: 60 } } };
  const b: History = { runs: [run({ date: '2026-11-23', id: 'both' }), run({ date: '2026-11-21', id: 'b' })], days: { '2026-11-22': { seconds: 200 }, '2026-11-21': { seconds: 40 } } };

  it('export includes the history and import reads it back', async () => {
    const text = await exportData(stored(a)).text();
    const r = parseImport(text);
    expect(r.ok && r.data.history).toEqual(a);
  });
  it('replace takes the incoming history as it is', () => {
    expect(replaceData(stored(a), stored(b)).history).toEqual(b);
  });
  it('replace with a file that has no history gives an empty one', () => {
    expect(replaceData(stored(a), stored()).history).toEqual({ runs: [], days: {} });
  });
  it('merge unions runs by id and takes the larger seconds per day', () => {
    const m = mergeData(stored(a), stored(b)).history!;
    expect(m.runs.map((r) => r.id).sort()).toEqual(['a', 'b', 'both']);
    expect(m.days).toEqual({ '2026-11-22': { seconds: 200 }, '2026-11-21': { seconds: 40 } });
  });
  it('importProgress applies it through the store', () => {
    useAppStore.getState().importProgress(stored(a), 'replace');
    expect(useAppStore.getState().history?.runs).toHaveLength(2);
    useAppStore.getState().importProgress(stored(b), 'merge');
    expect(useAppStore.getState().history?.runs).toHaveLength(3);
  });
});

describe('profiles and reset', () => {
  it('a profile carries its own history, and a fresh profile has none', () => {
    const h: History = { runs: [run({ date: '2026-11-22' })], days: {} };
    expect(dataFromStored({ ...stored(h) }).history).toEqual(h);
    expect(FRESH_DATA.history).toEqual({ runs: [], days: {} });
  });
  it('Reset progress clears the history too', () => {
    useAppStore.getState().logRun(run({ date: '2026-11-23' }));
    useAppStore.getState().addPracticeSeconds('2026-11-23', 30);
    useAppStore.getState().resetProgress();
    expect(useAppStore.getState().history).toEqual({ runs: [], days: {} });
  });
});
