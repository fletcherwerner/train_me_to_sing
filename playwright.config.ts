import { defineConfig, devices } from '@playwright/test';
import { E2E_PROFILES_DIR } from './tests/e2e/profilesDir';

// The e2e dev server has its own port so it never reuses a dev server you started by hand:
// that one would write test profiles into the real `profiles/` folder.
const E2E_URL = 'https://localhost:5174';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: E2E_URL, ignoreHTTPSErrors: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev -- --strictPort --port 5174',
      env: { TMTS_PROFILES_DIR: E2E_PROFILES_DIR },
      url: E2E_URL,
      ignoreHTTPSErrors: true,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      // Production build served as a real PWA, for the offline test.
      command: 'npm run build && npm run preview -- --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
