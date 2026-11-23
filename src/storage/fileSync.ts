import { create } from 'zustand';
import { getFileStore, type FileStore } from './fileStore';
import { localDateString } from '../core/progress/dates';
import type { StoredData } from './schema';

export const PROGRESS_FILE = 'progress.json';
export const BACKUP_DIR = 'backups';
export const BACKUPS_KEPT = 14;
const BACKUP_NAME = /^progress-(\d{4}-\d{2}-\d{2})\.json$/;

/** What Settings shows about the file. */
export const useFileStatus = create<{ lastFileSaveAt: string | null; fileSaveFailed: boolean }>(() => ({
  lastFileSaveAt: null,
  fileSaveFailed: false,
}));

export interface FileSync {
  /** Queue a write of `data`. Quick repeats collapse: only the newest is written. */
  queue(data: StoredData): void;
  /** Resolves when nothing is queued or being written. */
  flush(): Promise<void>;
}

export function createFileSync(fs: FileStore, now: () => Date = () => new Date()): FileSync {
  let pending: StoredData | null = null;
  let running: Promise<void> | null = null;
  let lastBackupDay: string | null = null;

  async function backupIfFirstOfDay(text: string): Promise<void> {
    const day = localDateString(now());
    if (lastBackupDay === day) return;
    try {
      const name = `progress-${day}.json`;
      const existing = await fs.list(BACKUP_DIR);
      if (!existing.includes(name)) await fs.write(`${BACKUP_DIR}/${name}`, text);
      const all = [...new Set([...existing, name])].filter((n) => BACKUP_NAME.test(n)).sort();
      for (const old of all.slice(0, Math.max(0, all.length - BACKUPS_KEPT))) {
        await fs.remove(`${BACKUP_DIR}/${old}`);
      }
      lastBackupDay = day;
    } catch {
      /* a backup problem must not fail the save; try again on the next one */
    }
  }

  async function writeOne(data: StoredData): Promise<void> {
    const text = JSON.stringify(data, null, 2);
    try {
      await fs.write(`${PROGRESS_FILE}.tmp`, text);
      await fs.rename(`${PROGRESS_FILE}.tmp`, PROGRESS_FILE);
    } catch {
      useFileStatus.setState({ fileSaveFailed: true });
      return;
    }
    useFileStatus.setState({ fileSaveFailed: false, lastFileSaveAt: now().toISOString() });
    await backupIfFirstOfDay(text);
  }

  async function drain(): Promise<void> {
    while (pending) {
      const data = pending;
      pending = null;
      await writeOne(data);
    }
    running = null;
  }

  return {
    queue(data) {
      pending = data;
      running ??= drain();
    },
    async flush() {
      while (running) await running;
    },
  };
}

let sync: { value: FileSync | null } | null = null;

/** The app's file sync, or null when there is no file store. */
export function getFileSync(): FileSync | null {
  if (sync) return sync.value;
  const fs = getFileStore();
  sync = { value: fs ? createFileSync(fs) : null };
  return sync.value;
}

/** For tests: forget the cached sync. */
export function resetFileSyncForTests(): void {
  sync = null;
}
