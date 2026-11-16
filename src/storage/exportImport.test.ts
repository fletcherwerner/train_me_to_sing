import { describe, expect, it } from 'vitest';
import { exportData, exportFileName, mergeData, parseImport, replaceData, summarizeImport } from './exportImport';
import type { StoredData } from './schema';

const base = (over: Partial<StoredData> = {}): StoredData => ({
  version: 1,
  range: { lowMidi: 40, highMidi: 60, assessedAt: '2025-01-01T00:00:00.000Z' },
  settings: { latencyOffsetMs: 0 },
  progress: {},
  importedLessons: [],
  ...over,
});

const p = (passed: boolean, bestScore: number, attempts: number, lastAttemptAt: string) => ({
  passed,
  bestScore,
  attempts,
  lastAttemptAt,
});

describe('mergeData', () => {
  it('merges per lesson: passed if either, best score, summed attempts, later date', () => {
    const local = base({ progress: { a: p(false, 0.5, 2, '2025-02-01'), b: p(true, 0.9, 1, '2025-03-01') } });
    const incoming = base({ progress: { a: p(true, 0.85, 3, '2025-01-01'), b: p(false, 0.4, 4, '2025-04-01') } });
    const m = mergeData(local, incoming);
    expect(m.progress.a).toEqual(p(true, 0.85, 5, '2025-02-01'));
    expect(m.progress.b).toEqual(p(true, 0.9, 5, '2025-04-01'));
  });

  it('keeps lesson ids found on only one side, including unknown ids', () => {
    const local = base({ progress: { a: p(true, 1, 1, 'x') } });
    const incoming = base({ progress: { 'future-99': p(true, 0.8, 1, 'y') } });
    const m = mergeData(local, incoming);
    expect(Object.keys(m.progress).sort()).toEqual(['a', 'future-99']);
    expect(m.progress['future-99']).toEqual(p(true, 0.8, 1, 'y'));
  });

  it("keeps the device's range and settings; never imports latency", () => {
    const local = base({ settings: { latencyOffsetMs: 120, calibratedAt: 'c' } });
    const incoming = base({
      range: { lowMidi: 50, highMidi: 70, assessedAt: 'z' },
      settings: { latencyOffsetMs: 300 },
    });
    const m = mergeData(local, incoming);
    expect(m.range).toEqual(local.range);
    expect(m.settings).toEqual({ latencyOffsetMs: 120, calibratedAt: 'c' });
  });

  it('takes the incoming range when the device has none', () => {
    const incoming = base();
    expect(mergeData(base({ range: null }), incoming).range).toEqual(incoming.range);
  });

  it('unions imported lessons by id', () => {
    const local = base({ importedLessons: [{ id: 'm1', t: 'local' }] });
    const incoming = base({ importedLessons: [{ id: 'm1', t: 'in' }, { id: 'm2' }] });
    const m = mergeData(local, incoming);
    expect(m.importedLessons).toEqual([{ id: 'm1', t: 'local' }, { id: 'm2' }]);
  });
});

describe('replaceData', () => {
  it('replaces everything except the latency offset', () => {
    const local = base({ settings: { latencyOffsetMs: 80 }, progress: { a: p(true, 1, 1, 'x') } });
    const incoming = base({
      range: { lowMidi: 50, highMidi: 70, assessedAt: 'z' },
      settings: { latencyOffsetMs: 300 },
      progress: { b: p(true, 1, 1, 'y') },
    });
    const r = replaceData(local, incoming);
    expect(r.settings.latencyOffsetMs).toBe(80);
    expect(r.range).toEqual(incoming.range);
    expect(Object.keys(r.progress)).toEqual(['b']);
  });
});

describe('export / import', () => {
  it('round-trips progress identically', async () => {
    const data = base({
      progress: { a: p(true, 0.9, 3, '2025-05-05T10:00:00.000Z'), b: p(false, 0.2, 1, '2025-05-06') },
      importedLessons: [{ id: 'm1' }],
      settings: { latencyOffsetMs: 40, calibratedAt: 'c' },
    });
    const text = await exportData(data, new Date('2025-06-01T00:00:00Z')).text();
    expect(JSON.parse(text).exportedAt).toBe('2025-06-01T00:00:00.000Z');
    expect(text).toContain('\n  '); // pretty-printed
    const r = parseImport(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(data);
  });

  it('rejects invalid JSON and wrong-schema files', () => {
    expect(parseImport('not json {').ok).toBe(false);
    expect(parseImport('{"hello":1}').ok).toBe(false);
    expect(parseImport('[]').ok).toBe(false);
    expect(parseImport(JSON.stringify({ ...base(), version: 2 })).ok).toBe(false);
    expect(parseImport(JSON.stringify({ ...base(), progress: { a: { passed: 'yes' } } })).ok).toBe(false);
  });

  it('names the file by date', () => {
    expect(exportFileName(new Date('2025-06-01T12:00:00Z'))).toBe('train-me-to-sing-2025-06-01.json');
  });

  it('summarises range and passed lessons', () => {
    const s = summarizeImport(
      base({
        range: { lowMidi: 40, highMidi: 60, assessedAt: 'a' },
        progress: { a: p(true, 1, 1, 'x'), b: p(false, 1, 1, 'x'), c: p(true, 1, 1, 'x') },
      }),
    );
    expect(s).toBe('Range E2–C4, 2 lessons passed');
  });
});
