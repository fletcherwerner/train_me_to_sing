import { expect, test } from '@playwright/test';

const stored = (extra: object = {}) => ({
  version: 1,
  range: { lowMidi: 45, highMidi: 64, assessedAt: '2025-01-01T00:00:00.000Z' },
  settings: { latencyOffsetMs: 120 },
  progress: {},
  importedLessons: [],
  ...extra,
});

test('import: invalid file is rejected; valid file merges and keeps latency', async ({ page }) => {
  await page.addInitScript((d) => {
    if (!localStorage.getItem('tmts.v1')) localStorage.setItem('tmts.v1', JSON.stringify(d));
  }, stored());
  await page.goto('/#/settings');

  await page.getByTestId('import-file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"nope":true}'),
  });
  await expect(page.getByTestId('import-error')).toBeVisible();

  const incoming = stored({
    range: { lowMidi: 40, highMidi: 60, assessedAt: 'x' },
    settings: { latencyOffsetMs: 300 },
    progress: { 's1-01': { passed: true, bestScore: 1, attempts: 2, lastAttemptAt: '2025-02-02' } },
  });
  await page.getByTestId('import-file').setInputFiles({
    name: 'good.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(incoming)),
  });
  await expect(page.getByTestId('import-summary')).toContainText('Range E2–C4, 1 lesson passed');
  await page.getByRole('button', { name: 'Merge' }).click();

  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('tmts.v1')!));
  expect(data.progress['s1-01'].passed).toBe(true);
  expect(data.settings.latencyOffsetMs).toBe(120);
  expect(data.range.lowMidi).toBe(45);
});

test('export downloads a dated JSON file', async ({ page }) => {
  await page.addInitScript((d) => localStorage.setItem('tmts.v1', JSON.stringify(d)), stored());
  await page.goto('/#/settings');
  const download = page.waitForEvent('download');
  await page.getByTestId('export-button').click();
  expect((await download).suggestedFilename()).toMatch(/^train-me-to-sing-\d{4}-\d{2}-\d{2}\.json$/);
});
