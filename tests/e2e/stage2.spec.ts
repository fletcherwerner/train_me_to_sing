import { expect, test } from '@playwright/test';

test.setTimeout(120_000);

test('sim=perfect: complete s2-03; home shows Stage 2 1 of 8 passed', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('tmts.v1')) return;
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
  await page.goto('/#/?sim=perfect');
  await expect(page.getByTestId('stage-2-count')).toHaveText('0 of 8 passed');
  await expect(page.getByTestId('stage-2-note')).toBeVisible();
  await page.getByTestId('lesson-s2-03').click();
  await expect(page.getByTestId('lesson-tolerance')).toHaveText(
    'Pitch: within 40 cents · Hold: 60% of each note · Timing: within 0.3 s',
  );
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Repeat' })).toBeVisible({ timeout: 40000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Sing along' }).click();
  await expect(page.getByTestId('practice-line')).toBeVisible({ timeout: 40000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('results-verdict')).toHaveText('Passed', { timeout: 40000 });
  await page.getByRole('link', { name: 'Home' }).first().click();
  await expect(page.getByTestId('stage-2-count')).toHaveText('0 of 8 passed');
  await expect(page.getByTestId('status-s2-03')).toContainText('Passed once');
});

test('settings slider stores the offset; calibrate screen is reachable', async ({ page }) => {
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
  await page.goto('/#/settings');
  await page.getByTestId('latency-slider').fill('150');
  await expect(page.getByTestId('latency-value')).toHaveText('150 ms');
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('tmts.v1')!));
  expect(data.settings.latencyOffsetMs).toBe(150);
  await page.getByRole('link', { name: 'Calibrate timing' }).click();
  await expect(page.getByText("You'll hear 8 clicks", { exact: false })).toBeVisible();
});

test('calibration run shows progress, can be stopped, and reaches Save/Retry', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('tmts.v1')) return;
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
  await page.goto('/#/settings/calibrate?sim=calibrate:200');
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
  await page.getByTestId('calibrate-start').click();
  await expect(page.getByTestId('calibrate-beat')).toContainText('Count-in');
  await page.getByTestId('calibrate-stop').click();
  await expect(page.getByTestId('calibrate-start')).toBeVisible();
  await page.getByTestId('calibrate-start').click();
  await expect(page.getByTestId('calibrate-result')).toContainText('Measured delay', { timeout: 30000 });
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
