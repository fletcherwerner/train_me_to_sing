import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryFileStore } from './fileStore';
import { createFileSync, useFileStatus } from './fileSync';
import { syncAtLaunch } from './launch';
import { loadData, saveData, type StoredData } from './schema';
import { useNotices } from './notices';

const data = (low: number): StoredData => ({
  version: 2,
  range: { lowMidi: low, highMidi: low + 20, assessedAt: '2026-11-01T00:00:00.000Z' },
  settings: { latencyOffsetMs: 80 },
  progress: {},
  importedLessons: [],
});
const NOW = () => new Date(2026, 10, 22, 9);

function setup(files = new Map<string, string>()) {
  const fs = createMemoryFileStore(files);
  return { fs, files, sync: createFileSync(fs, NOW) };
}

beforeEach(() => {
  localStorage.clear();
  useFileStatus.setState({ lastFileSaveAt: null, fileSaveFailed: false });
  useNotices.setState({ stage1Rebuilt: false, fileUnreadable: false });
});

describe('syncAtLaunch', () => {
  it('a valid file wins over a different localStorage', async () => {
    saveData(data(40));
    const { fs, sync } = setup(new Map([['progress.json', JSON.stringify(data(55))]]));
    await syncAtLaunch(fs, sync, NOW);
    expect(loadData().range?.lowMidi).toBe(55);
  });

  it('a missing file is created from localStorage', async () => {
    saveData(data(40));
    const { fs, sync, files } = setup();
    await syncAtLaunch(fs, sync, NOW);
    expect(JSON.parse(files.get('progress.json')!).range.lowMidi).toBe(40);
  });

  it('a missing file and empty localStorage starts fresh, writing nothing', async () => {
    const { fs, sync, files } = setup();
    await syncAtLaunch(fs, sync, NOW);
    expect(files.size).toBe(0);
  });

  it('an invalid file is kept under a new name, a fresh one is written, and the notice is set', async () => {
    saveData(data(40));
    const { fs, sync, files } = setup(new Map([['progress.json', '{ not json']]));
    await syncAtLaunch(fs, sync, NOW);
    expect(files.get('progress-unreadable-2026-11-22.json')).toBe('{ not json');
    expect(JSON.parse(files.get('progress.json')!).range.lowMidi).toBe(40);
    expect(useNotices.getState().fileUnreadable).toBe(true);
    expect(loadData().range?.lowMidi).toBe(40);
  });

  it('a version 1 file migrates', async () => {
    const v1 = {
      version: 1,
      range: null,
      settings: { latencyOffsetMs: 10 },
      progress: { 's2-01': { passed: true, bestScore: 0.9, attempts: 1, lastAttemptAt: '2026-11-01T10:00:00.000Z' } },
      importedLessons: [],
    };
    const { fs, sync } = setup(new Map([['progress.json', JSON.stringify(v1)]]));
    await syncAtLaunch(fs, sync, NOW);
    const loaded = loadData();
    expect(loaded.version).toBe(2);
    expect(loaded.progress['s2-01']?.proofs).toHaveLength(1);
    expect(loaded.settings.latencyOffsetMs).toBe(10);
  });

  it('ignores a file that arrives after the app stopped waiting', async () => {
    saveData(data(40));
    const { fs, sync } = setup(new Map([['progress.json', JSON.stringify(data(55))]]));
    await syncAtLaunch(fs, sync, NOW, () => true);
    expect(loadData().range?.lowMidi).toBe(40);
  });

  it('with no file store, launch does nothing and touches no file', async () => {
    const { launch } = await import('./launch');
    const { getFileStore } = await import('./fileStore');
    expect(getFileStore()).toBeNull(); // jsdom, no ?filestore=memory, not native
    await launch(10);
    expect(sessionStorage.getItem('tmts.memfs')).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});
