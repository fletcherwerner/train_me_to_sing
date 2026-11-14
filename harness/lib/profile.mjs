// Run profiles: environment applied to every agent session the driver starts, so the loop can use a
// different model or endpoint (for example the local Qwen setup) without relying on a shell alias.
// A profile is harness/profiles/<name>.json. It holds no secrets: a token is read from `authTokenFile`.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './comms.mjs';

export function loadProfile(name) {
  const file = path.join(ROOT, 'harness', 'profiles', `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`No profile "${name}". Expected ${path.relative(ROOT, file)}.`);
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const env = { ...(j.env || {}) };
  if (j.authTokenFile) {
    if (!fs.existsSync(j.authTokenFile)) {
      throw new Error(`Profile "${name}" reads its token from ${j.authTokenFile}, which does not exist. ${j.startHint || ''}`.trim());
    }
    env.ANTHROPIC_AUTH_TOKEN = fs.readFileSync(j.authTokenFile, 'utf8').trim();
  }
  return { name, env, trailer: j.trailer, baseUrl: env.ANTHROPIC_BASE_URL || null, startHint: j.startHint || '' };
}

/** Throws unless the profile's endpoint answers at all (any HTTP status counts as up). */
export async function checkReachable(profile, timeoutMs = 4000) {
  if (!profile.baseUrl) return;
  try {
    await fetch(profile.baseUrl, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    throw new Error(`Cannot reach ${profile.baseUrl} for profile "${profile.name}" (${e.cause?.code || e.message}). ${profile.startHint}`.trim());
  }
}
