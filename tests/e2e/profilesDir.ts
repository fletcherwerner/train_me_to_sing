import os from 'node:os';
import path from 'node:path';

/** The folder the dev server writes profiles to during e2e runs (set through TMTS_PROFILES_DIR). */
export const E2E_PROFILES_DIR = path.join(os.tmpdir(), 'tmts-e2e-profiles');
