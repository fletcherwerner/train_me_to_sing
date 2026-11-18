import { create } from 'zustand';

const KEY = 'tmts.notice.stage1';
export const STAGE1_NOTICE_TEXT = 'Stage 1 has been rebuilt. Your Stage 2 and 3 progress is kept.';

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === 'pending';
  } catch {
    return false;
  }
}

export const useNotices = create<{ stage1Rebuilt: boolean }>(() => ({ stage1Rebuilt: read() }));

/** Called when old Stage 1 progress was dropped. Shown once on Home, until dismissed. */
export function flagStage1Rebuilt(): void {
  try {
    localStorage.setItem(KEY, 'pending');
  } catch {
    /* the notice still shows this visit */
  }
  useNotices.setState({ stage1Rebuilt: true });
}

export function dismissStage1Notice(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
  useNotices.setState({ stage1Rebuilt: false });
}
