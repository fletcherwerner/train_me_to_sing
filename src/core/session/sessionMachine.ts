import type { AttemptResult } from '../scoring/types';

export type Step = 'intro' | 'iDo' | 'weDo' | 'youDo' | 'results';
export type Activity = 'idle' | 'running' | 'finished';
/** Feedback levels for lessons with `levels: true`. Learn has full help; Prove has none. */
export type Level = 'learn' | 'practise' | 'prove';
export const LEVELS: readonly Level[] = ['learn', 'practise', 'prove'];

export interface SessionState {
  /** False keeps the single You do flow (Stages 2-3, imported songs). */
  levels: boolean;
  /** Stage 1 guided flow: a Practise visit starts at We do (one sing-along before the solo). */
  guided: boolean;
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

export function createSession(levels: boolean, level: Level = 'learn', opts: { guided?: boolean } = {}): SessionState {
  return { ...INITIAL_SESSION, levels, level: levels ? level : 'learn', guided: levels && opts.guided === true };
}

/** The step a visit to `level` starts at: Learn at I do, Practise at We do when guided, otherwise You do. */
function entryStep(state: SessionState, level: Level): Step {
  if (!state.levels || level === 'learn') return 'iDo';
  return state.guided && level === 'practise' ? 'weDo' : 'youDo';
}

export const INITIAL_SESSION: SessionState = {
  levels: false,
  guided: false,
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
      // Practise and Prove are You do only (guided Practise starts at We do); earlier steps stay reachable through Back.
      return { ...state, step: entryStep(state, state.level), activity: 'idle' };
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
      return { ...state, level: next, step: entryStep(state, next), activity: 'idle', youDoResult: null, weDoResult: null };
    }
    case 'STEP_DOWN': {
      const prev = LEVELS[LEVELS.indexOf(state.level) - 1];
      if (!state.levels || !prev || running || state.step === 'intro') return state;
      return {
        ...state,
        level: prev,
        step: entryStep(state, prev),
        activity: 'idle',
        youDoResult: null,
        weDoResult: null,
      };
    }
  }
}
