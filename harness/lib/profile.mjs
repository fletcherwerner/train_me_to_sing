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
  return { name, env, trailer: j.trailer, baseUrl: env.ANTHROPIC_BASE_URL || null, startHint: j.startHint || '', restartHint: j.restartHint || '' };
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

/**
 * Asks the model for a few tokens through the same endpoint the agents will use. A proxy can answer
 * while the model server behind it is dead, so reachability alone is not enough.
 */
export async function checkModel(profile, timeoutMs = 180_000) {
  if (!profile.baseUrl) return;
  const model = profile.env.ANTHROPIC_MODEL;
  let res;
  try {
    res = await fetch(`${profile.baseUrl.replace(/\/$/, '')}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        authorization: `Bearer ${profile.env.ANTHROPIC_AUTH_TOKEN || ''}`,
        'x-api-key': profile.env.ANTHROPIC_AUTH_TOKEN || '',
      },
      body: JSON.stringify({ model, max_tokens: 8, messages: [{ role: 'user', content: 'Say OK' }] }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    throw new Error(`The model did not answer within ${Math.round(timeoutMs / 1000)}s for profile "${profile.name}" (${e.cause?.code || e.message}). ${profile.startHint}`.trim());
  }
  if (!res.ok) {
    const body = (await res.text()).replace(/\s+/g, ' ').slice(0, 300);
    throw new Error(`The endpoint answers but model "${model}" does not work (HTTP ${res.status}): ${body}\n${profile.restartHint || profile.startHint}`.trim());
  }
}
