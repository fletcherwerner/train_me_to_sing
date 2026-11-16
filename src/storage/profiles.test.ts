import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProfileSync, isProfilesAvailable, useProfileStatus, ACTIVE_PROFILE_KEY, type Fetch } from './profiles';
import { useAppStore } from './store';
import type { ProfileFile } from './profileFormat';

/** An in-memory stand-in for the dev-server API, recording every request. */
function fakeApi() {
  const files = new Map<string, ProfileFile>();
  const log: string[] = [];
  let failPuts = false;
  const fetchFn: Fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    log.push(`${method} ${url}`);
    const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
    const id = url.split('/')[3];
    if (method === 'GET' && !id) return reply(200, []);
    if (method === 'GET') {
      const f = files.get(id);
      return f ? reply(200, f) : reply(404, { error: 'nope' });
    }
    const body = JSON.parse(String(init?.body));
    if (method === 'POST') {
      const newId = String(body.name).toLowerCase();
      const f: ProfileFile = {
        profileVersion: 1,
        id: newId,
        name: body.name,
        createdAt: 'c',
        updatedAt: 'u',
        data: body.data,
      };
      files.set(newId, f);
      return reply(201, f);
    }
    if (failPuts) return reply(500, { error: 'disk' });
    const old = files.get(id)!;
    const f = { ...old, data: body.data };
    files.set(id, f);
    return reply(200, f);
  };
  return { files, log, fetchFn, failPuts: (v: boolean) => (failPuts = v) };
}

const range = (lowMidi: number) => ({ lowMidi, highMidi: lowMidi + 20, assessedAt: 'x' });
const passed = { passed: true, bestScore: 1, attempts: 1, lastAttemptAt: 'x' };

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useAppStore.setState({
    range: null,
    progress: {},
    importedLessons: [],
    settings: { latencyOffsetMs: 120 },
  });
  useProfileStatus.setState({ available: null, activeId: null, activeName: null, saveError: false, notice: null });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('isProfilesAvailable', () => {
  it('is false for an HTML 200 (static host) and for network errors', async () => {
    expect(await isProfilesAvailable(async () => new Response('<html>', { status: 200 }))).toBe(false);
    expect(await isProfilesAvailable(async () => Promise.reject(new Error('x')))).toBe(false);
    expect(await isProfilesAvailable(async () => new Response('[]', { status: 200 }))).toBe(true);
  });
});

describe('auto-save', () => {
  it('debounces several quick changes into one write', async () => {
    const api = fakeApi();
    const sync = createProfileSync({ fetchFn: api.fetchFn });
    await sync.create('ana', 'fresh');
    api.log.length = 0;

    useAppStore.getState().setRange(range(40));
    await vi.advanceTimersByTimeAsync(200);
    useAppStore.getState().setRange(range(41));
    await vi.advanceTimersByTimeAsync(200);
    useAppStore.getState().setRange(range(42));
    await vi.advanceTimersByTimeAsync(499);
    expect(api.log).toEqual([]);
    await vi.advanceTimersByTimeAsync(2);
    expect(api.log).toEqual(['PUT /api/profiles/ana']);
    expect(api.files.get('ana')!.data.range?.lowMidi).toBe(42);
    sync.dispose();
  });

  it('does nothing without an active profile', async () => {
    const api = fakeApi();
    const sync = createProfileSync({ fetchFn: api.fetchFn });
    useAppStore.getState().setRange(range(40));
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.log).toEqual([]);
    sync.dispose();
  });

  it('shows a message when a save fails and retries on the next change', async () => {
    const api = fakeApi();
    const sync = createProfileSync({ fetchFn: api.fetchFn });
    await sync.create('ana', 'fresh');
    api.failPuts(true);
    useAppStore.getState().setRange(range(40));
    await vi.advanceTimersByTimeAsync(600);
    expect(useProfileStatus.getState().saveError).toBe(true);
    expect(useAppStore.getState().range?.lowMidi).toBe(40); // still kept in the browser
    api.failPuts(false);
    useAppStore.getState().recordAttempt('s1-01', { notes: [], score: 1, passed: true });
    await vi.advanceTimersByTimeAsync(600);
    expect(useProfileStatus.getState().saveError).toBe(false);
    expect(api.files.get('ana')!.data.range?.lowMidi).toBe(40);
    expect(api.files.get('ana')!.data.progress['s1-01'].passed).toBe(true);
    sync.dispose();
  });
});

