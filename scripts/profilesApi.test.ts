// @vitest-environment node
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleProfilesRequest } from './profilesApi';
import { cleanName, nameToId } from '../src/storage/profileFormat';

const data = (passed = false) => ({
  range: { lowMidi: 45, highMidi: 64, assessedAt: 'x' },
  progress: passed ? { 's1b-01': { passed: true, bestScore: 1, attempts: 1, lastAttemptAt: 'x', proofs: [], review: null } } : {},
  importedLessons: [],
});

let dir: string;
beforeEach(async () => {
  dir = path.join(await mkdtemp(path.join(tmpdir(), 'tmts-profiles-')), 'profiles'); // does not exist yet
});
afterEach(async () => {
  await rm(path.dirname(dir), { recursive: true, force: true });
});

const req = (method: string, url: string, body?: unknown) => handleProfilesRequest(dir, method, url, body);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('name to id', () => {
  it('lower-cases, hyphenates spaces and strips other characters', () => {
    expect(nameToId('Ana')).toBe('ana');
    expect(nameToId('  Test  B ')).toBe('test-b');
    expect(nameToId("Zoë O'Neil!")).toBe('zo-oneil');
    expect(nameToId('x'.repeat(40))).toHaveLength(40);
  });
  it('accepts names of 1–40 characters after trimming', () => {
    expect(cleanName('  A ')).toBe('A');
    expect(cleanName('')).toBeNull();
    expect(cleanName('   ')).toBeNull();
    expect(cleanName('a'.repeat(41))).toBeNull();
    expect(cleanName('a'.repeat(40))).toBe('a'.repeat(40));
    expect(cleanName('!!!')).toBeNull();
    expect(cleanName(5)).toBeNull();
  });
});

describe('profiles API', () => {
  it('lists nothing when the folder does not exist', async () => {
    expect(await req('GET', '/api/profiles')).toEqual({ status: 200, json: [] });
  });

  it('creates, gets, updates and lists newest first', async () => {
    const a = await req('POST', '/api/profiles', { name: 'Ana', data: data(true) });
    expect(a.status).toBe(201);
    expect((a.json as { id: string }).id).toBe('ana');
    await sleep(5);
    expect((await req('POST', '/api/profiles', { name: 'Ben Two', data: data() })).status).toBe(201);

    const list = (await req('GET', '/api/profiles')).json as { id: string; range: unknown; passedCount: number }[];
    expect(list.map((p) => p.id)).toEqual(['ben-two', 'ana']);
    expect(list[1]).toMatchObject({ name: 'Ana', range: { low: 'A2', high: 'E4' }, passedCount: 1 });

    const got = await req('GET', '/api/profiles/ana');
    expect(got.status).toBe(200);
    expect((got.json as { data: unknown }).data).toEqual(data(true));

    await sleep(5);
    const put = await req('PUT', '/api/profiles/ana', { data: { ...data(), range: null } });
    expect(put.status).toBe(200);
    const f = put.json as { createdAt: string; updatedAt: string; data: { range: unknown } };
    expect(f.data.range).toBeNull();
    expect(f.updatedAt > f.createdAt).toBe(true);
    expect(((await req('GET', '/api/profiles')).json as { id: string }[])[0].id).toBe('ana');
  });

  it('writes pretty JSON and leaves no .tmp file', async () => {
    await req('POST', '/api/profiles', { name: 'Ana', data: data() });
    await req('PUT', '/api/profiles/ana', { data: data(true) });
    expect(await readdir(dir)).toEqual(['ana.json']);
    const text = await readFile(path.join(dir, 'ana.json'), 'utf8');
    expect(text).toContain('\n  "profileVersion": 1');
  });

  it('409 for a duplicate id, 404 for a missing profile', async () => {
    await req('POST', '/api/profiles', { name: 'Ana', data: data() });
    expect((await req('POST', '/api/profiles', { name: 'ana', data: data() })).status).toBe(409);
    expect((await req('POST', '/api/profiles', { name: ' A-na ', data: data() })).status).toBe(201);
    expect((await req('GET', '/api/profiles/nobody')).status).toBe(404);
    expect((await req('PUT', '/api/profiles/nobody', { data: data() })).status).toBe(404);
  });

  it('400 for bad ids, before touching the disk', async () => {
    for (const bad of ['../x', 'a/b', '%2e%2e', 'A', 'a.b', '..', 'x'.repeat(41)]) {
      expect((await req('GET', `/api/profiles/${bad}`)).status).toBe(400);
      expect((await req('PUT', `/api/profiles/${bad}`, { data: data() })).status).toBe(400);
    }
    await expect(readdir(dir)).rejects.toThrow(); // folder never created
  });

  it('400 for bad names and wrong-schema data', async () => {
    for (const name of ['', '   ', 'a'.repeat(41), '???', 7, undefined]) {
      expect((await req('POST', '/api/profiles', { name, data: data() })).status).toBe(400);
    }
    expect((await req('POST', '/api/profiles', { name: 'Ana', data: { range: 1 } })).status).toBe(400);
    expect((await req('POST', '/api/profiles', { name: 'Ana' })).status).toBe(400);
    await req('POST', '/api/profiles', { name: 'Ana', data: data() });
    expect((await req('PUT', '/api/profiles/ana', { data: { ...data(), progress: { a: 1 } } })).status).toBe(400);
    expect((await req('PUT', '/api/profiles/ana', {})).status).toBe(400);
  });
});
