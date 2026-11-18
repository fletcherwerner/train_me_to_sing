import { beforeEach, describe, expect, it } from 'vitest';
import { loadData, saveData, storedDataSchema } from './schema';
import { parseImport, exportData } from './exportImport';
import { profileFileSchema } from './profileFormat';
import { useAppStore } from './store';
import type { AttemptResult } from '../core/scoring/types';

const pass: AttemptResult = { notes: [], score: 0.9, passed: true };
const fail: AttemptResult = { notes: [], score: 0.3, passed: false };

const v1Entry = (passed: boolean) => ({ passed, bestScore: 0.9, attempts: 2, lastAttemptAt: '2026-11-10T09:00:00.000Z' });
const v1Data = () => ({
  version: 1,
  range: { lowMidi: 45, highMidi: 64, assessedAt: '2026-11-01T00:00:00.000Z' },
  settings: { latencyOffsetMs: 0 },
  progress: {
    's1a-01': v1Entry(true),
    's1b-01': { ...v1Entry(true), level: 'prove' },
    's1b-02': v1Entry(false),
    's2-01': v1Entry(true),
    's2-02': v1Entry(false),
    's3-01': v1Entry(true),
  },
  importedLessons: [],
});

function setToday(date: string) {
  window.location.hash = `#/?today=${date}`;
}

beforeEach(() => {
  localStorage.clear();
  setToday('2026-11-20');
  useAppStore.setState({ progress: {}, saveFailed: false });
});

