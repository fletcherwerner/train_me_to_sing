import { describe, expect, it } from 'vitest';
import { runFocus } from './runFocus';
import { note, run, times } from './fixtures';

const D = '2026-11-23';

describe('run focus', () => {
  it('names the flat notes with the count and the cents', () => {
    const r = run({ date: D, notes: [note(-25), note(0), note(-25), note(-25), note(0), note(-25)] });
    const [f] = runFocus(r);
    expect(f.id).toBe('flat');
    expect(f.evidence).toBe('4 of 6 notes were flat, by about 25 cents.');
    expect(f.tip).toContain('aim a little higher');
  });
  it('returns at most 2 areas, the furthest over their threshold first', () => {
    // sliding 100% (0.75 over its 25%), flat and unsteady 100% (0.7 over their 30%): a tie, so the table order decides
    const r = run({ date: D, notes: times(6, -30, { h: 0.2, sc: true }) });
    const items = runFocus(r);
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('sliding');
    expect(items[1].id).toBe('flat');
  });
  it('breaks ties in table order', () => {
    // unsteady and sliding each at exactly the same excess: unsteady threshold .3, sliding .25 → make rates differ to tie
    const r = run({ date: D, notes: [...times(2, 0, { h: 0.1 }), ...times(2, 0, { sc: true }), ...times(1, 0), ...times(1, 0)] });
    const ids = runFocus(r).map((f) => f.id);
    // unsteady 2/6 = .333 (excess .033), sliding 2/6 = .333 (excess .083): sliding is further over
    expect(ids).toEqual(['sliding', 'unsteady']);
  });
  it('gives one area at Learn level', () => {
    const r = run({ date: D, level: 'learn', notes: times(6, -30, { h: 0.2, sc: true }) });
    expect(runFocus(r)).toHaveLength(1);
  });
  it('gives a positive line for a clean run', () => {
    const r = run({ date: D, notes: [...times(5, 3), note(-30)] });
    const items = runFocus(r);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('positive');
    expect(items[0].name).toBe('Right on pitch');
    expect(items[0].evidence).toBe('5 of 6 notes within 10 cents.');
  });
  it('says "Steady" when every note was held but none is within 10 cents', () => {
    const r = run({ date: D, notes: times(4, 15) });
    expect(runFocus(r)[0]).toMatchObject({ id: 'positive', name: 'Steady', evidence: 'every note held.' });
  });
  it('never returns an empty box, even for a run with nothing to say', () => {
    expect(runFocus(run({ date: D, notes: [] }))).toHaveLength(1);
    expect(runFocus(run({ date: D, kind: 'warmup' }))).toHaveLength(1);
  });
  it('needs at least 4 voiced notes in the run to judge a pitch area', () => {
    expect(runFocus(run({ date: D, notes: times(3, -40) }))[0].id).toBe('positive');
    expect(runFocus(run({ date: D, notes: times(4, -40) }))[0].id).toBe('flat');
  });
  it('drift needs the run itself to qualify', () => {
    const drifting = run({ date: D, notes: [...times(2, 0), ...times(2, -10), ...times(2, -30)] });
    expect(runFocus(drifting).map((f) => f.id)).toContain('drift');
    const short = run({ date: D, notes: [...times(2, 0), ...times(3, -40)] });
    expect(runFocus(short).map((f) => f.id)).not.toContain('drift');
  });
  it('finds a suggested lesson for finding the note', () => {
    const r = run({
      date: D,
      kind: 'match',
      notes: [note(0, { f: null }), note(0, { f: null }), note(0, { f: 2 }), note(0, { f: 1 })],
    });
    expect(runFocus(r)[0]).toMatchObject({ id: 'finding', lessonId: 's1a-01' });
  });
});
