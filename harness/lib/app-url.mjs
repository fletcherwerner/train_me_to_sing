// Where the app under review is served. harness/dev-server.mjs writes the address here; screenshot scripts read it
// so they work when port 5173 is already taken (README.md, section 1). Standalone: scripts in comms/ import it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const URL_FILE = path.join(root, '.driver-logs', 'dev-url');
export const PID_FILE = path.join(root, '.driver-logs', 'dev-pid');
export const DEFAULT_URL = 'https://localhost:5173';

/** `APP_URL` if set, else the address of the server `harness/dev-server.mjs start` launched, else the default port. */
export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  try {
    return fs.readFileSync(URL_FILE, 'utf8').trim().replace(/\/$/, '') || DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
}
