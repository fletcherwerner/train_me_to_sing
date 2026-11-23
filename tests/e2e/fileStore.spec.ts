import { expect, test, type Page } from '@playwright/test';

const SIZES = [
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'phone', width: 393, height: 852 },
];

const stored = (low: number, high: number) => ({
  version: 2,
  range: { lowMidi: low, highMidi: high, assessedAt: '2025-01-01T00:00:00.000Z' },
  settings: { latencyOffsetMs: 0 },
  progress: {},
  importedLessons: [],
});

/** Seeds localStorage (once) and optionally the dev memory file store (once per tab). */
const seed = (page: Page, local: object, file?: object) =>
  page.addInitScript(
    ([l, f]) => {
      if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', JSON.stringify(l));
      if (f && !sessionStorage.getItem('tmts.memfs')) {
        sessionStorage.setItem('tmts.memfs', JSON.stringify({ 'progress.json': JSON.stringify(f) }));
      }
    },
    [local, file] as const,
  );

for (const size of SIZES) {
  test.describe(`file store at ${size.name}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test('web: Settings shows no file line without ?filestore=memory', async ({ page }) => {
      await seed(page, stored(45, 64));
      await page.goto('/#/settings');
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
      await expect(page.getByTestId('file-save-status')).toHaveCount(0);
    });

    test('a change is saved to the file and Settings shows Last saved', async ({ page }) => {
      await seed(page, stored(45, 64));
      await page.goto('/#/settings?filestore=memory&sim=perfect');
      await expect(page.getByTestId('file-save-status')).toBeVisible();
      await page.getByRole('button', { name: '+10' }).click();
      await expect(page.getByTestId('file-save-status')).toContainText('Last saved');
      const files = await page.evaluate(() => JSON.parse(sessionStorage.getItem('tmts.memfs')!));
      expect(JSON.parse(files['progress.json']).settings.latencyOffsetMs).toBe(10);
      expect(Object.keys(files).some((k) => /^backups\/progress-\d{4}-\d{2}-\d{2}\.json$/.test(k))).toBe(true);
    });

    test('a valid file wins at launch: Home shows the file range', async ({ page }) => {
      await seed(page, stored(45, 64), stored(40, 60));
      await page.goto('/#/?filestore=memory&sim=perfect');
      await expect(page.getByTestId('home-range')).toContainText('E2 – C4');
    });

    test('an unreadable file is kept and a notice shows on Home', async ({ page }) => {
      await page.addInitScript(() => {
        if (!localStorage.getItem('tmts.v1')) {
          localStorage.setItem(
            'tmts.v1',
            JSON.stringify({ version: 2, range: { lowMidi: 45, highMidi: 64, assessedAt: 'x' }, settings: { latencyOffsetMs: 0 }, progress: {}, importedLessons: [] }),
          );
          sessionStorage.setItem('tmts.memfs', JSON.stringify({ 'progress.json': '{ broken' }));
        }
      });
      await page.goto('/#/?filestore=memory');
      await expect(page.getByTestId('file-unreadable-notice')).toBeVisible();
      await expect(page.getByTestId('home-range')).toContainText('A2 – E4');
      const files = await page.evaluate(() => JSON.parse(sessionStorage.getItem('tmts.memfs')!));
      expect(Object.keys(files).some((k) => k.startsWith('progress-unreadable-'))).toBe(true);
      expect(files['progress.json']).toContain('"version": 2');
    });
  });
}

test.describe('after a lesson', () => {
  test.setTimeout(120_000);
  test('Settings shows Last saved after a lesson', async ({ page }) => {
    await seed(page, {
      ...stored(45, 64),
      progress: { 's1b-01': { passed: false, bestScore: 1, attempts: 1, lastAttemptAt: '2026-11-01T00:00:00.000Z', level: 'prove', proofs: [], review: null } },
    });
    await page.goto('/#/?filestore=memory&sim=perfect');
    await page.getByTestId('lesson-s1b-01').click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByTestId('results-verdict')).toBeVisible({ timeout: 40000 });
    await page.getByRole('link', { name: 'Back to lessons' }).first().click();
    await page.getByRole('link', { name: /Settings/ }).click();
    await expect(page.getByTestId('file-save-status')).toContainText('Last saved');
  });
});
