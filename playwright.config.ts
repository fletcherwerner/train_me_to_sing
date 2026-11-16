import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'https://localhost:5173', ignoreHTTPSErrors: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev -- --strictPort',
      url: 'https://localhost:5173',
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
