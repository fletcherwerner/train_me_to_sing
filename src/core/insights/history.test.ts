import { describe, expect, it } from 'vitest';
import { addSeconds, appendRun, mergeHistory, MAX_RUNS, prune } from './history';
import { note, run } from './fixtures';
import type { History } from './types';

const empty: History = { runs: [], days: {} };

describe('retention', () => {
  it('keeps notes on runs from the last 8 weeks and drops them from older runs', () => {
    const recent = run({ date: '2026-10-05', notes: [note(0)] }); // 49 days back
    const old = run({ date: '2026-09-20', notes: [note(0)], score: 0.5 }); // 64 days back
    const h = prune({ runs: [old, recent], days: {} }, '2026-11-23');
    expect(h.runs[0].notes).toBeUndefined();
    expect(h.runs[0].score).toBe(0.5);
    expect(h.runs[1].notes).toHaveLength(1);
  });
  it('prunes when a run is logged', () => {
    const old = run({ date: '2026-01-01', notes: [note(0)] });
    const h = appendRun({ runs: [old], days: {} }, run({ date: '2026-11-23', notes: [note(0)] }), '2026-11-23');
    expect(h.runs[0].notes).toBeUndefined();
    expect(h.runs[1].notes).toBeDefined();
  });
  it('caps the log at 3,000 runs, removing the oldest', () => {
    const runs = Array.from({ length: MAX_RUNS + 5 }, (_, i) => run({ date: '2026-11-23', id: `x${i}` }));
    const h = appendRun({ runs, days: {} }, run({ date: '2026-11-23', id: 'last' }), '2026-11-23');
    expect(h.runs).toHaveLength(MAX_RUNS);
    expect(h.runs[0].id).toBe('x6');
    expect(h.runs[MAX_RUNS - 1].id).toBe('last');
  });
});

describe('practice seconds', () => {
  it('adds to a day', () => {
    const h = addSeconds(addSeconds(empty, '2026-11-23', 20), '2026-11-23', 15);
    expect(h.days['2026-11-23'].seconds).toBe(35);
  });
  it('ignores zero or negative time', () => {
    expect(addSeconds(empty, '2026-11-23', 0)).toBe(empty);
  });
});

describe('merge', () => {
  it('unions runs by id and takes the larger seconds per day', () => {
    const a: History = { runs: [run({ date: '2026-11-22', id: 'a' }), run({ date: '2026-11-23', id: 'same' })], days: { '2026-11-22': { seconds: 50 }, '2026-11-23': { seconds: 10 } } };
    const b: History = { runs: [run({ date: '2026-11-23', id: 'same' }), run({ date: '2026-11-21', id: 'b' })], days: { '2026-11-22': { seconds: 90 }, '2026-11-21': { seconds: 5 } } };
    const m = mergeHistory(a, b, '2026-11-23');
    expect(m.runs.map((r) => r.id).sort()).toEqual(['a', 'b', 'same']);
    expect(m.days).toEqual({ '2026-11-22': { seconds: 90 }, '2026-11-23': { seconds: 10 }, '2026-11-21': { seconds: 5 } });
  });
});
