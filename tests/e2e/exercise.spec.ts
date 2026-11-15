import { expect, test } from '@playwright/test';

const seed = (page: import('@playwright/test').Page) =>
  page.addInitScript(() => {
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

test('exercise page states the fit and playback advances to the last chip', async ({ page }) => {
  await seed(page);
  await page.goto('/#/dev/exercise');
  await expect(page.getByTestId('fit-info')).toContainText('Tonic E3');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByTestId('count-in')).toBeVisible();
  await expect(page.getByTestId('chip-0')).toHaveAttribute('aria-current', 'true', { timeout: 10000 });
  await expect(page.getByTestId('chip-2')).toHaveAttribute('aria-current', 'true', { timeout: 10000 });
});

test('no range shows a link to range setup', async ({ page }) => {
  await page.goto('/#/dev/exercise');
  await expect(page.getByRole('link', { name: 'Set your range' })).toBeVisible();
});