describe('version 1 data becomes version 2', () => {
  it('loads from storage: Stage 2–3 passes become one unknown-key proof, the rest get no proofs', () => {
    localStorage.setItem('tmts.v1', JSON.stringify(v1Data()));
    const d = loadData();
    expect(d.version).toBe(2);
    expect(d.progress['s2-01']).toMatchObject({
      passed: false,
      proofs: [{ date: '2026-11-10', tonicMidi: -1, score: 0.9 }],
      review: null,
    });
    expect(d.progress['s3-01'].proofs).toHaveLength(1);
    expect(d.progress['s2-02']).toMatchObject({ passed: false, proofs: [], review: null });
    // Stage 1 passes are kept as they were.
    expect(d.progress['s1a-01']).toMatchObject({ passed: true, proofs: [], review: null });
    expect(d.progress['s1b-01']).toMatchObject({ passed: true, level: 'prove', proofs: [], review: null });
    expect(d.progress['s1b-02']).toMatchObject({ passed: false, proofs: [] });
  });

  it('is written back as version 2 and loads unchanged', () => {
    localStorage.setItem('tmts.v1', JSON.stringify(v1Data()));
    const first = loadData();
    saveData(first);
    expect(JSON.parse(localStorage.getItem('tmts.v1') as string).version).toBe(2);
    expect(loadData()).toEqual(first);
  });

  it('imports a version 1 export file and writes version 2 on export', async () => {
    const r = parseImport(JSON.stringify({ ...v1Data(), exportedAt: '2026-11-10' }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.version).toBe(2);
    expect(r.data.progress['s2-01'].proofs[0].tonicMidi).toBe(-1);
    const back = JSON.parse(await exportData(r.data).text());
    expect(back.version).toBe(2);
    expect(back.progress['s2-01'].proofs).toHaveLength(1);
  });

  it('migrates a profile file', () => {
    const file = {
      profileVersion: 1,
      id: 'ana',
      name: 'Ana',
      createdAt: 'a',
      updatedAt: 'b',
      data: { range: null, progress: { 's2-01': v1Entry(true), 's1b-01': v1Entry(true) }, importedLessons: [] },
    };
    const parsed = profileFileSchema.parse(file);
    expect(parsed.data.progress['s2-01']).toMatchObject({ passed: false, proofs: [{ tonicMidi: -1 }] });
    expect(parsed.data.progress['s1b-01']).toMatchObject({ passed: true, proofs: [] });
  });

  it('leaves version 2 progress alone', () => {
    const v2 = {
      ...v1Data(),
      version: 2,
      progress: {
        's2-01': { ...v1Entry(true), proofs: [{ date: '2026-11-11', tonicMidi: 50, score: 1 }], review: { step: 1, dueOn: '2026-11-25' } },
      },
    };
    const d = storedDataSchema.parse(v2);
    expect(d.progress['s2-01']).toMatchObject({ passed: true, review: { step: 1, dueOn: '2026-11-25' } });
  });
});

const rec = (id: string, r: AttemptResult, tonic: number, level: 'learn' | 'practise' | 'prove' | undefined = 'prove', singleKey = false) =>
  useAppStore.getState().recordAttempt(id, r, level, { mastery: true, tonicMidi: tonic, singleKey });
const p = (id: string) => useAppStore.getState().progress[id];

describe('recording attempts for mastery lessons', () => {
  it('a Prove pass is one proof: Passed once', () => {
    rec('s1b-01', pass, 50);
    expect(p('s1b-01')).toMatchObject({ passed: false, proofs: [{ date: '2026-11-20', tonicMidi: 50 }], review: null });
  });

  it('a pass below Prove, or a failed Prove, adds no proof', () => {
    rec('s1b-01', pass, 50, 'learn');
    rec('s1b-01', pass, 50, 'practise');
    rec('s1b-01', fail, 50, 'prove');
    expect(p('s1b-01').proofs).toEqual([]);
    expect(p('s1b-01').passed).toBe(false);
  });

  it('a second pass on the same day does not count as a second day', () => {
    rec('s1b-01', pass, 50);
    rec('s1b-01', { ...pass, score: 1 }, 52);
    expect(p('s1b-01').passed).toBe(false);
    expect(p('s1b-01').bestScore).toBe(1);
  });

  it('a second day in the same key is not enough; a new key is', () => {
    rec('s1b-01', pass, 50);
    setToday('2026-11-21');
    rec('s1b-01', pass, 50);
    expect(p('s1b-01').passed).toBe(false);
    setToday('2026-11-22');
    rec('s1b-01', pass, 52);
    expect(p('s1b-01')).toMatchObject({ passed: true, review: { step: 0, dueOn: '2026-11-23' } });
  });

  it('two days is enough when only one key fits', () => {
    rec('s1b-01', pass, 50, 'prove', true);
    setToday('2026-11-21');
    rec('s1b-01', pass, 50, 'prove', true);
    expect(p('s1b-01')).toMatchObject({ passed: true, review: { step: 0, dueOn: '2026-11-22' } });
  });

  it('a legacy proof plus a new-key pass on a later day masters a Stage 2 lesson', () => {
    localStorage.setItem('tmts.v1', JSON.stringify(v1Data()));
    useAppStore.setState({ progress: loadData().progress });
    setToday('2026-11-20');
    rec('s2-01', pass, 48, undefined);
    expect(p('s2-01').passed).toBe(true);
  });

  it('reviews: a pass moves on, a fail goes back to tomorrow, and the lesson stays mastered', () => {
    rec('s1b-01', pass, 50);
    setToday('2026-11-21');
    rec('s1b-01', pass, 52);
    expect(p('s1b-01').review).toEqual({ step: 0, dueOn: '2026-11-22' });
    setToday('2026-11-22');
    rec('s1b-01', pass, 54);
    expect(p('s1b-01').review).toEqual({ step: 1, dueOn: '2026-11-25' });
    setToday('2026-11-25');
    rec('s1b-01', fail, 50);
    expect(p('s1b-01')).toMatchObject({ passed: true, review: { step: 0, dueOn: '2026-11-26' } });
  });

  it('an attempt before the review is due leaves the schedule alone', () => {
    rec('s1b-01', pass, 50);
    setToday('2026-11-21');
    rec('s1b-01', pass, 52);
    rec('s1b-01', fail, 52);
    expect(p('s1b-01').review).toEqual({ step: 0, dueOn: '2026-11-22' });
  });

  it('lessons without the mastery rule keep a single pass', () => {
    useAppStore.getState().recordAttempt('s1a-01', pass);
    expect(p('s1a-01')).toMatchObject({ passed: true, proofs: [], review: null });
  });
});
