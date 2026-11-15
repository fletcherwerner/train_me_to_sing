import { describe, expect, it } from 'vitest';
import { INITIAL_SESSION, reduce, type SessionEvent, type SessionState } from './sessionMachine';
import type { AttemptResult } from '../scoring/types';

const result = (score: number): AttemptResult => ({ notes: [], score, passed: score >= 0.8 });
const run = (s: SessionState, ...events: SessionEvent[]) => events.reduce(reduce, s);

describe('sessionMachine', () => {
  it('full happy path', () => {
    let s = run(INITIAL_SESSION, { type: 'BEGIN' });
    expect(s).toMatchObject({ step: 'iDo', activity: 'idle' });
    s = run(s, { type: 'RUN' }, { type: 'RUN_ENDED' });
    expect(s).toMatchObject({ activity: 'finished', iDoPlays: 1 });
    s = run(s, { type: 'NEXT' });
    expect(s.step).toBe('weDo');
    s = run(s, { type: 'RUN' }, { type: 'RUN_ENDED', result: result(0.6) }, { type: 'NEXT' });
    expect(s.step).toBe('youDo');
    expect(s.weDoResult?.score).toBe(0.6);
    s = run(s, { type: 'RUN' }, { type: 'RUN_ENDED', result: result(1) }, { type: 'SHOW_RESULTS' });
    expect(s.step).toBe('results');
    expect(s.youDoResult?.score).toBe(1);
  });

  it('NEXT from iDo before any play is ignored', () => {
    const s = run(INITIAL_SESSION, { type: 'BEGIN' });
    expect(reduce(s, { type: 'NEXT' })).toBe(s);
  });

  it('STOP returns to idle without a result', () => {
    const w = run({ ...INITIAL_SESSION, step: 'weDo' }, { type: 'RUN' }, { type: 'STOP' });
    expect(w.activity).toBe('idle');
    expect(w.weDoResult).toBeNull();
    expect(w.iDoPlays).toBe(0);
  });

  it('BACK_TO and NEXT during running are ignored', () => {
    const s = run(INITIAL_SESSION, { type: 'BEGIN' }, { type: 'RUN' });
    expect(reduce(s, { type: 'BACK_TO', step: 'iDo' })).toBe(s);
    expect(reduce(s, { type: 'NEXT' })).toBe(s);
  });

  it('We do result never sets youDoResult', () => {
    const s = run({ ...INITIAL_SESSION, step: 'weDo' }, { type: 'RUN' }, { type: 'RUN_ENDED', result: result(1) });
    expect(s.weDoResult).not.toBeNull();
    expect(s.youDoResult).toBeNull();
  });

  it('results can go back to iDo and youDo', () => {
    const s = run(
      { ...INITIAL_SESSION, step: 'youDo' },
      { type: 'RUN' },
      { type: 'RUN_ENDED', result: result(0.2) },
      { type: 'SHOW_RESULTS' },
    );
    expect(run(s, { type: 'BACK_TO', step: 'youDo' })).toMatchObject({ step: 'youDo', activity: 'idle' });
    expect(run(s, { type: 'BACK_TO', step: 'iDo' }).step).toBe('iDo');
  });

  it('invalid events return the state unchanged', () => {
    expect(reduce(INITIAL_SESSION, { type: 'RUN' })).toBe(INITIAL_SESSION);
    expect(reduce(INITIAL_SESSION, { type: 'SHOW_RESULTS' })).toBe(INITIAL_SESSION);
    const s = run(INITIAL_SESSION, { type: 'BEGIN' });
    expect(reduce(s, { type: 'RUN_ENDED' })).toBe(s);
    expect(reduce(s, { type: 'SHOW_RESULTS' })).toBe(s);
  });
});
