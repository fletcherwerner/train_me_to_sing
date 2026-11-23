import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

/** Text files under the app's Documents folder. Paths are relative to it, e.g. `backups/progress-2026-11-22.json`. */
export interface FileStore {
  /** The file's text, or null when it does not exist. */
  read(path: string): Promise<string | null>;
  /** Creates parent folders as needed and replaces an existing file. */
  write(path: string, text: string): Promise<void>;
  /** Moves `from` to `to`, replacing `to` if it exists. */
  rename(from: string, to: string): Promise<void>;
  /** File names (not paths) directly inside `dir`. An absent folder is an empty list. */
  list(dir: string): Promise<string[]>;
  remove(path: string): Promise<void>;
}

/** The real thing, for the native app. */
export const capacitorFileStore: FileStore = {
  async read(path) {
    try {
      const r = await Filesystem.readFile({ path, directory: Directory.Documents, encoding: Encoding.UTF8 });
      return typeof r.data === 'string' ? r.data : await r.data.text();
    } catch {
      return null; // a missing file rejects
    }
  },
  async write(path, text) {
    await Filesystem.writeFile({
      path,
      data: text,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  },
  async rename(from, to) {
    const opts = { from, to, directory: Directory.Documents, toDirectory: Directory.Documents };
    try {
      await Filesystem.rename(opts);
    } catch (e) {
      // If this platform's rename refuses to replace an existing file, remove the old one and retry.
      // The new file is still intact under its temporary name, so nothing is lost if the retry fails.
      if ((await this.read(to)) === null) throw e;
      await this.remove(to);
      await Filesystem.rename(opts);
    }
  },
  async list(dir) {
    try {
      const r = await Filesystem.readdir({ path: dir, directory: Directory.Documents });
      return r.files.filter((f) => f.type === 'file').map((f) => f.name);
    } catch {
      return [];
    }
  },
  async remove(path) {
    await Filesystem.deleteFile({ path, directory: Directory.Documents });
  },
};

/** Files in a `Map`, for unit tests and for the `?filestore=memory` e2e mode. */
export function createMemoryFileStore(files: Map<string, string> = new Map(), onChange?: () => void): FileStore {
  return {
    async read(path) {
      return files.get(path) ?? null;
    },
    async write(path, text) {
      files.set(path, text);
      onChange?.();
    },
    async rename(from, to) {
      const text = files.get(from);
      if (text === undefined) throw new Error(`No such file: ${from}`);
      files.set(to, text);
      files.delete(from);
      onChange?.();
    },
    async list(dir) {
      const prefix = dir.endsWith('/') ? dir : `${dir}/`;
      return [...files.keys()]
        .filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
        .map((p) => p.slice(prefix.length));
    },
    async remove(path) {
      files.delete(path);
      onChange?.();
    },
  };
}

/** sessionStorage key holding the dev/test memory files, so a page reload keeps them (and a test can seed or read them). */
export const MEMORY_FILES_KEY = 'tmts.memfs';

function memoryStoreOnSession(): FileStore {
  const files = new Map<string, string>();
  try {
    const saved = JSON.parse(sessionStorage.getItem(MEMORY_FILES_KEY) ?? '{}') as Record<string, string>;
    for (const [k, v] of Object.entries(saved)) if (typeof v === 'string') files.set(k, v);
  } catch {
    /* start empty */
  }
  return createMemoryFileStore(files, () => {
    try {
      sessionStorage.setItem(MEMORY_FILES_KEY, JSON.stringify(Object.fromEntries(files)));
    } catch {
      /* the in-memory copy still works */
    }
  });
}

function wantsMemoryStore(): boolean {
  const hash = window.location.hash;
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?')) : '';
  return (
    new URLSearchParams(window.location.search).get('filestore') === 'memory' ||
    new URLSearchParams(query).get('filestore') === 'memory'
  );
}

let chosen: { store: FileStore | null } | null = null;

/**
 * The file store for this run: the Capacitor one in the native app; a memory one when the URL has
 * `?filestore=memory` (dev and test builds only); otherwise null, meaning localStorage only.
 */
export function getFileStore(): FileStore | null {
  if (chosen) return chosen.store;
  let store: FileStore | null = null;
  if (Capacitor.isNativePlatform()) store = capacitorFileStore;
  else if (import.meta.env.DEV && wantsMemoryStore()) store = memoryStoreOnSession();
  chosen = { store };
  return store;
}

/** For tests: forget the choice (and optionally force one). */
export function setFileStoreForTests(store: FileStore | null | undefined): void {
  chosen = store === undefined ? null : { store };
}
