import { getFileStore, type FileStore } from './fileStore';
import { getFileSync, PROGRESS_FILE, type FileSync } from './fileSync';
import { dropLegacyProgress, loadData, saveData, storedDataSchema } from './schema';
import { flagFileUnreadable, flagStage1Rebuilt } from './notices';
import { localDateString } from '../core/progress/dates';

export const LAUNCH_WAIT_MS = 2000;
const STORAGE_KEY = 'tmts.v1';

/**
 * Brings localStorage and progress.json into line before the store is created.
 * The file wins when it is valid. Resolves when done; never rejects.
 * `isStale` is true once the app has stopped waiting; a late result is then ignored.
 */
export async function syncAtLaunch(
  fs: FileStore,
  sync: FileSync,
  now: () => Date = () => new Date(),
  isStale: () => boolean = () => false,
): Promise<void> {
  try {
    const text = await fs.read(PROGRESS_FILE);
    if (isStale()) return;
    if (text === null) {
      // No file yet (first launch after this update, or deleted by hand): create it from the app's copy.
      if (localStorage.getItem(STORAGE_KEY) !== null) {
        sync.queue(loadData());
        await sync.flush();
      }
      return;
    }
    let parsed;
    try {
      parsed = storedDataSchema.parse(JSON.parse(text));
    } catch {
      // Keep the bad file, and start a fresh one from the app's copy.
      await fs.rename(PROGRESS_FILE, `progress-unreadable-${localDateString(now())}.json`);
      flagFileUnreadable();
      sync.queue(loadData());
      await sync.flush();
      return;
    }
    const { progress, dropped } = dropLegacyProgress(parsed.progress);
    saveData({ ...parsed, progress });
    if (dropped) flagStage1Rebuilt();
  } catch {
    /* use localStorage as it is */
  }
}

/**
 * The start-up wait: runs `syncAtLaunch` for the app's file store, and gives up after `waitMs`
 * (then localStorage is used and the file catches up on the next save).
 */
export async function launch(waitMs = LAUNCH_WAIT_MS): Promise<void> {
  const fs = getFileStore();
  const sync = getFileSync();
  if (!fs || !sync) return;
  let gaveUp = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, waitMs);
  });
  await Promise.race([syncAtLaunch(fs, sync, undefined, () => gaveUp), timeout]);
  gaveUp = true;
  clearTimeout(timer);
}
