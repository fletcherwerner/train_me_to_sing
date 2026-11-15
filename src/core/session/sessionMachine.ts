import type { AttemptResult } from '../scoring/types';

export type Step = 'intro' | 'iDo' | 'weDo' | 'youDo' | 'results';
export type Activity = 'idle' | 'running' | 'finished';

export interface SessionState {
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
  | { type: 'SHOW_RESULTS' };

export const INITIAL_SESSION: SessionState = {
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
      return state.step === 'intro' ? { ...state, step: 'iDo', activity: 'idle' } : state;
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
  }
}
