import { describe, expect, it } from 'vitest';
import { createSession, INITIAL_SESSION, reduce, type SessionEvent, type SessionState } from './sessionMachine';
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

  describe('feedback levels', () => {
    const doYouDo = (s: SessionState, score: number) =>
      run(s, { type: 'RUN' }, { type: 'RUN_ENDED', result: result(score) }, { type: 'SHOW_RESULTS' });
    const atYouDo = (level: 'learn' | 'practise' | 'prove') => {
      let s = run(createSession(true, level), { type: 'BEGIN' });
      if (s.step === 'iDo') s = { ...s, step: 'youDo' };
      return s;
    };

    it('starts Learn at I do, and Practise and Prove at You do', () => {
      expect(run(createSession(true), { type: 'BEGIN' })).toMatchObject({ level: 'learn', step: 'iDo' });
      expect(run(createSession(true, 'practise'), { type: 'BEGIN' })).toMatchObject({ level: 'practise', step: 'youDo' });
      expect(run(createSession(true, 'prove'), { type: 'BEGIN' })).toMatchObject({ level: 'prove', step: 'youDo' });
    });

    it('Learn -> Practise -> Prove unlock on passes', () => {
      let s = doYouDo(atYouDo('learn'), 1);
      s = run(s, { type: 'ADVANCE' });
      expect(s).toMatchObject({ level: 'practise', step: 'youDo', youDoResult: null, activity: 'idle' });
      s = run(doYouDo(s, 0.9), { type: 'ADVANCE' });
      expect(s).toMatchObject({ level: 'prove', step: 'youDo' });
    });

    it('a failed attempt stays at the level', () => {
      for (const level of ['learn', 'practise', 'prove'] as const) {
        const failed = doYouDo(atYouDo(level), 0.2);
        expect(reduce(failed, { type: 'ADVANCE' })).toBe(failed);
        expect(failed.level).toBe(level);
      }
    });

    it('a pass at Prove does not advance further', () => {
      const s = doYouDo(atYouDo('prove'), 1);
      expect(reduce(s, { type: 'ADVANCE' })).toBe(s);
    });

    it('steps down on request, to Learn at I do', () => {
      const prove = atYouDo('prove');
      const practise = run(prove, { type: 'STEP_DOWN' });
      expect(practise).toMatchObject({ level: 'practise', step: 'youDo' });
      expect(run(practise, { type: 'STEP_DOWN' })).toMatchObject({ level: 'learn', step: 'iDo' });
      expect(reduce(run(practise, { type: 'STEP_DOWN' }), { type: 'STEP_DOWN' }).level).toBe('learn');
    });

    it('does not change level while a run is in progress', () => {
      const running = run(atYouDo('prove'), { type: 'RUN' });
      expect(reduce(running, { type: 'STEP_DOWN' })).toBe(running);
    });

    it('levels off: ADVANCE and STEP_DOWN do nothing and the flow is unchanged', () => {
      const s = doYouDo({ ...INITIAL_SESSION, step: 'youDo' }, 1);
      expect(s.levels).toBe(false);
      expect(reduce(s, { type: 'ADVANCE' })).toBe(s);
      expect(reduce(s, { type: 'STEP_DOWN' })).toBe(s);
      expect(createSession(false, 'prove')).toMatchObject({ levels: false, level: 'learn' });
      expect(run(createSession(false), { type: 'BEGIN' }).step).toBe('iDo');
    });
  });

  describe('guided (Stage 1) flow', () => {
    const guided = (level: 'learn' | 'practise' | 'prove') => createSession(true, level, { guided: true });
    const passedAtYouDo = (s: SessionState) =>
      run({ ...s, step: 'youDo' }, { type: 'RUN' }, { type: 'RUN_ENDED', result: result(1) }, { type: 'SHOW_RESULTS' });

    it('BEGIN at Practise starts at We do; Prove still starts at You do', () => {
      expect(run(guided('practise'), { type: 'BEGIN' })).toMatchObject({ level: 'practise', step: 'weDo' });
      expect(run(guided('prove'), { type: 'BEGIN' })).toMatchObject({ level: 'prove', step: 'youDo' });
      expect(run(guided('learn'), { type: 'BEGIN' }).step).toBe('iDo');
    });

    it('ADVANCE from Learn lands on We do; from Practise on You do', () => {
      const practise = run(passedAtYouDo(guided('learn')), { type: 'ADVANCE' });
      expect(practise).toMatchObject({ level: 'practise', step: 'weDo', youDoResult: null, weDoResult: null });
      const prove = run(passedAtYouDo(practise), { type: 'ADVANCE' });
      expect(prove).toMatchObject({ level: 'prove', step: 'youDo' });
    });

    it('stepping down to Practise also lands on We do', () => {
      const prove = run(guided('prove'), { type: 'BEGIN' });
      expect(run(prove, { type: 'STEP_DOWN' })).toMatchObject({ level: 'practise', step: 'weDo' });
    });

    it('unguided is unchanged', () => {
      expect(run(createSession(true, 'practise'), { type: 'BEGIN' }).step).toBe('youDo');
      expect(run(passedAtYouDo(createSession(true, 'learn')), { type: 'ADVANCE' }).step).toBe('youDo');
      expect(createSession(false, 'learn', { guided: true }).guided).toBe(false);
    });

    it('NEXT from We do works without a perfect run', () => {
      const weDo = run(guided('practise'), { type: 'BEGIN' });
      const missed: AttemptResult = {
        notes: [
          { index: 0, targetMidi: 60, hit: true, medianCents: 0, heldFraction: 1, onsetErrorMs: 0 },
          { index: 1, targetMidi: 64, hit: false, reason: 'silent', medianCents: null, heldFraction: 0, onsetErrorMs: null },
        ],
        score: 0.5,
        passed: false,
      };
      const ran = run(weDo, { type: 'RUN' }, { type: 'RUN_ENDED', result: missed });
      expect(run(ran, { type: 'NEXT' }).step).toBe('youDo');
      expect(run(weDo, { type: 'NEXT' }).step).toBe('youDo');
    });
  });

  it('invalid events return the state unchanged', () => {
    expect(reduce(INITIAL_SESSION, { type: 'RUN' })).toBe(INITIAL_SESSION);
    expect(reduce(INITIAL_SESSION, { type: 'SHOW_RESULTS' })).toBe(INITIAL_SESSION);
    const s = run(INITIAL_SESSION, { type: 'BEGIN' });
    expect(reduce(s, { type: 'RUN_ENDED' })).toBe(s);
    expect(reduce(s, { type: 'SHOW_RESULTS' })).toBe(s);
  });
});
