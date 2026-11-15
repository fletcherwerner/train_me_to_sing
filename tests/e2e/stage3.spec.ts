import { expect, test } from '@playwright/test';

test.setTimeout(180_000);

test('sim=perfect: Stage 3 listed; We do Line 1 only; complete s3-01', async ({ page }) => {
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
  await expect(page.getByTestId('stage-3-count')).toHaveText('0 of 5 passed');
  await page.getByTestId('lesson-s3-01').click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('now-singing')).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Repeat' })).toBeVisible({ timeout: 40000 });
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByTestId('phrase-select').selectOption({ label: 'Line 1' });
  await page.getByRole('button', { name: 'Sing along' }).click();
  await expect(page.getByTestId('practice-line')).toHaveText('Practice run: 3 of 3 notes.', { timeout: 40000 });
  await expect(page.getByTestId('chip-2')).toHaveClass(/sequence-chip--hit/);
  await expect(page.getByTestId('chip-3')).toHaveCount(0);

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('phrase-select')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('results-verdict')).toHaveText('Passed', { timeout: 60000 });
  await expect(page.getByTestId('results-score')).toContainText('17 of 17');
  await page.getByRole('link', { name: 'Home' }).first().click();
  await expect(page.getByTestId('stage-3-count')).toHaveText('1 of 5 passed');
});

test('sim=silent: results group misses by line', async ({ page }) => {
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
  await page.goto('/#/lesson/s3-01?sim=silent');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Repeat' })).toBeVisible({ timeout: 40000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('results-verdict')).toHaveText('Not yet', { timeout: 60000 });
  await expect(page.getByTestId('missed-by-phrase')).toContainText('Line 3: 8 missed');
});
