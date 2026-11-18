import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

// These run against the production build served by `vite preview` (see playwright.config.ts).
const PREVIEW = 'http://localhost:4173';

test('build output has a manifest and a service worker', () => {
  expect(existsSync('dist/manifest.webmanifest')).toBe(true);
  expect(existsSync('dist/sw.js')).toBe(true);
  const m = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
  expect(m.short_name).toBe('Sing');
  expect(m.display).toBe('standalone');
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
});

test('home screen renders offline after the first visit', async ({ page, context }) => {
  // Seed a calibrated profile before every load so the home screen (not range setup) is shown.
  await page.addInitScript(() => {
    localStorage.setItem(
      'tmts.v1',
      JSON.stringify({
        version: 1,
        range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' },
        settings: { latencyOffsetMs: 0 },
        progress: {},
        importedLessons: [],
      }),
    );
  });
  await page.goto(`${PREVIEW}/#/`);
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Wait until the worker controls the page, so reloads are served from the precache.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15000 }).catch(async () => {
    await page.reload();
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('stage-1-count')).toBeVisible();
  await expect(page.getByTestId('lesson-s1a-01')).toBeVisible();
});