describe('switching profiles', () => {
  it('saves the current profile before loading another, and keeps the latency offset', async () => {
    const api = fakeApi();
    api.files.set('ben', {
      profileVersion: 1,
      id: 'ben',
      name: 'ben',
      createdAt: 'c',
      updatedAt: 'u',
      data: { range: range(50), progress: { 's1-02': passed }, importedLessons: [] },
    });
    const sync = createProfileSync({ fetchFn: api.fetchFn });
    await sync.create('ana', 'fresh');
    useAppStore.getState().setRange(range(40)); // unsaved: still inside the debounce window
    api.log.length = 0;

    const r = await sync.load('ben');
    expect(r).toEqual({ ok: true, hasRange: true });
    expect(api.log).toEqual(['PUT /api/profiles/ana', 'GET /api/profiles/ben']);
    expect(api.files.get('ana')!.data.range?.lowMidi).toBe(40);

    const s = useAppStore.getState();
    expect(s.range?.lowMidi).toBe(50);
    expect(s.progress['s1-02'].passed).toBe(true);
    expect(s.settings.latencyOffsetMs).toBe(120);
    expect(useProfileStatus.getState().activeName).toBe('ben');
    expect(localStorage.getItem(ACTIVE_PROFILE_KEY)).toBe('ben');

    // Loading does not trigger a write-back.
    api.log.length = 0;
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.log).toEqual([]);
    sync.dispose();
  });

  it('does not switch when the current profile cannot be saved', async () => {
    const api = fakeApi();
    const sync = createProfileSync({ fetchFn: api.fetchFn });
    await sync.create('ana', 'fresh');
    api.failPuts(true);
    useAppStore.getState().setRange(range(40));
    const r = await sync.load('ben');
    expect(r.ok).toBe(false);
    expect(useAppStore.getState().range?.lowMidi).toBe(40);
    sync.dispose();
  });

  it('copy keeps the current data; fresh clears it', async () => {
    const api = fakeApi();
    const sync = createProfileSync({ fetchFn: api.fetchFn });
    useAppStore.getState().setRange(range(40));
    expect(await sync.create('copy', 'copy')).toEqual({ ok: true, hasRange: true });
    expect(api.files.get('copy')!.data.range?.lowMidi).toBe(40);
    expect(useAppStore.getState().range?.lowMidi).toBe(40);
    expect(await sync.create('fresh', 'fresh')).toEqual({ ok: true, hasRange: false });
    expect(useAppStore.getState().range).toBeNull();
    sync.dispose();
  });
});

describe('start-up', () => {
  it('loads the active profile', async () => {
    const api = fakeApi();
    api.files.set('ana', {
      profileVersion: 1,
      id: 'ana',
      name: 'Ana',
      createdAt: 'c',
      updatedAt: 'u',
      data: { range: range(44), progress: {}, importedLessons: [] },
    });
    localStorage.setItem(ACTIVE_PROFILE_KEY, 'ana');
    const sync = createProfileSync({ fetchFn: api.fetchFn });
    await sync.init();
    expect(useAppStore.getState().range?.lowMidi).toBe(44);
    expect(useProfileStatus.getState().activeName).toBe('Ana');
    sync.dispose();
  });

  it('clears a missing active profile and says so', async () => {
    const api = fakeApi();
    localStorage.setItem(ACTIVE_PROFILE_KEY, 'ghost');
    const sync = createProfileSync({ fetchFn: api.fetchFn });
    await sync.init();
    expect(localStorage.getItem(ACTIVE_PROFILE_KEY)).toBeNull();
    expect(useProfileStatus.getState().notice).toBe("Profile 'ghost' was not found");
    sync.dispose();
  });
});
