import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryFileStore, setFileStoreForTests, type FileStore } from './fileStore';
import { BACKUP_DIR, BACKUPS_KEPT, createFileSync, resetFileSyncForTests, useFileStatus } from './fileSync';
import { saveData, storedDataSchema, type StoredData } from './schema';
import { useAppStore } from './store';

const data = (low: number): StoredData => ({
  version: 2,
  range: { lowMidi: low, highMidi: low + 20, assessedAt: '2026-11-01T00:00:00.000Z' },
  settings: { latencyOffsetMs: 80 },
  progress: {},
  importedLessons: [],
});

/** A memory store that logs every call as `op path`. */
function logged(files = new Map<string, string>()) {
  const inner = createMemoryFileStore(files);
  const log: string[] = [];
  const fs: FileStore = {
    read: (p) => (log.push(`read ${p}`), inner.read(p)),
    write: (p, t) => (log.push(`write ${p}`), inner.write(p, t)),
    rename: (a, b) => (log.push(`rename ${a} ${b}`), inner.rename(a, b)),
    list: (d) => (log.push(`list ${d}`), inner.list(d)),
    remove: (p) => (log.push(`remove ${p}`), inner.remove(p)),
  };
  return { fs, files, log };
}

beforeEach(() => {
  localStorage.clear();
  useFileStatus.setState({ lastFileSaveAt: null, fileSaveFailed: false });
  setFileStoreForTests(undefined);
  resetFileSyncForTests();
});

describe('fileSync', () => {
  it('writes progress.json through a .tmp file and a rename, as valid StoredData', async () => {
    const { fs, files, log } = logged();
    const sync = createFileSync(fs);
    sync.queue(data(40));
    await sync.flush();
    expect(log.slice(0, 2)).toEqual(['write progress.json.tmp', 'rename progress.json.tmp progress.json']);
    expect(files.has('progress.json.tmp')).toBe(false);
    const text = files.get('progress.json')!;
    expect(text).toContain('\n  "version": 2');
    expect(storedDataSchema.parse(JSON.parse(text)).range?.lowMidi).toBe(40);
    expect(useFileStatus.getState().lastFileSaveAt).not.toBeNull();
    expect(useFileStatus.getState().fileSaveFailed).toBe(false);
  });

  it('collapses quick commits: at most two writes, the last with the newest data', async () => {
    const { fs, files, log } = logged();
    const sync = createFileSync(fs);
    sync.queue(data(40));
    sync.queue(data(41));
    sync.queue(data(42));
    await sync.flush();
    expect(log.filter((l) => l === 'write progress.json.tmp').length).toBeLessThanOrEqual(2);
    expect(JSON.parse(files.get('progress.json')!).range.lowMidi).toBe(42);
  });

  it('writes a dated backup on the first save of a day only, and keeps 14', async () => {
    const { fs, files } = logged();
    let day = new Date(2026, 0, 1, 12);
    const sync = createFileSync(fs, () => day);
    sync.queue(data(40));
    await sync.flush();
    sync.queue(data(41));
    await sync.flush();
    expect(await fs.list(BACKUP_DIR)).toEqual(['progress-2026-01-01.json']);
    expect(JSON.parse(files.get(`${BACKUP_DIR}/progress-2026-01-01.json`)!).range.lowMidi).toBe(40);
    for (let i = 2; i <= 15; i++) {
      day = new Date(2026, 0, i, 12);
      sync.queue(data(40 + i));
      await sync.flush();
    }
    const names = await fs.list(BACKUP_DIR);
    expect(names.length).toBe(BACKUPS_KEPT);
    expect(names).not.toContain('progress-2026-01-01.json');
    expect(names).toContain('progress-2026-01-15.json');
  });

  it('a failing write sets fileSaveFailed and leaves localStorage alone', async () => {
    const { fs } = logged();
    const failing: FileStore = { ...fs, write: async () => Promise.reject(new Error('disk full')) };
    saveData(data(50));
    const before = localStorage.getItem('tmts.v1');
    const sync = createFileSync(failing);
    sync.queue(data(51));
    await sync.flush();
    expect(useFileStatus.getState().fileSaveFailed).toBe(true);
    expect(localStorage.getItem('tmts.v1')).toBe(before);
  });

  it('the app store queues a file write after each commit', async () => {
    const { fs, files } = logged();
    setFileStoreForTests(fs);
    resetFileSyncForTests();
    useAppStore.getState().setRange({ lowMidi: 45, highMidi: 65, assessedAt: 'x' });
    const { getFileSync } = await import('./fileSync');
    await getFileSync()!.flush();
    expect(JSON.parse(files.get('progress.json')!).range.lowMidi).toBe(45);
  });
});
