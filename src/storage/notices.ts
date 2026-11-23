import { create } from 'zustand';

const KEY = 'tmts.notice.stage1';
const FILE_KEY = 'tmts.notice.fileUnreadable';
export const FILE_UNREADABLE_TEXT =
  "Your progress file couldn't be read, so the app used its own copy. The unreadable file is kept in Files › Train Me To Sing.";
export const STAGE1_NOTICE_TEXT = 'Stage 1 has been rebuilt. Your Stage 2 and 3 progress is kept.';

function read(key = KEY): boolean {
  try {
    return localStorage.getItem(key) === 'pending';
  } catch {
    return false;
  }
}

export const useNotices = create<{ stage1Rebuilt: boolean; fileUnreadable: boolean }>(() => ({
  stage1Rebuilt: read(),
  fileUnreadable: read(FILE_KEY),
}));

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

/** Called when progress.json could not be read. Shown once on Home, until dismissed. */
export function flagFileUnreadable(): void {
  try {
    localStorage.setItem(FILE_KEY, 'pending');
  } catch {
    /* the notice still shows this visit */
  }
  useNotices.setState({ fileUnreadable: true });
}

export function dismissFileUnreadableNotice(): void {
  try {
    localStorage.removeItem(FILE_KEY);
  } catch {
    /* nothing to clear */
  }
  useNotices.setState({ fileUnreadable: false });
}
