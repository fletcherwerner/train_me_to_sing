import { create } from 'zustand';
import { useAppStore } from './store';
import {
  FRESH_DATA,
  cleanName,
  dataFromStored,
  profileFileSchema,
  type ProfileData,
  type ProfileFile,
  type ProfileSummary,
} from './profileFormat';
import type { StoredData } from './schema';

export const ACTIVE_PROFILE_KEY = 'tmts.activeProfile';
const API = '/api/profiles';
export const SAVE_DEBOUNCE_MS = 500;
export const SAVE_ERROR_TEXT = "Couldn't save to the profile file. Your progress is still kept in this browser.";

export type Fetch = typeof fetch;

/** What the UI shows about profiles. */
interface ProfileStatus {
  /** null until the first check finishes. */
  available: boolean | null;
  activeId: string | null;
  activeName: string | null;
  saveError: boolean;
  notice: string | null;
}
export const useProfileStatus = create<ProfileStatus>(() => ({
  available: null,
  activeId: null,
  activeName: null,
  saveError: false,
  notice: null,
}));

async function json(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** True when `GET /api/profiles` answers 200 with a JSON list (a static host may answer 200 with HTML). */
export async function isProfilesAvailable(fetchFn: Fetch = fetch): Promise<boolean> {
  try {
    const res = await fetchFn(API);
    return res.status === 200 && Array.isArray(await json(res));
  } catch {
    return false;
  }
}

export async function listProfiles(fetchFn: Fetch = fetch): Promise<ProfileSummary[]> {
  const res = await fetchFn(API);
  const body = await json(res);
  if (res.status !== 200 || !Array.isArray(body)) throw new Error('Could not list profiles.');
  return body as ProfileSummary[];
}

export type ApiOutcome<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

async function call(fetchFn: Fetch, url: string, init?: RequestInit): Promise<ApiOutcome<ProfileFile>> {
  try {
    const res = await fetchFn(url, init);
    const body = await json(res);
    if (res.status >= 200 && res.status < 300) {
      const parsed = profileFileSchema.safeParse(body);
      if (parsed.success) return { ok: true, value: parsed.data };
      return { ok: false, status: res.status, error: 'The profile file is not valid.' };
    }
    const msg = (body as { error?: unknown } | null)?.error;
    return { ok: false, status: res.status, error: typeof msg === 'string' ? msg : 'Request failed.' };
  } catch {
    return { ok: false, status: 0, error: 'Could not reach the profile server.' };
  }
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const getProfile = (id: string, f: Fetch = fetch) => call(f, `${API}/${encodeURIComponent(id)}`);
export const createProfileFile = (name: string, data: ProfileData, f: Fetch = fetch) =>
  call(f, API, jsonInit('POST', { name, data }));
export const saveProfileFile = (id: string, data: ProfileData, f: Fetch = fetch) =>
  call(f, `${API}/${encodeURIComponent(id)}`, jsonInit('PUT', { data }));

export interface ProfileSync {
  /** Load the active profile (if any) on start. */
  init(): Promise<void>;
  create(name: string, mode: 'fresh' | 'copy'): Promise<{ ok: true; hasRange: boolean } | { ok: false; error: string }>;
  load(id: string): Promise<{ ok: true; hasRange: boolean } | { ok: false; error: string }>;
  /** Save any pending change now and wait for it. Resolves false if the save failed. */
  flush(): Promise<boolean>;
  dispose(): void;
}

interface SyncOptions {
  store?: typeof useAppStore;
  fetchFn?: Fetch;
  debounceMs?: number;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

export function createProfileSync(opts: SyncOptions = {}): ProfileSync {
  const store = opts.store ?? useAppStore;
  const fetchFn: Fetch = opts.fetchFn ?? ((...a) => fetch(...a));
  const debounceMs = opts.debounceMs ?? SAVE_DEBOUNCE_MS;
  const storage = opts.storage ?? localStorage;
  const status = useProfileStatus;

  let activeId: string | null = null;
  let dirty = false;
  let applying = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<boolean> | null = null;
  let last = pick(store.getState());

  function pick(s: StoredData) {
    return { range: s.range, progress: s.progress, importedLessons: s.importedLessons };
  }

  const setActive = (id: string | null, name: string | null) => {
    activeId = id;
    if (id) storage.setItem(ACTIVE_PROFILE_KEY, id);
    else storage.removeItem(ACTIVE_PROFILE_KEY);
    status.setState({ activeId: id, activeName: name });
  };

  const apply = (data: ProfileData) => {
    applying = true;
    try {
      const incoming: StoredData = { version: 2, settings: { latencyOffsetMs: 0 }, ...data };
      // importProgress applies replaceData, which keeps the device's latency offset.
      store.getState().importProgress(incoming, 'replace');
    } finally {
      applying = false;
      last = pick(store.getState());
      dirty = false;
    }
  };

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const save = (): Promise<boolean> => {
    clearTimer();
    if (!activeId || !dirty) return inFlight ?? Promise.resolve(true);
    const id = activeId;
    const sent = pick(store.getState());
    dirty = false;
    const run = async () => {
      const r = await saveProfileFile(id, dataFromStored(sent), fetchFn);
      if (r.ok) {
        status.setState({ saveError: false });
        return true;
      }
      dirty = true; // retry on the next change
      status.setState({ saveError: true });
      return false;
    };
    const prev = inFlight ?? Promise.resolve(true);
    const p = prev.then(run);
    inFlight = p;
    void p.finally(() => {
      if (inFlight === p) inFlight = null;
    });
    return p;
  };

  const unsubscribe = store.subscribe((s) => {
    if (applying) return;
    const now = pick(s);
    if (now.range === last.range && now.progress === last.progress && now.importedLessons === last.importedLessons) return;
    last = now;
    if (!activeId) return;
    dirty = true;
    clearTimer();
    timer = setTimeout(() => void save(), debounceMs);
  });

  const flush = async (): Promise<boolean> => {
    if (!activeId) return true;
    const ok = await save();
    return ok && !dirty;
  };

  const activate = (file: ProfileFile) => {
    apply(file.data);
    setActive(file.id, file.name);
    status.setState({ saveError: false });
    return { ok: true as const, hasRange: file.data.range != null };
  };

  return {
    async init() {
      const available = await isProfilesAvailable(fetchFn);
      status.setState({ available });
      const id = storage.getItem(ACTIVE_PROFILE_KEY);
      if (!id || !available) return;
      const r = await getProfile(id, fetchFn);
      if (r.ok) {
        activate(r.value);
      } else if (r.status === 404 || r.status === 400) {
        setActive(null, null);
        status.setState({ notice: `Profile '${id}' was not found` });
      }
    },
    async create(rawName, mode) {
      const name = cleanName(rawName);
      if (!name) return { ok: false, error: 'Enter a name of 1–40 characters, using letters or numbers.' };
      if (!(await flush())) return { ok: false, error: SAVE_ERROR_TEXT };
      const data = mode === 'copy' ? dataFromStored(store.getState()) : FRESH_DATA;
      const r = await createProfileFile(name, data, fetchFn);
      if (!r.ok) return { ok: false, error: r.error };
      if (mode === 'copy') {
        setActive(r.value.id, r.value.name);
        last = pick(store.getState());
        dirty = false;
        return { ok: true, hasRange: r.value.data.range != null };
      }
      return activate(r.value);
    },
    async load(id) {
      if (!(await flush())) return { ok: false, error: SAVE_ERROR_TEXT };
      const r = await getProfile(id, fetchFn);
      if (!r.ok) return { ok: false, error: r.status === 404 ? 'That profile was not found.' : r.error };
      return activate(r.value);
    },
    flush,
    dispose() {
      clearTimer();
      unsubscribe();
    },
  };
}

let shared: ProfileSync | null = null;
/** The app-wide sync. Created on first use. */
export function profileSync(): ProfileSync {
  return (shared ??= createProfileSync());
}
