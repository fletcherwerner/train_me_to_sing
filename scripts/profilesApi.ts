import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  cleanName,
  isValidProfileId,
  nameToId,
  profileDataSchema,
  profileFileSchema,
  type ProfileFile,
  type ProfileSummary,
} from '../src/storage/profileFormat';
import { midiToName } from '../src/core/music/notes';

export const BODY_LIMIT = 1024 * 1024;
const PREFIX = '/api/profiles';

export interface ApiResult {
  status: number;
  json: unknown;
}

const err = (status: number, error: string): ApiResult => ({ status, json: { error } });

export function profilesDir(): string {
  return process.env.TMTS_PROFILES_DIR ?? path.resolve(process.cwd(), 'profiles');
}

async function writeAtomic(dir: string, id: string, file: ProfileFile): Promise<void> {
  await mkdir(dir, { recursive: true });
  const target = path.join(dir, `${id}.json`);
  const tmp = `${target}.tmp`;
  await writeFile(tmp, JSON.stringify(file, null, 2) + '\n', 'utf8');
  await rename(tmp, target);
}

async function readProfile(dir: string, id: string): Promise<ProfileFile | 'missing' | 'corrupt'> {
  let text: string;
  try {
    text = await readFile(path.join(dir, `${id}.json`), 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return 'missing';
    throw e;
  }
  try {
    const parsed = profileFileSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : 'corrupt';
  } catch {
    return 'corrupt';
  }
}

function summarize(f: ProfileFile): ProfileSummary {
  return {
    id: f.id,
    name: f.name,
    updatedAt: f.updatedAt,
    range: f.data.range ? { low: midiToName(f.data.range.lowMidi), high: midiToName(f.data.range.highMidi) } : null,
    passedCount: Object.values(f.data.progress).filter((p) => p.passed).length,
  };
}

/** Pure request handler over a directory, so it can be tested without Vite. `url` may include a query string. */
export async function handleProfilesRequest(
  dir: string,
  method: string,
  url: string,
  body: unknown,
): Promise<ApiResult> {
  const pathname = url.split('?')[0];
  if (pathname !== PREFIX && !pathname.startsWith(PREFIX + '/')) return err(404, 'Not found');
  const segments = pathname.slice(PREFIX.length).split('/').slice(1);
  if (segments.length > 0 && segments[segments.length - 1] === '') segments.pop();
  const bodyObj = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

  try {
    if (segments.length === 0) {
      if (method === 'GET') {
        let names: string[] = [];
        try {
          names = await readdir(dir);
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
        }
        const list: ProfileSummary[] = [];
        for (const n of names) {
          if (!n.endsWith('.json')) continue;
          const id = n.slice(0, -5);
          if (!isValidProfileId(id)) continue;
          const p = await readProfile(dir, id);
          if (typeof p !== 'string') list.push(summarize(p));
        }
        list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
        return { status: 200, json: list };
      }
      if (method === 'POST') {
        const name = cleanName(bodyObj.name);
        if (!name) return err(400, 'Name must be 1–40 characters with at least one letter or number.');
        const data = profileDataSchema.safeParse(bodyObj.data);
        if (!data.success) return err(400, 'Profile data is not valid.');
        const id = nameToId(name);
        if ((await readProfile(dir, id)) !== 'missing') return err(409, 'A profile with that name already exists.');
        const now = new Date().toISOString();
        const file: ProfileFile = { profileVersion: 1, id, name, createdAt: now, updatedAt: now, data: data.data };
        await writeAtomic(dir, id, file);
        return { status: 201, json: file };
      }
      return err(405, 'Method not allowed');
    }

    if (segments.length > 1) return err(400, 'Bad profile id.');
    const id = segments[0];
    if (!isValidProfileId(id)) return err(400, 'Bad profile id.');

    if (method === 'GET') {
      const p = await readProfile(dir, id);
      if (p === 'missing') return err(404, 'Profile not found.');
      if (p === 'corrupt') return err(500, 'Profile file is not valid.');
      return { status: 200, json: p };
    }
    if (method === 'PUT') {
      const data = profileDataSchema.safeParse(bodyObj.data);
      if (!data.success) return err(400, 'Profile data is not valid.');
      const p = await readProfile(dir, id);
      if (p === 'missing') return err(404, 'Profile not found.');
      if (p === 'corrupt') return err(500, 'Profile file is not valid.');
      const file: ProfileFile = { ...p, updatedAt: new Date().toISOString(), data: data.data };
      await writeAtomic(dir, id, file);
      return { status: 200, json: file };
    }
    return err(405, 'Method not allowed');
  } catch {
    return err(500, 'Could not read or write the profiles folder.');
  }
}

function readBody(req: IncomingMessage): Promise<{ ok: true; body: unknown } | { ok: false; status: number }> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let done = false;
    req.on('data', (c: Buffer) => {
      if (done) return;
      size += c.length;
      if (size > BODY_LIMIT) {
        done = true;
        resolve({ ok: false, status: 413 });
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (done) return;
      done = true;
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text) return resolve({ ok: true, body: undefined });
      try {
        resolve({ ok: true, body: JSON.parse(text) });
      } catch {
        resolve({ ok: false, status: 400 });
      }
    });
    req.on('error', () => {
      if (!done) {
        done = true;
        resolve({ ok: false, status: 400 });
      }
    });
  });
}

/** Connect-style middleware for Vite's dev server. */
export function profilesMiddleware(dir: string = profilesDir()) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? '';
    const p = url.split('?')[0];
    if (p !== PREFIX && !p.startsWith(PREFIX + '/')) return next();
    const send = (r: ApiResult) => {
      res.statusCode = r.status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(r.json));
    };
    let body: unknown;
    if (req.method === 'POST' || req.method === 'PUT') {
      const b = await readBody(req);
      if (!b.ok) return send(err(b.status, b.status === 413 ? 'Request too large.' : 'Body is not valid JSON.'));
      body = b.body;
    }
    send(await handleProfilesRequest(dir, req.method ?? 'GET', url, body));
  };
}
