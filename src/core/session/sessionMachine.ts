import type { AttemptResult } from '../scoring/types';

export type Step = 'intro' | 'iDo' | 'weDo' | 'youDo' | 'results';
export type Activity = 'idle' | 'running' | 'finished';
/** Feedback levels for lessons with `levels: true`. Learn has full help; Prove has none. */
export type Level = 'learn' | 'practise' | 'prove';
export const LEVELS: readonly Level[] = ['learn', 'practise', 'prove'];

export interface SessionState {
  /** False keeps the single You do flow (Stages 2-3, imported songs). */
  levels: boolean;
  /** The level being worked at. Always 'learn' when `levels` is false. */
  level: Level;
  step: Step;
  activity: Activity;
  iDoPlays: number;
  weDoResult: AttemptResult | null; // latest, not saved
  youDoResult: AttemptResult | null;
}

export type SessionEvent =
  | { type: 'BEGIN' }
  | { type: 'RUN' }
  | { type: 'RUN_ENDED'; result?: AttemptResult }
  | { type: 'STOP' }
  | { type: 'NEXT' }
  | { type: 'BACK_TO'; step: 'iDo' | 'weDo' | 'youDo' }
  | { type: 'SHOW_RESULTS' }
  /** After a You do pass below Prove: move up one level (new You do, no old result). */
  | { type: 'ADVANCE' }
  /** Back down one level, any time nothing is running. */
  | { type: 'STEP_DOWN' };

export function createSession(levels: boolean, level: Level = 'learn'): SessionState {
  return { ...INITIAL_SESSION, levels, level: levels ? level : 'learn' };
}

export const INITIAL_SESSION: SessionState = {
  levels: false,
  level: 'learn',
  step: 'intro',
  activity: 'idle',
  iDoPlays: 0,
  weDoResult: null,
  youDoResult: null,
};

export function reduce(state: SessionState, event: SessionEvent): SessionState {
  const running = state.activity === 'running';
  const inRunStep = state.step === 'iDo' || state.step === 'weDo' || state.step === 'youDo';
  switch (event.type) {
    case 'BEGIN':
      if (state.step !== 'intro') return state;
      // Practise and Prove are You do only; I do and We do stay reachable through Back.
      return { ...state, step: state.levels && state.level !== 'learn' ? 'youDo' : 'iDo', activity: 'idle' };
    case 'RUN': {
      if (!inRunStep || running) return state;
      // A new run clears that step's previous result so stale chips never show.
      if (state.step === 'weDo') return { ...state, activity: 'running', weDoResult: null };
      if (state.step === 'youDo') return { ...state, activity: 'running', youDoResult: null };
      return { ...state, activity: 'running' };
    }
    case 'RUN_ENDED': {
      if (!inRunStep || !running) return state;
      const result = event.result ?? null;
      if (state.step === 'iDo') return { ...state, activity: 'finished', iDoPlays: state.iDoPlays + 1 };
      if (state.step === 'weDo') return { ...state, activity: 'finished', weDoResult: result };
      return { ...state, activity: 'finished', youDoResult: result };
    }
    case 'STOP':
      return inRunStep && running ? { ...state, activity: 'idle' } : state;
    case 'NEXT': {
      if (running) return state;
      if (state.step === 'iDo') {
        return state.iDoPlays >= 1 ? { ...state, step: 'weDo', activity: 'idle' } : state;
      }
      if (state.step === 'weDo') return { ...state, step: 'youDo', activity: 'idle' };
      return state;
    }
    case 'BACK_TO':
      if (state.step === 'intro' || running) return state;
      return { ...state, step: event.step, activity: 'idle' };
    case 'SHOW_RESULTS':
      if (state.step === 'youDo' && !running && state.youDoResult) {
        return { ...state, step: 'results' };
      }
      return state;
    case 'ADVANCE': {
      const next = LEVELS[LEVELS.indexOf(state.level) + 1];
      if (!state.levels || !next || running || !state.youDoResult?.passed) return state;
      if (state.step !== 'results' && state.step !== 'youDo') return state;
      return { ...state, level: next, step: 'youDo', activity: 'idle', youDoResult: null, weDoResult: null };
    }
    case 'STEP_DOWN': {
      const prev = LEVELS[LEVELS.indexOf(state.level) - 1];
      if (!state.levels || !prev || running || state.step === 'intro') return state;
      return {
        ...state,
        level: prev,
        step: prev === 'learn' ? 'iDo' : 'youDo',
        activity: 'idle',
        youDoResult: null,
        weDoResult: null,
      };
    }
  }
}
